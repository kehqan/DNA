/* ============================================================
   Desk — Prompt Engine v2
   Template = an ordered array of BLOCKS. Each block is a card
   in the admin UI. Persisted in Supabase (shared across
   editors/devices), cached in localStorage for instant load.
   ============================================================ */
(function (global) {
  const SUPABASE_URL = 'https://yiewnykbchfadipznpet.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_SzVtJbVL--379ISTr-_-LQ_q0sDxshQ';
  const TABLE = 'prompt_templates';
  const ROW_ID = 'headline_prompt';
  const LOCAL_KEY = 'desk.si.promptBlocks.v2';

  /* Tokens available for insertion. `cond:true` = meaningful as a block's "show only if". */
  const TOKENS = [
    { key:'SITE',                 label:'Site name',               group:'Meta',     cond:false },
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

  const DEFAULT_BLOCKS = [
    { id:uid(), title:'Role & voice', showIf:'', enabled:true,
      body:'You are a senior headline editor at Radio Farda (RFE/RL Persian Service).\nYou write headlines that are accurate first, findable second, and never sensational.\nYou do not invent facts, overstate what the reporting supports, or write bait.' },
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
      body:'════════ YOUR TASK ════════\nWrite 6 headline options for the article above:\n  1–2  SEARCH-LED — built on the highest-value queries above. Front-load the term readers type.\n  3–4  DISCOVER-LED — echo the patterns winning above. Curiosity with substance, never bait.\n  5    STRAIGHT — the plain wire-service statement of what happened.\n  6    YOUR BEST — whatever genuinely serves this story best.\n\nFor EACH option give:\n  · The headline — Persian, under 70 characters where possible\n  · The query or pattern it targets, and why\n  · One risk or tradeoff it carries\n\nThen name the single strongest option and defend it in two sentences.\nFinally flag anything the current headline misrepresents, buries, or overstates.' },
    { id:uid(), title:'Constraints', showIf:'', enabled:true,
      body:'CONSTRAINTS: Persian output. No invented facts. No question-mark headlines unless the article genuinely poses one. Nothing the reporting does not support.' }
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

  /* ---------- local cache (instant load, offline fallback) ---------- */
  function loadLocal(){
    try { const raw = localStorage.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : null; }
    catch(e){ return null; }
  }
  function saveLocal(blocks){
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(blocks)); } catch(e){}
  }

  /* ---------- Supabase — source of truth, shared across editors ---------- */
  async function fetchRemote(){
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${ROW_ID}&select=blocks,updated_at`, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    });
    if (!res.ok) throw new Error(`Supabase read failed: HTTP ${res.status}`);
    const rows = await res.json();
    return rows[0] ? { blocks: rows[0].blocks, updated_at: rows[0].updated_at } : null;
  }
  async function saveRemote(blocks){
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify([{ id: ROW_ID, blocks, updated_at: new Date().toISOString() }])
    });
    if (!res.ok) throw new Error(`Supabase write failed: HTTP ${res.status} — ${await res.text()}`);
    return true;
  }

  /* getBlocks(): remote if reachable (also refreshes local cache), else local cache, else built-in default. */
  async function getBlocks(){
    try {
      const remote = await fetchRemote();
      if (remote && Array.isArray(remote.blocks) && remote.blocks.length){
        saveLocal(remote.blocks);
        return { blocks: remote.blocks, source: 'remote' };
      }
    } catch(e){ /* fall through */ }
    const local = loadLocal();
    if (local && local.length) return { blocks: local, source: 'local-cache' };
    return { blocks: DEFAULT_BLOCKS, source: 'default' };
  }

  global.PromptEngine = {
    TOKENS, DEFAULT_BLOCKS, assembleBlocks, substituteTokens,
    loadLocal, saveLocal, fetchRemote, saveRemote, getBlocks,
    uid
  };
})(window);
