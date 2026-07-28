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
 *   PromptEngine.SITE_CODES                     → ['fa','en','ru','uk','hy','ka','ro','sq']
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
 */
(function (global) {
  'use strict';

  /* =========================== site registry ===========================
     Mirrors SITES in Code.gs exactly — same 8 codes, same labels, same
     hostnames, same language names. If a site is ever added/renamed on
     the backend, update it here too or the two will silently disagree on
     what a site is called in the UI (the backend's copy is what actually
     enforces access; this one only drives display). */
  var SITES = {
    fa: { code: 'fa', label: 'Persian — Radio Farda',        hostname: 'radiofarda.com',           language: 'Persian' },
    en: { code: 'en', label: 'English — RFE/RL',             hostname: 'rferl.org',                language: 'English' },
    ru: { code: 'ru', label: 'Russian — Radio Svoboda',      hostname: 'svoboda.org',              language: 'Russian' },
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
     any extra logic beyond a truthiness check. */
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
     This is what a brand-new site (or a "Reset to default") starts from.
     Design notes, since this is the part that actually shapes headline
     quality:

     - Every data block is gated with showIf on the data's own token
       (QUERY_TABLE / DISCOVER / TRENDING_NOW) rather than always shown —
       an empty "SEARCH CONSOLE DATA:\n" section with nothing under it is
       worse than no section at all; it reads to the model as "there was
       supposed to be something here."
     - TRENDING_NOW gets an explicit instruction to surface real overlap
       in the ADVANTAGE line and NOT invent a connection — asking for
       overlap-awareness without that guardrail tends to produce headlines
       that force a trending word in for its own sake.
     - Quantity (5, split across three named strategies) matches what the
       rest of the product already tells users to expect (see the
       onboarding coach-mark copy: "Five AI options come from what you
       pasted") — change this here if that copy ever changes too.
     - The output format itself (the ### HEADLINE / GROUP / TEXT /
       ADVANTAGE / RISK contract) is intentionally NOT a card here — it's
       appended separately by buildOutputContract() in index.html, in
       whichever language the site's headline UI is in, because it's
       parsing-critical wire-format instruction, not editorial content an
       admin should be able to accidentally disable or reorder. */
  var DEFAULT_BLOCKS = [
    {
      id: 'role', title: 'Role & context', showIf: '', enabled: true,
      body:
        'You are the in-house SEO and audience-development editor for {{SITE}}, an RFE/RL {{TARGET_LANGUAGE}}-language ' +
        'news service. You write headlines the way a sharp wire-service editor would: accurate to the reporting, ' +
        'native-sounding in {{TARGET_LANGUAGE}}, and tuned to how real readers actually search for and discover this ' +
        'story — never clickbait, never a claim the article does not support.'
    },
    {
      id: 'task', title: 'Task', showIf: '', enabled: true,
      body:
        'Propose 5 headline options in {{TARGET_LANGUAGE}}, distributed across three strategies:\n' +
        '- SEARCH — optimized to match how people are actually querying Google for this story (use the Search Console ' +
        'data below)\n' +
        '- DISCOVER — optimized for the Google Discover feed, competing for a swipe/tap in a mobile feed rather than a ' +
        'search result\n' +
        '- STRAIGHT — a clean, editorially conventional headline with no SEO angle at all — the version you would run ' +
        'if search and Discover did not exist\n' +
        'Include at least one STRAIGHT headline and a mix of SEARCH/DISCOVER for the rest. Every headline must be ' +
        'something the article actually supports — never invent a detail, a number, or a quote to make a headline ' +
        'stronger.'
    },
    {
      id: 'article', title: 'Article', showIf: '', enabled: true,
      body:
        'Current headline (if any): {{HEADLINE}}\n\n' +
        'Article text ({{ARTICLE_WORDCOUNT}} words):\n{{ARTICLE}}'
    },
    {
      id: 'search_data', title: 'Search Console data', showIf: 'QUERY_TABLE', enabled: true,
      body:
        'SEARCH CONSOLE — last {{DAYS}} days, {{QUERY_COUNT}} queries already driving traffic to this story or its ' +
        'topic (columns: query | clicks | impressions | CTR | avg. position | landing page):\n{{QUERY_TABLE}}\n\n' +
        'Underserved opportunities — real search demand this article could capture better (high impressions, weak ' +
        'position or clicks):\n{{OPPORTUNITY}}\n\n' +
        'Cannibalization risk — other live pages already ranking for these exact queries; a SEARCH headline that ' +
        'duplicates their phrasing competes with your own site\'s existing page instead of this new one:\n{{CANNIBALIZATION}}'
    },
    {
      id: 'no_search_data', title: 'No search history yet', showIf: 'NO_QUERY_DATA', enabled: true,
      body:
        'No Search Console history exists yet for this topic — this is breaking or unusually fresh ground. Do not ' +
        'force a SEARCH-style headline around invented query data; lean on DISCOVER and STRAIGHT instead. If you do ' +
        'write a SEARCH-leaning headline, base it on the most obvious, high-intent terms a reader would type given ' +
        'the article alone.'
    },
    {
      id: 'discover_data', title: 'Discover feed data', showIf: 'DISCOVER', enabled: true,
      body:
        'GOOGLE DISCOVER — top-performing related pages from {{DISCOVER_WINDOW_LABEL}} ({{DISCOVER_COUNT}} pages), ' +
        'showing what phrasing and framing is already working with this feed\'s readers:\n{{DISCOVER}}'
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
      id: 'constraints', title: 'Constraints', showIf: '', enabled: true,
      body:
        'Constraints:\n' +
        '- Write only in {{TARGET_LANGUAGE}} — no mixed-language headlines.\n' +
        '- Every headline must scan in few seconds — no subheads, no colon stacking two ideas unless that is ' +
        'genuinely this service\'s house style.\n' +
        '- Never state something the article does not report. No invented statistics, quotes, or outcomes.\n' +
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
       'default'     — no saved template exists yet (brand-new site) OR
                       both the network call and the local cache failed;
                       either way, DEFAULT_BLOCKS above is what's shown */
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
