/* ============================================================
   Desk — Prompt Engine v3
   Template = an ordered array of BLOCKS. Each block is a card
   in the admin UI. One template PER SERVICE ('fa' | 'en').

   v2 → v3 change: blocks used to be fetched/saved directly against
   Supabase using the public anon key (visible in this file, in the
   browser). That let anyone who opened dev tools rewrite the live
   prompt. v3 routes all reads/writes through the Apps Script backend,
   which requires a valid login session and uses a service_role key
   that never leaves the server.
   ============================================================ */
(function (global) {
  const LOCAL_KEY_PREFIX = 'desk.si.promptBlocks.v4.';

  /* One entry per RFE/RL property. Site code doubles as the site's ISO-ish
     language code, and matches what the Apps Script backend uses to select
     the right GSC property server-side. This list only drives display (the
     admin dropdown, badges) — the backend is the source of truth for access. */
  const SITES = {
    fa: { code:'fa', hostname:'radiofarda.com', label:'Persian — Radio Farda',        language:'Persian' },
    en: { code:'en', hostname:'rferl.org', label:'English — RFE/RL',             language:'English' },
    ru: { code:'ru', hostname:'svoboda.org', label:'Russian — Radio Svoboda',      language:'Russian' },
    uk: { code:'uk', hostname:'radiosvoboda.org', label:'Ukrainian — Radio Svoboda',    language:'Ukrainian' },
    hy: { code:'hy', hostname:'azatutyun.am', label:'Armenian — Azatutyun',         language:'Armenian' },
    ka: { code:'ka', hostname:'radiotavisupleba.ge', label:'Georgian — Radio Tavisupleba', language:'Georgian' },
    ro: { code:'ro', hostname:'moldova.europalibera.org', label:'Romanian — Moldova',           language:'Romanian' },
    sq: { code:'sq', hostname:'evropaelire.org', label:'Albanian — Kosovo',            language:'Albanian' }
  };
  const SITE_CODES = Object.keys(SITES);
  function siteOf(code){ return SITES[code] || SITES.fa; }

  /* Tokens available for insertion. `cond:true` = meaningful as a block's "show only if". */
  const TOKENS = [
    { key:'SITE',                 label:'Site name',               group:'Meta',     cond:false },
    { key:'TARGET_LANGUAGE',      label:'Target output language',  group:'Meta',     cond:false },
    { key:'DAYS',                 label:'Lookback window (days)',  group:'Meta',     cond:false },
    { key:'HEADLINE',             label:'Current headline',        group:'Article',  cond:true  },
    { key:'ARTICLE',              label:'Article body',            group:'Article',  cond:false },
    { key:'ARTICLE_WORDCOUNT',    label:'Article word count',      group:'Article',  cond:false },
    { key:'QUERY_TABLE',          label:'Query table rows',        group:'Search',   cond:true  },
    { key:'QUERY_COUNT',          label:'Query count',             group:'Search',   cond:false },
    { key:'OPPORTUNITY',          label:'Opportunity bullets',     group:'Search',   cond:true  },
    { key:'CANNIBALIZATION',      label:'Cannibalization bullets', group:'Search',   cond:true  },
    { key:'NO_QUERY_DATA',        label:'"No data" flag',          group:'Search',   cond:true  },
    { key:'DISCOVER',             label:'Discover bullets',        group:'Discover', cond:true  },
    { key:'DISCOVER_COUNT',       label:'Discover count',          group:'Discover', cond:false },
    { key:'DISCOVER_WINDOW_LABEL',label:'Discover window label',   group:'Discover', cond:false }
  ];

  const uid = () => 'b' + Math.random().toString(36).slice(2, 9);

  /* Built-in fallback if nothing has been saved yet for a service
     (Farsi wording — used verbatim for 'fa'; 'en' is the same structure
     with "Persian" swapped to "English", matching the live EN template). */
  const DEFAULT_BLOCKS = [
    { id:uid(), title:'Role & voice', showIf:'', enabled:true,
      body:'You are a senior headline editor at RFE/RL, writing for the {{TARGET_LANGUAGE}}-language service.\nYou write headlines that are accurate first, findable second, and never sensational.\nYou do not invent facts, overstate what the reporting supports, or write bait.' },
    { id:uid(), title:'Article — section header', showIf:'', enabled:true,
      body:'════════ THE ARTICLE ════════' },
    { id:uid(), title:'Current headline', showIf:'HEADLINE', enabled:true,
      body:'CURRENT HEADLINE: {{HEADLINE}}' },
    { id:uid(), title:'Article body', showIf:'', enabled:true,
      body:'{{ARTICLE}}' },
    { id:uid(), title:'Search data — header', showIf:'QUERY_TABLE', enabled:true,
      body:'════════ WHAT READERS ACTUALLY SEARCH ════════\nLive Google Search Console data for {{SITE}} — last {{DAYS}} days.\nThese are real queries this newsroom already ranks for. Position = current average rank.' },
    { id:uid(), title:'Query table', showIf:'QUERY_TABLE', enabled:true,
      body:'QUERY | CLICKS | IMPRESSIONS | CTR | POSITION | RANKING PAGE\n{{QUERY_TABLE}}' },
    { id:uid(), title:'Opportunity callout', showIf:'OPPORTUNITY', enabled:true,
      body:'OPPORTUNITY — high impressions, ranking below position 5. A sharper headline could move these:\n{{OPPORTUNITY}}' },
    { id:uid(), title:'Cannibalization warning', showIf:'CANNIBALIZATION', enabled:true,
      body:'CANNIBALIZATION WARNING — an existing article already ranks for these terms.\nIf the new article targets the same query, differentiate the headline from the archive piece below, or it competes with itself in search results:\n{{CANNIBALIZATION}}' },
    { id:uid(), title:'Fallback — no search history', showIf:'NO_QUERY_DATA', enabled:true,
      body:'════════ SEARCH DATA ════════\nNo Search Console history matched this story. It is likely breaking or genuinely novel.\nDo not chase established keywords — prioritise the plain words a reader would actually type.' },
    { id:uid(), title:'Discover winners', showIf:'DISCOVER', enabled:true,
      body:'════════ WHAT IS WINNING ON DISCOVER RIGHT NOW ════════\nTop {{SITE}} pages in Google Discover, {{DISCOVER_WINDOW_LABEL}}.\nStudy the HEADLINE PATTERNS — what earns the click here.\n\n{{DISCOVER}}' },
    { id:uid(), title:'Task instructions', showIf:'', enabled:true,
      body:'════════ YOUR TASK ════════\nWrite 5 headline options for the article above, in this exact mix and order:\n  1–2  SEARCH-LED — built on the highest-value queries above. Front-load the term readers type.\n  3–4  DISCOVER-LED — echo the patterns winning on Discover above. Curiosity with substance, never bait.\n  5    STRAIGHT — the plain wire-service statement of what happened.\n\nFor EACH headline:\n  · Written in {{TARGET_LANGUAGE}}, between 90–105 characters where possible.\n  · Think through what it targets (a query, a Discover pattern, or just the facts) and why that\'s the right call for this option.\n  · Think through the one real risk or tradeoff it carries.\n\nIf a current headline was supplied above, also assess it on the same terms: does it misrepresent, bury, or overstate anything the reporting actually supports? Or does it hold up?' },
    { id:uid(), title:'Constraints', showIf:'', enabled:true,
      body:'CONSTRAINTS: Output must be in {{TARGET_LANGUAGE}}. No invented facts. No question-mark headlines unless the article genuinely poses one. Nothing the reporting does not support.' }
  ];

  function substituteTokens(text, vars){
    return String(text||'').replace(/{{(\w+)}}/g, (m,key) =>
      (vars[key] !== undefined && vars[key] !== null) ? String(vars[key]) : '');
  }

  function assembleBlocks(blocks, vars){
    const parts = (blocks||[])
      .filter(b => b.enabled !== false)
      .filter(b => !b.showIf || (vars[b.showIf] !== undefined && String(vars[b.showIf]).trim() !== ''))
      .map(b => substituteTokens(b.body, vars));
    return parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /* ---------- local cache (instant load, offline fallback), per site ---------- */
  function loadLocal(site){
    try { const raw = localStorage.getItem(LOCAL_KEY_PREFIX + site); return raw ? JSON.parse(raw) : null; }
    catch(e){ return null; }
  }
  function saveLocal(site, blocks){
    try { localStorage.setItem(LOCAL_KEY_PREFIX + site, JSON.stringify(blocks)); } catch(e){}
  }

  /* ---------- backend (Apps Script — requires login, service_role on the server) ---------- */
  async function fetchRemote(site){
    if (typeof AuthEngine === 'undefined') throw new Error('AuthEngine not loaded — check auth-engine.js is included before prompt-engine.js');
    const res = await AuthEngine.authedPost({ mode:'getPromptBlocks', site });
    if (!res.ok) throw new Error(res.error || 'Failed to load prompt blocks');
    return { blocks: res.blocks, site: res.site };
  }
  async function saveRemote(site, blocks){
    if (typeof AuthEngine === 'undefined') throw new Error('AuthEngine not loaded — check auth-engine.js is included before prompt-engine.js');
    const res = await AuthEngine.authedPost({ mode:'savePromptBlocks', site, blocks });
    if (!res.ok) throw new Error(res.error || 'Failed to save prompt blocks');
    return true;
  }

  /* getBlocks(site): remote if reachable (also refreshes local cache), else local cache, else built-in default. */
  async function getBlocks(site){
    site = SITE_CODES.indexOf(site) !== -1 ? site : 'fa';
    try {
      const remote = await fetchRemote(site);
      if (remote && Array.isArray(remote.blocks) && remote.blocks.length){
        saveLocal(site, remote.blocks);
        return { blocks: remote.blocks, source: 'remote', site };
      }
    } catch(e){ /* fall through */ }
    const local = loadLocal(site);
    if (local && local.length) return { blocks: local, source: 'local-cache', site };
    return { blocks: DEFAULT_BLOCKS, source: 'default', site };
  }

  global.PromptEngine = {
    SITES, SITE_CODES, siteOf,
    TOKENS, DEFAULT_BLOCKS, assembleBlocks, substituteTokens,
    loadLocal, saveLocal, fetchRemote, saveRemote, getBlocks,
    uid
  };
})(window);
