/**
 * PilotDesk — Morning Briefing Liquid Glass Navbar
 * Self-contained injectable snippet.
 * Add ONE line before </body> in morning/index.html:
 *   <script src="./morning-nav.js"></script>
 *
 * Version: 1.1 · May 2026
 */
(function () {
  'use strict';

  /* ── STYLES ─────────────────────────────────────────── */
  const CSS = `
    /* Hide old masthead — belt AND braces */
    header.masthead,
    .masthead {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      position: absolute !important;
      pointer-events: none !important;
    }

    /* Remove the top padding the old masthead's sticky position created */
    body {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }

    /* Push content down exactly the height of the new nav pill */
    .wrap {
      padding-top: 62px !important;
    }

    /* ── Nav wrap (sticky) ── */
    #mb-nav-wrap {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      padding: 10px 20px 0;
      pointer-events: none;
    }

    /* ── Nav pill ── */
    #mb-nav-pill {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: rgba(26,57,72,0.86);
      backdrop-filter: blur(28px) saturate(2);
      -webkit-backdrop-filter: blur(28px) saturate(2);
      border: 1px solid rgba(255,255,255,0.11);
      border-radius: 100px;
      padding: 5px;
      box-shadow:
        0 8px 32px rgba(0,0,0,0.22),
        0 2px 8px rgba(0,0,0,0.14),
        inset 0 1px 0 rgba(255,255,255,0.14),
        inset 0 -1px 0 rgba(0,0,0,0.18);
      pointer-events: all;
      max-width: calc(100vw - 32px);
    }

    /* ← PilotDesk wordmark */
    #mb-nav-pill .mb-wordmark {
      font-family: 'Lora', 'Georgia', serif;
      font-size: 15px;
      font-weight: 400;
      color: rgba(248,247,246,0.90);
      padding: 6px 12px 6px 10px;
      border-right: 1px solid rgba(255,255,255,0.10);
      margin-right: 2px;
      white-space: nowrap;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 5px;
      text-decoration: none;
      transition: color 180ms;
      flex-shrink: 0;
    }
    #mb-nav-pill .mb-wordmark:hover { color: #fff; }
    #mb-nav-pill .mb-wordmark em {
      font-style: normal;
      color: #FF5400;
      font-weight: 600;
    }

    /* Active tool label */
    #mb-nav-pill .mb-tab-active {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: #fff;
      padding: 7px 13px;
      border-radius: 100px;
      background: rgba(255,255,255,0.13);
      white-space: nowrap;
      flex-shrink: 0;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.18),
        inset 0 -1px 0 rgba(0,0,0,0.12);
    }

    /* Separator */
    #mb-nav-pill .mb-sep {
      width: 1px;
      height: 18px;
      background: rgba(255,255,255,0.09);
      margin: 0 2px;
      flex-shrink: 0;
    }

    /* Action buttons */
    #mb-nav-pill .mb-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 11px;
      border-radius: 100px;
      border: none;
      background: transparent;
      color: rgba(185,204,204,0.72);
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background 150ms, color 150ms;
      flex-shrink: 0;
    }
    #mb-nav-pill .mb-btn:hover {
      background: rgba(255,255,255,0.10);
      color: rgba(248,247,246,0.92);
    }
    #mb-nav-pill .mb-btn.mb-saved { color: #4ADE80; }
    #mb-nav-pill .mb-btn svg { flex-shrink: 0; opacity: 0.72; }

    /* Narrow / sidebar */
    @media (max-width: 520px) {
      #mb-nav-wrap { padding: 8px 10px 0; }
      #mb-nav-pill .mb-btn span { display: none; }
      #mb-nav-pill .mb-btn { padding: 7px 9px; }
      #mb-nav-pill .mb-tab-active { font-size: 11px; padding: 7px 10px; }
      .wrap { padding-top: 54px !important; }
    }
  `;

  /* ── ICONS ──────────────────────────────────────────── */
  const ICON = {
    back:     `<svg width="11" height="11" viewBox="0 0 13 13" fill="none"><path d="M8 10L4 6.5 8 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    save:     `<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 2h8l2 2v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><rect x="4" y="2" width="5" height="3" rx=".5" stroke="currentColor" stroke-width="1.3"/><rect x="4" y="8" width="5" height="3" rx=".5" stroke="currentColor" stroke-width="1.3"/></svg>`,
    feedback: `<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1C3.686 1 1 3.358 1 6.25c0 1.682.872 3.178 2.25 4.172V12.5l2.23-1.337A7.12 7.12 0 007 11.5c3.314 0 6-2.358 6-5.25S10.314 1 7 1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M4.5 6.25h.007M7 6.25h.007M9.5 6.25h.007" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    settings: `<svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 8.5a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.2"/><path d="M10.8 6.5l-.02-.55 1.2-.93a.45.45 0 00.1-.55L10.96 2.5a.45.45 0 00-.55-.2l-1.4.55c-.28-.18-.6-.34-.93-.46L7.82.9A.45.45 0 007.38.5H5.62a.45.45 0 00-.44.38l-.27 1.5c-.33.12-.65.28-.93.46l-1.4-.55a.45.45 0 00-.55.2L.91 4.47a.45.45 0 00.1.55l1.2.93L2.2 6.5l.02.55-1.2.93a.45.45 0 00-.1.55l1.12 1.98c.11.2.35.28.55.2l1.4-.55c.28.18.6.34.93.46l.27 1.49c.06.22.24.38.44.38h1.76c.2 0 .38-.16.44-.38l.27-1.49c.33-.12.65-.28.93-.46l1.4.55c.2.08.44 0 .55-.2l1.12-1.98a.45.45 0 00-.1-.55l-1.2-.93z" stroke="currentColor" stroke-width="1.2"/></svg>`,
    check:    `<svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M2 7l3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  /* ── BUILD HTML ─────────────────────────────────────── */
  function buildNav() {
    return `
    <div id="mb-nav-wrap">
      <div id="mb-nav-pill">
        <a class="mb-wordmark" href="../">${ICON.back}Pilot<em>Desk</em></a>
        <div class="mb-tab-active">Morning Briefing</div>
        <div class="mb-sep"></div>
        <button class="mb-btn" id="mb-save-btn">${ICON.save}<span>Save setup</span></button>
        <button class="mb-btn" id="mb-feedback-btn">${ICON.feedback}<span>Feedback</span></button>
        <button class="mb-btn" id="mb-settings-btn">${ICON.settings}<span>Settings</span></button>
      </div>
    </div>`;
  }

  /* ── HIDE OLD MASTHEAD (belt AND braces) ────────────── */
  function killOldMasthead() {
    // Method 1: CSS already handles .masthead class
    // Method 2: Find the actual header element and nuke it directly
    const header = document.querySelector('header.masthead') ||
                   document.querySelector('.masthead') ||
                   document.querySelector('header');
    if (header) {
      header.style.cssText = `
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        position: absolute !important;
        pointer-events: none !important;
        top: -9999px !important;
      `;
    }
  }

  /* ── WIRE BUTTONS ───────────────────────────────────── */
  function wireButtons() {
    const saveBtn = document.getElementById('mb-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (typeof mastheadSave === 'function') mastheadSave();
        else if (typeof saveDefault === 'function') saveDefault();
        const orig = saveBtn.innerHTML;
        saveBtn.classList.add('mb-saved');
        saveBtn.innerHTML = `${ICON.check}<span>Saved</span>`;
        setTimeout(() => {
          saveBtn.classList.remove('mb-saved');
          saveBtn.innerHTML = orig;
        }, 2200);
      });
    }

    document.getElementById('mb-feedback-btn')?.addEventListener('click', () => {
      if (typeof openFeedback === 'function') openFeedback();
    });

    document.getElementById('mb-settings-btn')?.addEventListener('click', () => {
      if (typeof openSettings === 'function') openSettings();
    });
  }

  /* ── INIT ───────────────────────────────────────────── */
  function init() {
    // 1. Inject styles into <head>
    const style = document.createElement('style');
    style.id = 'mb-nav-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    // 2. Kill old masthead via direct DOM manipulation (not just CSS)
    killOldMasthead();

    // 3. Inject new nav at very top of body
    document.body.insertAdjacentHTML('afterbegin', buildNav());

    // 4. Wire action buttons
    wireButtons();

    // 5. Re-run killOldMasthead after a tick in case sticky re-paints
    requestAnimationFrame(killOldMasthead);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
