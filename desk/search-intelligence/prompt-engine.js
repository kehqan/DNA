/* ============================================================
   Desk — Prompt Engine
   Shared by Search Intelligence and its Admin page.
   One template, stored once, rendered two ways.
   ============================================================ */
(function (global) {
  const STORAGE_KEY = 'desk.si.promptTemplate';

  const DEFAULT_TEMPLATE =
`You are a senior headline editor at Radio Farda (RFE/RL Persian Service).
You write headlines that are accurate first, findable second, and never sensational.
You do not invent facts, overstate what the reporting supports, or write bait.

════════ THE ARTICLE ════════
{{#IF:HEADLINE}}CURRENT HEADLINE: {{HEADLINE}}

{{/IF}}{{ARTICLE}}

{{#IF:QUERY_TABLE}}════════ WHAT READERS ACTUALLY SEARCH ════════
Live Google Search Console data for {{SITE}} — last {{DAYS}} days.
These are real queries this newsroom already ranks for. Position = current average rank.

QUERY | CLICKS | IMPRESSIONS | CTR | POSITION | RANKING PAGE
{{QUERY_TABLE}}

{{/IF}}{{#IF:OPPORTUNITY}}OPPORTUNITY — high impressions, ranking below position 5. A sharper headline could move these:
{{OPPORTUNITY}}

{{/IF}}{{#IF:CANNIBALIZATION}}CANNIBALIZATION WARNING — an existing article already ranks for these terms.
If the new article targets the same query, differentiate the headline from the archive piece below, or it competes with itself in search results:
{{CANNIBALIZATION}}

{{/IF}}{{#IF:NO_QUERY_DATA}}════════ SEARCH DATA ════════
No Search Console history matched this story. It is likely breaking or genuinely novel.
Do not chase established keywords — prioritise the plain words a reader would actually type.

{{/IF}}{{#IF:DISCOVER}}════════ WHAT IS WINNING ON DISCOVER RIGHT NOW ════════
Top {{SITE}} pages in Google Discover, {{DISCOVER_WINDOW_LABEL}}.
Study the HEADLINE PATTERNS — what earns the click here.

{{DISCOVER}}

{{/IF}}════════ YOUR TASK ════════
Write 6 headline options for the article above:
  1–2  SEARCH-LED — built on the highest-value queries above. Front-load the term readers type.
  3–4  DISCOVER-LED — echo the patterns winning above. Curiosity with substance, never bait.
  5    STRAIGHT — the plain wire-service statement of what happened.
  6    YOUR BEST — whatever genuinely serves this story best.

For EACH option give:
  · The headline — Persian, under 70 characters where possible
  · The query or pattern it targets, and why
  · One risk or tradeoff it carries

Then name the single strongest option and defend it in two sentences.
Finally flag anything the current headline misrepresents, buries, or overstates.

CONSTRAINTS: Persian output. No invented facts. No question-mark headlines unless the article genuinely poses one. Nothing the reporting does not support.`;

  /* Every token available for insertion in the admin editor.
     `cond:true` means it's meaningful inside a {{#IF:KEY}}…{{/IF}} block. */
  const TOKENS = [
    { key:'SITE',                 label:'Site name',              group:'Meta',     cond:false },
    { key:'DAYS',                 label:'Lookback window (days)', group:'Meta',     cond:false },
    { key:'HEADLINE',             label:'Current headline',       group:'Article',  cond:true  },
    { key:'ARTICLE',              label:'Article body',           group:'Article',  cond:false },
    { key:'ARTICLE_WORDCOUNT',    label:'Article word count',     group:'Article',  cond:false },
    { key:'QUERY_TABLE',          label:'Query table rows',       group:'Search',   cond:true  },
    { key:'QUERY_COUNT',          label:'Query count',            group:'Search',   cond:false },
    { key:'OPPORTUNITY',          label:'Opportunity bullets',    group:'Search',   cond:true  },
    { key:'CANNIBALIZATION',      label:'Cannibalization bullets',group:'Search',   cond:true  },
    { key:'NO_QUERY_DATA',        label:'"No data" flag',         group:'Search',   cond:true  },
    { key:'DISCOVER',             label:'Discover bullets',       group:'Discover', cond:true  },
    { key:'DISCOVER_COUNT',       label:'Discover count',         group:'Discover', cond:false },
    { key:'DISCOVER_WINDOW_LABEL',label:'Discover window label',  group:'Discover', cond:false }
  ];

  function assemble(template, vars) {
    let out = String(template || '');
    // conditional blocks first, so their inner tokens still resolve afterwards
    out = out.replace(/{{#IF:(\w+)}}([\s\S]*?){{\/IF}}/g, (m, key, body) => {
      const v = vars[key];
      return (v !== undefined && v !== null && String(v).trim() !== '') ? body : '';
    });
    out = out.replace(/{{(\w+)}}/g, (m, key) =>
      (vars[key] !== undefined && vars[key] !== null) ? String(vars[key]) : '');
    return out.replace(/\n{3,}/g, '\n\n').trim();
  }

  function loadTemplate() {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_TEMPLATE; }
    catch (e) { return DEFAULT_TEMPLATE; }
  }
  function saveTemplate(t) {
    try { localStorage.setItem(STORAGE_KEY, t); return true; }
    catch (e) { return false; }
  }
  function resetTemplate() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }
  function isCustomized() {
    try { return localStorage.getItem(STORAGE_KEY) !== null; } catch (e) { return false; }
  }

  global.PromptEngine = { STORAGE_KEY, DEFAULT_TEMPLATE, TOKENS, assemble, loadTemplate, saveTemplate, resetTemplate, isCustomized };
})(window);
