/**
 * PromptEngine — the shared brain behind the headline-prompt system.
 * Loaded by both Search Intelligence (index.html) and Prompt Admin
 * (admin.html). Neither file talks to Supabase or builds prompt text on
 * its own — everything about *what tokens exist*, *what the default
 * template says*, and *how a template turns into a prompt string* lives
 * here, so the two pages can never drift out of sync with each other.
 *
 * PUBLIC API (used by index.html and admin.html — keep this contract
 * stable, both pages call these by name):
 *   PromptEngine.SITE_CODES                     → ['fa','en','ru','ct','uk','hy','ka','ro','sq']
 *   PromptEngine.siteOf(code)                    → { code, label, hostname, language }
 *   PromptEngine.TOKENS                          → [{ key, group, cond? }, ...]
 *   PromptEngine.DEFAULT_BLOCKS                  → [{ id, title, showIf, enabled, body }, ...]
 *   PromptEngine.uid()                           → short unique block id
 *   PromptEngine.assembleBlocks(blocks, vars)     → final prompt string
 *   PromptEngine.getBlocks(site)                  → async { blocks, source }
 *   PromptEngine.saveRemote(site, blocks)          → async, throws on failure
 *   PromptEngine.saveLocal(site, blocks)           → sync, browser-only cache
 *
 * This file does its own network calls through AuthEngine.authedPost —
 * it never touches fetch()/UrlFetchApp directly, so auth-engine.js must
 * be loaded first (both pages already load it first).
 *
 * IMPORTANT — how a site actually gets its prompt: getBlocks(site) checks
 * Supabase's prompt_templates table FIRST. Only a site with no saved row
 * there falls back to DEFAULT_BLOCKS below. That means editing this file
 * only affects sites with no saved override — a site an admin has ever
 * hit "Save & publish" on on will keep using its own saved copy forever,
 * frozen at whatever it looked like on that save, until someone opens
 * Prompt Admin and either edits it directly or hits "Reset to default"
 * + "Save & publish" again. As of 2026-07-28, no site has a saved
 * override — every site reads this file directly. Keep it that way
 * unless a site genuinely needs to diverge from the shared template.
 */
(function (global) {
  'use strict';

  /* =========================== site registry ===========================
     Mirrors SITES in Code.gs exactly — same 9 codes, same labels, same
     hostnames, same language names. If a site is ever added/renamed on
     the backend, update it here too or the two will silently disagree on
     what a site is called in the UI (the backend's copy is what actually
     enforces access; this one only drives display). */
  var SITES = {
    fa: { code: 'fa', label: 'Persian — Radio Farda',        hostname: 'radiofarda.com',           language: 'Persian' },
    en: { code: 'en', label: 'English — RFE/RL',             hostname: 'rferl.org',                language: 'English' },
    ru: { code: 'ru', label: 'Russian — Radio Svoboda',      hostname: 'svoboda.org',              language: 'Russian' },
    ct: { code: 'ct', label: 'Russian — Current Time',       hostname: 'currenttime.tv',           language: 'Russian' },
    uk: { code: 'uk', label: 'Ukrainian — Radio Svoboda',    hostname: 'radiosvoboda.org',         language: 'Ukrainian' },
    hy: { code: 'hy', label: 'Armenian — Azatutyun',         hostname: 'azatutyun.am',             language: 'Armenian' },
    ka: { code: 'ka', label: 'Georgian — Radio Tavisupleba', hostname: 'radiotavisupleba.ge',      language: 'Georgian' },
    ro: { code: 'ro', label: 'Romanian — Moldova',           hostname: 'moldova.europalibera.org', language: 'Romanian' },
    sq: { code: 'sq', label: 'Albanian — Kosovo',            hostname: 'evropaelire.org',          language: 'Albanian' }
  };
  var SITE_CODES = Object.keys(SITES);
  function siteOf(code) { return SITES[code] || SITES.fa; }

  /* =========================== tokens ===========================
     `cond: true` marks a token as usable in a card's "show only if"
     dropdown, in addition to being insertable as {{TOKEN}} text. A cond
     token is just any variable checked for truthiness — a non-empty
     string, a non-zero number, or the literal '1' flag some booleans use
     (NO_QUERY_DATA / NO_TRENDING_NOW) — so both "show this card only when
     there IS data" (showIf: 'QUERY_TABLE') and "show this card only when
     there's NO data" (showIf: 'NO_QUERY_DATA') are expressible without
     any extra logic beyond a truthiness check.

     Deliberately NOT included as cond tokens: HEADLINE and CANNIBALIZATION.
     A previous version of this file (or an old manual edit — the exact
     history wasn't recoverable) had the live 'fa' template's Article block
     gated on showIf:'HEADLINE' and its Constraints block gated on
     showIf:'CANNIBALIZATION' — which meant the article text vanished from
     the prompt on any story without a pre-existing headline, and the
     house-style constraints vanished on any story without a search
     cannibalization conflict (i.e. almost always). Neither block should
     ever be conditional, so DEFAULT_BLOCKS below hardcodes both as always-
     shown rather than exposing them as toggleable — see the Article and
     Constraints blocks. */
  var TOKENS = [
    { key: 'SITE',                 group: 'Site' },
    { key: 'TARGET_LANGUAGE',      group: 'Site' },

    { key: 'HEADLINE',             group: 'Article' },
    { key: 'ARTICLE',              group: 'Article' },
    { key: 'ARTICLE_WORDCOUNT',    group: 'Article' },

    { key: 'DAYS',                 group: 'Search data' },
    { key: 'QUERY_TABLE',          group: 'Search data', cond: true },
    { key: 'QUERY_COUNT',          group: 'Search data' },
    { key: 'OPPORTUNITY',          group: 'Search data' },
    { key: 'CANNIBALIZATION',      group: 'Search data' },
    { key: 'NO_QUERY_DATA',        group: 'Search data', cond: true },

    { key: 'DISCOVER',             group: 'Discover data', cond: true },
    { key: 'DISCOVER_COUNT',       group: 'Discover data' },
    { key: 'DISCOVER_WINDOW_LABEL',group: 'Discover data' },

    { key: 'TRENDING_NOW',         group: 'Trending now', cond: true },
    { key: 'NO_TRENDING_NOW',      group: 'Trending now', cond: true }
  ];

  /* =========================== default template ===========================
     This is what every site reads today (see the note at the top of the
     file), and what a "Reset to default" restores. Folds in the best of
     what was previously hand-tuned per-site in Supabase — the English
     template's section dividers, explicit SEARCH/DISCOVER/STRAIGHT
     numbering, and "does the current headline hold up" check were
     genuinely good and now benefit all 8 sites instead of just one.

     Design notes:
     - Article is NEVER conditional (see the TOKENS comment above) — it's
       one block, always shown, headline + body together, so there's no
       showIf to ever misconfigure into hiding it.
     - Every DATA block (search, no-search-fallback, Discover, Trending
       Now) is gated on that data's own token rather than always shown —
       an empty "SEARCH CONSOLE DATA:" section with nothing under it reads
       to the model as "there was supposed to be something here."
     - Constraints is NEVER conditional either, for the same reason as
       Article — house style should apply to every generation, not just
       ones with a particular kind of search data present.
     - TRENDING_NOW carries an explicit guardrail: name a real overlap,
       never force one. Asking for overlap-awareness without that second
       half tends to produce headlines that shoehorn a trending word in
       for its own sake.
     - The output format itself (### HEADLINE / GROUP / TEXT / ADVANTAGE /
       RISK) is intentionally NOT a card here — it's appended separately
       by buildOutputContract() in index.html, in whichever language the
       site's headline UI is in, because it's parsing-critical wire-format
       instruction, not editorial content an admin should be able to
       accidentally disable or reorder. */
  var DEFAULT_BLOCKS = [
    {
      id: 'role', title: 'Role & voice', showIf: '', enabled: true,
      body:
        'You are a senior headline editor for {{SITE}}, an RFE/RL {{TARGET_LANGUAGE}}-language news service. You write ' +
        'headlines that are accurate first, findable second, and never sensational — native-sounding in ' +
        '{{TARGET_LANGUAGE}}, tuned to how real readers actually search for and discover this story, and never a claim ' +
        'the reporting does not support.'
    },
    {
      id: 'article', title: 'Article', showIf: '', enabled: true,
      body:
        '════════ THE ARTICLE ════════\n' +
        'Current headline (if any): {{HEADLINE}}\n\n' +
        'Article text ({{ARTICLE_WORDCOUNT}} words):\n{{ARTICLE}}'
    },
    {
      id: 'search_data', title: 'Search Console data', showIf: 'QUERY_TABLE', enabled: true,
      body:
        '════════ WHAT READERS ACTUALLY SEARCH ════════\n' +
        'Live Search Console data for {{SITE}} — last {{DAYS}} days, {{QUERY_COUNT}} queries already driving traffic ' +
        'to this story or its topic (columns: query | clicks | impressions | CTR | avg. position | landing page):\n' +
        '{{QUERY_TABLE}}\n\n' +
        'OPPORTUNITY — high impressions, weak position or clicks. A sharper headline could move these:\n{{OPPORTUNITY}}\n\n' +
        'CANNIBALIZATION WARNING — other live pages already rank for these exact queries. A SEARCH headline that ' +
        'duplicates their phrasing competes with your own site\'s existing page instead of this new one:\n{{CANNIBALIZATION}}'
    },
    {
      id: 'no_search_data', title: 'No search history yet', showIf: 'NO_QUERY_DATA', enabled: true,
      body:
        '════════ SEARCH DATA ════════\n' +
        'No Search Console history matched this story — it is likely breaking or genuinely novel. Do not force a ' +
        'SEARCH-style headline around invented query data; lean on DISCOVER and STRAIGHT instead. If you do write a ' +
        'SEARCH-leaning headline, base it on the most obvious, high-intent terms a reader would type given the ' +
        'article alone.'
    },
    {
      id: 'discover_data', title: 'Discover feed data', showIf: 'DISCOVER', enabled: true,
      body:
        '════════ WHAT IS WINNING ON DISCOVER RIGHT NOW ════════\n' +
        'Top {{SITE}} pages in Google Discover, {{DISCOVER_WINDOW_LABEL}} ({{DISCOVER_COUNT}} pages). Study the ' +
        'headline patterns — what earns the click here:\n{{DISCOVER}}'
    },
    {
      id: 'trending_now', title: 'Trending now', showIf: 'TRENDING_NOW', enabled: true,
      body:
        'GOOGLE TRENDS — TRENDING NOW for {{SITE}}\'s region, refreshed within the last 48 hours:\n{{TRENDING_NOW}}\n\n' +
        'If any of these trending terms genuinely overlap this article\'s subject — a person, a place, an event it ' +
        'covers — say so explicitly in the ADVANTAGE line of the relevant headline; that overlap is real, timely ' +
        'search demand worth naming. Do not force a connection that is not actually there — a coincidentally shared ' +
        'word is not an overlap.'
    },
    {
      id: 'task', title: 'Task', showIf: '', enabled: true,
      body:
        '════════ YOUR TASK ════════\n' +
        'Write 5 headline options for the article above, in this exact mix and order:\n' +
        '  1–2  SEARCH-LED — built on the highest-value queries above. Front-load the term readers actually type.\n' +
        '  3–4  DISCOVER-LED — echo the patterns winning on Discover above. Curiosity with substance, never bait.\n' +
        '  5    STRAIGHT — the plain, editorially conventional statement of what happened. No SEO angle at all.\n\n' +
        'For EACH headline:\n' +
        '  · Write in {{TARGET_LANGUAGE}}, between 90–105 characters where possible.\n' +
        '  · Never state something the article does not report — no invented facts, statistics, quotes, or outcomes.\n' +
        '  · If a trending term or search query genuinely overlaps this headline\'s angle, say so in ADVANTAGE — never ' +
        'force a connection that is not really there.\n\n' +
        'If a current headline was supplied above, also judge it on the same terms: does it misrepresent, bury, or ' +
        'overstate anything the reporting actually supports — or does it hold up?'
    },
    {
      id: 'constraints', title: 'Constraints', showIf: '', enabled: true,
      body:
        'CONSTRAINTS:\n' +
        '- {{TARGET_LANGUAGE}} output only — no mixed-language headlines.\n' +
        '- No question-mark headlines unless the article genuinely poses one.\n' +
        '- Avoid manufactured urgency (\u201cBREAKING\u201d, excessive punctuation, ALL CAPS) unless the article itself ' +
        'is breaking news.\n' +
        '- A SEARCH headline should read like a headline, not a keyword list — natural phrasing that happens to ' +
        'contain the target query, never an awkward string of terms.'
    }
  ];

  /* =========================== id generation =========================== */
  function uid() {
    return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* =========================== assembly =========================== */
  function truthy(v) {
    if (v === undefined || v === null) return false;
    if (typeof v === 'number') return v !== 0;
    return String(v).trim().length > 0;
  }
  /* Unknown tokens are left as literal {{LIKE_THIS}} rather than silently
     dropped — a typo'd token name in a card body should be visible in the
     preview (and therefore in the actual prompt) rather than vanishing,
     which is a much easier bug to spot and fix from the admin UI. */
  function substituteTokens(text, vars) {
    return String(text || '').replace(/\{\{(\w+)\}\}/g, function (whole, key) {
      if (!Object.prototype.hasOwnProperty.call(vars, key)) return whole;
      var v = vars[key];
      return (v === undefined || v === null) ? '' : String(v);
    });
  }
  function assembleBlocks(blocks, vars) {
    vars = vars || {};
    return (blocks || [])
      .filter(function (b) { return b && b.enabled !== false; })
      .filter(function (b) { return !b.showIf || truthy(vars[b.showIf]); })
      .map(function (b) { return substituteTokens(b.body, vars).trim(); })
      .filter(Boolean)
      .join('\n\n');
  }

  /* =========================== storage =========================== */
  var LOCAL_KEY_PREFIX = 'desk_prompt_blocks_v1_';
  function localKey(site) { return LOCAL_KEY_PREFIX + site; }

  function saveLocal(site, blocks) {
    try {
      localStorage.setItem(localKey(site), JSON.stringify({ blocks: blocks, savedAt: Date.now() }));
    } catch (e) {
      // Private browsing / storage quota — local cache is a nice-to-have
      // fallback, never allowed to break the save-and-publish flow itself.
    }
  }
  function loadLocal(site) {
    try {
      var raw = localStorage.getItem(localKey(site));
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed.blocks) ? parsed.blocks : null;
    } catch (e) {
      return null;
    }
  }

  /* Reads the shared, Supabase-backed template for a site. Three possible
     outcomes, distinguished by `source` (index.html and admin.html both
     branch on this exact string):
       'remote'      — loaded fine, this is the live shared template
       'local-cache' — Supabase unreachable, fell back to this browser's
                       last-known copy of that site's template
       'default'     — no saved template exists yet (brand-new site, or
                       every site as of 2026-07-28 — see the file header)
                       OR both the network call and the local cache
                       failed; either way, DEFAULT_BLOCKS above is shown

     Current Time TV ('ct') is transparently aliased to Radio Svoboda's
     ('ru') template on the backend (see CONTENT_ALIAS in Code.gs) — a
     request for site 'ct' here returns whatever's saved under 'ru',
     which is intentional: they're the same language/audience and should
     never drift into two separately-tuned prompts. */
  async function getBlocks(site) {
    try {
      var res = await AuthEngine.authedPost({ mode: 'getPromptBlocks', site: site });
      if (res && res.ok) {
        if (Array.isArray(res.blocks) && res.blocks.length) {
          saveLocal(site, res.blocks); // keep the offline fallback fresh
          return { blocks: res.blocks, source: 'remote' };
        }
        return { blocks: JSON.parse(JSON.stringify(DEFAULT_BLOCKS)), source: 'default' };
      }
      throw new Error((res && res.error) || 'Failed to load prompt template');
    } catch (err) {
      var cached = loadLocal(site);
      if (cached) return { blocks: cached, source: 'local-cache' };
      return { blocks: JSON.parse(JSON.stringify(DEFAULT_BLOCKS)), source: 'default' };
    }
  }

  /* Publishes to Supabase via savePromptBlocks — throws on failure so
     callers (admin.html's Save button) can show the real error message
     rather than a generic failure. Does NOT also saveLocal(); admin.html
     calls saveLocal() itself right after a successful saveRemote(), so a
     network hiccup between the two calls can't leave the local cache
     claiming a save succeeded when Supabase never actually got it. */
  async function saveRemote(site, blocks) {
    var res = await AuthEngine.authedPost({ mode: 'savePromptBlocks', site: site, blocks: blocks });
    if (!res || !res.ok) throw new Error((res && res.error) || 'Save failed');
    return true;
  }

  global.PromptEngine = {
    SITE_CODES: SITE_CODES,
    siteOf: siteOf,
    TOKENS: TOKENS,
    DEFAULT_BLOCKS: DEFAULT_BLOCKS,
    uid: uid,
    assembleBlocks: assembleBlocks,
    getBlocks: getBlocks,
    saveRemote: saveRemote,
    saveLocal: saveLocal
  };
})(window);
