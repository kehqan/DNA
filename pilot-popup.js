/**
 * PilotDesk — Pilot Popup + Animation
 * Self-contained injectable snippet.
 * Drop <script src="pilot-popup.js"></script> before </body> in index.html.
 *
 * On pilot click: speech bubble (left) + workflow animation (right) appear together.
 * Requires pilotdesk-animation.html in the same folder as index.html.
 *
 * Version: 2.0 · May 2026
 */
(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────── */
  const VERSION    = 'v1.5 · May 2026';
  const TEAM       = 'Digital Transformation Department · RFE/RL';
  const DISCLAIMER = 'Not an official Microsoft product.';
  const ANIM_SRC   = './pilotdesk-animation.html';

  const MISSION = 'PilotDesk turns your editorial context into precision Copilot prompts. You fill the form — I build the prompt — you paste it in Outlook and fly.';

  const STEPS = [
    { icon: '📋', label: 'Fill the form',    desc: 'Role, depth, focus, context' },
    { icon: '📋', label: 'Copy the prompt',  desc: 'One click, clipboard ready'  },
    { icon: '✈️', label: 'Paste in Copilot', desc: 'Outlook sidebar, hit Enter'  },
  ];

  const TOOLS = [
    { emoji: '🌅', name: 'Morning Briefing',    role: 'Daily intelligence brief',   href: './morning'   },
    { emoji: '🔍', name: 'Bias Detector',        role: 'Editorial bias analysis',    href: './bias'      },
    { emoji: '🧠', name: 'Memory Hunter',        role: 'Context & source recall',    href: './memory'    },
    { emoji: '🎙️', name: 'Meeting Recap',        role: 'Meeting to action items',    href: './meeting'   },
    { emoji: '✅', name: 'Fact-Check Assistant', role: 'Claim verification prompt',  href: './factcheck' },
  ];

  /* ── STYLES ─────────────────────────────────────────── */
  const CSS = `
    #pd-popup-overlay {
      position: fixed; inset: 0; z-index: 900;
      pointer-events: none;
    }
    #pd-popup-overlay.open { pointer-events: all; }

    /* Outer wrapper — holds bubble + animation side by side */
    #pd-panel {
      position: absolute;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      opacity: 0;
      transform: scale(0.92) translateY(-8px);
      transform-origin: top right;
      transition: opacity 240ms cubic-bezier(0.25,0.46,0.45,0.94),
                  transform 240ms cubic-bezier(0.25,0.46,0.45,0.94);
      pointer-events: none;
    }
    #pd-panel.open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: all;
    }

    /* ── LEFT: speech bubble — compact companion ── */
    #pd-bubble {
      width: 220px;
      flex-shrink: 0;
      position: relative;
    }

    .pd-tail {
      position: absolute;
      top: -10px; right: 22px;
      width: 20px; height: 12px;
      overflow: visible;
    }
    .pd-tail-path {
      fill: rgba(255,255,255,0.82);
      stroke: rgba(255,255,255,0.90);
      stroke-width: 1;
      filter: drop-shadow(0 -2px 3px rgba(26,57,72,0.06));
    }

    .pd-card {
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(24px) saturate(1.9);
      -webkit-backdrop-filter: blur(24px) saturate(1.9);
      border: 1px solid rgba(255,255,255,0.90);
      border-radius: 16px;
      box-shadow:
        0 12px 40px rgba(26,57,72,0.14),
        0 2px 8px rgba(26,57,72,0.08),
        inset 0 1px 0 rgba(255,255,255,0.95),
        inset 0 -1px 0 rgba(26,57,72,0.03);
      overflow: hidden;
      font-family: 'Noto Sans', system-ui, sans-serif;
      color: #1A3948;
    }

    .pd-header {
      background: #1A3948;
      padding: 13px 14px 12px;
      display: flex; gap: 10px; align-items: flex-start;
    }
    .pd-avatar {
      width: 32px; height: 32px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pd-avatar svg { width: 20px; height: 20px; }
    .pd-speech { flex: 1; }
    .pd-name {
      font-size: 9.5px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(255,255,255,0.45); margin-bottom: 3px;
    }
    .pd-quote {
      font-family: 'Lora', Georgia, serif;
      font-size: 12.5px; font-style: italic;
      color: rgba(248,247,246,0.92);
      line-height: 1.5;
    }
    .pd-close {
      background: rgba(255,255,255,0.10);
      border: none; border-radius: 6px;
      width: 22px; height: 22px;
      cursor: pointer; color: rgba(255,255,255,0.55);
      font-size: 12px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: background 150ms, color 150ms;
    }
    .pd-close:hover { background: rgba(255,255,255,0.20); color: #fff; }

    .pd-body { padding: 12px 14px 4px; }

    .pd-steps { display: flex; gap: 0; margin-bottom: 12px; }
    .pd-step {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; text-align: center;
      padding: 0 3px; position: relative;
    }
    .pd-step:not(:last-child)::after {
      content: '';
      position: absolute; right: -1px; top: 12px;
      width: 1px; height: 16px;
      background: rgba(26,57,72,0.10);
    }
    .pd-step-icon   { font-size: 16px; line-height: 1; margin-bottom: 4px; }
    .pd-step-num    { font-size: 9px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #FF5400; margin-bottom: 2px; }
    .pd-step-label  { font-size: 10.5px; font-weight: 600; color: #1A3948; line-height: 1.3; margin-bottom: 1px; }
    .pd-step-desc   { font-size: 9.5px; color: rgba(26,57,72,0.48); line-height: 1.4; }

    .pd-div { height: 1px; background: rgba(26,57,72,0.07); margin: 0 -14px 10px; }

    .pd-tools-label {
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(26,57,72,0.38); margin-bottom: 6px;
    }
    .pd-tools { display: flex; flex-direction: column; gap: 0px; margin-bottom: 10px; }
    .pd-tool {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: 8px;
      text-decoration: none; color: inherit;
      transition: background 130ms;
    }
    .pd-tool:hover { background: rgba(26,57,72,0.05); }
    .pd-tool-icon { font-size: 13px; flex-shrink: 0; }
    .pd-tool-name { font-size: 11.5px; font-weight: 600; color: #1A3948; flex: 1; line-height: 1; }
    .pd-tool-role { font-size: 10px; color: rgba(26,57,72,0.45); white-space: nowrap; }
    .pd-tool-arr  { font-size: 10px; color: rgba(26,57,72,0.25); margin-left: 2px; }

    .pd-footer {
      background: rgba(26,57,72,0.03);
      border-top: 1px solid rgba(26,57,72,0.06);
      padding: 7px 14px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .pd-footer-left { font-size: 9.5px; color: rgba(26,57,72,0.38); line-height: 1.4; }
    .pd-version     { font-size: 9px; font-weight: 700; letter-spacing: 0.07em; color: rgba(255,84,0,0.55); white-space: nowrap; }

    /* ── RIGHT: animation panel — hero frame ── */
    #pd-anim-panel {
      flex-shrink: 0;
      width: 580px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow:
        0 12px 40px rgba(26,57,72,0.16),
        0 2px 8px rgba(26,57,72,0.08);
      border: 1px solid rgba(255,255,255,0.90);
      background: #F0EFED;
      position: relative;
    }

    /* "See it in action" label above iframe */
    #pd-anim-label {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 28px;
      background: rgba(26,57,72,0.88);
      backdrop-filter: blur(8px);
      display: flex; align-items: center;
      padding: 0 12px;
      gap: 7px;
      z-index: 2;
    }
    #pd-anim-label span {
      font-family: 'Noto Sans', system-ui, sans-serif;
      font-size: 10px; font-weight: 600;
      letter-spacing: 0.06em; text-transform: uppercase;
      color: rgba(248,247,246,0.70);
    }
    #pd-anim-label-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #FF5400;
      animation: pd-pulse 2s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes pd-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,84,0,0.5); }
      50%      { box-shadow: 0 0 0 5px rgba(255,84,0,0); }
    }

    #pd-anim-iframe {
      display: block;
      width: 100%;
      height: 720px;
      border: none;
      margin-top: 28px;
      /* scale the 900px animation down to fit 480px panel */
      transform-origin: top left;
    }

    /* Backdrop dismiss */
    #pd-popup-overlay.open::before {
      content: '';
      position: fixed; inset: 0; z-index: -1;
    }

    /* Responsive — on narrow screens stack vertically, hide animation */
    @media (max-width: 860px) {
      #pd-anim-panel { display: none; }
      #pd-bubble { width: calc(100vw - 28px); }
    }
    @media (max-width: 420px) {
      #pd-panel { right: 10px !important; left: auto !important; }
    }
  `;

  /* ── MARKUP ─────────────────────────────────────────── */
  function buildHTML() {
    const steps = STEPS.map((s, i) => `
      <div class="pd-step">
        <div class="pd-step-icon">${s.icon}</div>
        <div class="pd-step-num">Step ${i + 1}</div>
        <div class="pd-step-label">${s.label}</div>
        <div class="pd-step-desc">${s.desc}</div>
      </div>`).join('');

    const tools = TOOLS.map(t => `
      <a class="pd-tool" href="${t.href}">
        <span class="pd-tool-icon">${t.emoji}</span>
        <span class="pd-tool-name">${t.name}</span>
        <span class="pd-tool-role">${t.role}</span>
        <span class="pd-tool-arr">›</span>
      </a>`).join('');

    const pilotSvg = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
      <style>.mpc{fill:none;stroke:rgba(255,255,255,0.75);stroke-linecap:round;stroke-linejoin:round;stroke-width:1.1}.mph{fill:#FF5400;stroke:none}</style>
      <path class="mpc" d="M23.874,12.7596c4.3454,0,10.4151-1.3159,10.4151-2.7196,0-1.4037-4.4084-4.54-10.4151-4.54-6.0067,0-10.4151,3.1363-10.4151,4.54s6.0697,2.7196,10.4151,2.7196Z"/>
      <path class="mpc" d="M32.2384,11.4835v1.2761c0,.7786-4.1342,2.6757-8.3644,2.6757-4.2302,0-8.3644-1.8971-8.3644-2.6757v-1.2761"/>
      <path fill="rgba(255,84,0,0.7)" stroke="none" d="M13.9,10.3c0,0,2.5-.75,9.974-.75c7.474,0,9.974,.75,9.974,.75v0.95c0,0-2.5-.72-9.974-.72c-7.474,0-9.974,.72-9.974,.72Z"/>
      <line stroke="rgba(255,255,255,0.75)" stroke-width="1.3" stroke-linecap="round" x1="23.874" y1="9.15" x2="23.874" y2="7.05"/>
      <line stroke="rgba(255,255,255,0.75)" stroke-width="1.3" stroke-linecap="round" x1="22.4" y1="8.72" x2="20.25" y2="7.78"/>
      <line stroke="rgba(255,255,255,0.75)" stroke-width="1.3" stroke-linecap="round" x1="25.35" y1="8.72" x2="27.5" y2="7.78"/>
      <circle class="mph" cx="23.874" cy="8.5" r="0.9"/>
      <circle stroke="rgba(255,255,255,0.7)" stroke-width="0.9" fill="rgba(220,238,255,0.9)" cx="17.1359" cy="24.376" r="2.62"/>
      <circle fill="#1A3948" cx="17.1359" cy="24.376" r="1.18"/>
      <circle fill="white" cx="17.74" cy="23.8" r="0.46"/>
      <circle stroke="rgba(255,255,255,0.7)" stroke-width="0.9" fill="rgba(220,238,255,0.9)" cx="30.6916" cy="24.376" r="2.62"/>
      <circle fill="#1A3948" cx="30.6916" cy="24.376" r="1.18"/>
      <circle fill="white" cx="31.3" cy="23.8" r="0.46"/>
      <line stroke="rgba(255,255,255,0.65)" stroke-width="0.8" stroke-linecap="round" x1="19.76" y1="24.376" x2="28.07" y2="24.376"/>
      <path stroke="rgba(255,255,255,0.65)" stroke-width="0.7" fill="none" stroke-linecap="round" d="M21.6,27.6 Q24,29.2 26.4,27.6"/>
      <path class="mpc" stroke-width="0.85" d="M12.4987,22.977c-1.9908,2.7515-3.0653,6.0597-3.0715,9.4559v3.4097H40.1328v-3.4097c.0112-3.3975-.9806-6.7121-2.9614-9.4725"/>
      <path class="mpc" stroke-width="0.85" d="M7.7798,30.5207v10.2305c0,.9658,.783,1.7488,1.7488,1.7488h28.8553c.9618,0,1.7488-.787,1.7488-1.7488v-10.318"/>
    </svg>`;

    return `
    <div id="pd-popup-overlay" role="dialog" aria-modal="true" aria-label="About PilotDesk">
      <div id="pd-panel">

        <!-- LEFT: speech bubble -->
        <div id="pd-bubble">
          <div class="pd-tail">
            <svg viewBox="0 0 20 12" width="20" height="12" xmlns="http://www.w3.org/2000/svg">
              <path class="pd-tail-path" d="M0,12 L8,12 L14,0 L20,12 Z"/>
            </svg>
          </div>
          <div class="pd-card">
            <div class="pd-header">
              <div class="pd-avatar">${pilotSvg}</div>
              <div class="pd-speech">
                <div class="pd-name">PilotDesk · Briefing intelligence</div>
                <div class="pd-quote">${MISSION}</div>
              </div>
              <button class="pd-close" id="pd-close-btn" aria-label="Close">✕</button>
            </div>
            <div class="pd-body">
              <div class="pd-steps">${steps}</div>
              <div class="pd-div"></div>
              <div class="pd-tools-label">5 tools on board</div>
              <div class="pd-tools">${tools}</div>
            </div>
            <div class="pd-footer">
              <div class="pd-footer-left">${TEAM}<br>${DISCLAIMER}</div>
              <div class="pd-version">${VERSION}</div>
            </div>
          </div>
        </div>

        <!-- RIGHT: animation panel -->
        <div id="pd-anim-panel">
          <div id="pd-anim-label">
            <div id="pd-anim-label-dot"></div>
            <span>See it in action</span>
          </div>
          <iframe
            id="pd-anim-iframe"
            src="${ANIM_SRC}"
            title="PilotDesk workflow animation"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin">
          </iframe>
        </div>

      </div>
    </div>`;
  }

  /* ── POSITION ───────────────────────────────────────── */
  function positionPanel() {
    const wrap  = document.getElementById('owlWrap');
    const panel = document.getElementById('pd-panel');
    if (!wrap || !panel) return;

    const wr     = wrap.getBoundingClientRect();
    const pw     = panel.offsetWidth  || 814; // 220 bubble + 12 gap + 580 anim + borders
    const ph     = panel.offsetHeight || 370;
    const margin = 12;
    const vw     = window.innerWidth;
    const vh     = window.innerHeight;

    // Default: drop below pilot
    let top  = wr.bottom + window.scrollY + margin;
    // Right-align panel to the right edge of the pilot
    let left = wr.right + window.scrollX - pw;

    // Clamp horizontally
    if (left < margin) left = margin;
    if (left + pw > vw - margin) left = vw - pw - margin;

    // If panel would overflow bottom, pop it above the pilot instead
    if (top + ph > window.scrollY + vh - margin) {
      top = wr.top + window.scrollY - ph - margin;
    }

    panel.style.top  = top  + 'px';
    panel.style.left = left + 'px';

    // Scale iframe: animation is designed at 900px wide, panel is 580px
    const iframe = document.getElementById('pd-anim-iframe');
    if (iframe) {
      const animW  = 900;
      const panelW = document.getElementById('pd-anim-panel').offsetWidth || 580;
      const scale  = panelW / animW;
      iframe.style.transform = `scale(${scale})`;
      iframe.style.width     = animW + 'px';
      iframe.style.height    = Math.round(338 / scale) + 'px';
      const animPanel = document.getElementById('pd-anim-panel');
      animPanel.style.height = Math.round(338 * scale) + 28 + 'px';
    }
  }

  /* ── OPEN / CLOSE ───────────────────────────────────── */
  function openPopup() {
    const overlay = document.getElementById('pd-popup-overlay');
    const panel   = document.getElementById('pd-panel');
    if (!overlay || !panel) return;
    positionPanel();
    overlay.classList.add('open');
    // rAF so CSS transition fires from the "before" state
    requestAnimationFrame(() => panel.classList.add('open'));
  }

  function closePopup() {
    const overlay = document.getElementById('pd-popup-overlay');
    const panel   = document.getElementById('pd-panel');
    if (!overlay || !panel) return;
    panel.classList.remove('open');
    overlay.classList.remove('open');
  }

  function togglePopup() {
    const panel = document.getElementById('pd-panel');
    if (!panel) return;
    panel.classList.contains('open') ? closePopup() : openPopup();
  }

  /* ── INIT ───────────────────────────────────────────── */
  function init() {
    const style = document.createElement('style');
    style.id = 'pd-popup-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', buildHTML());

    // Make pilot clickable
    const wrap = document.getElementById('owlWrap');
    if (wrap) {
      wrap.style.cursor      = 'pointer';
      wrap.style.pointerEvents = 'all';
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('aria-label', 'About PilotDesk');
      wrap.setAttribute('tabindex', '0');
      wrap.addEventListener('click', togglePopup);
      wrap.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePopup(); }
      });
    }

    // Close on ✕ button or backdrop click
    document.addEventListener('click', e => {
      const closeBtn = document.getElementById('pd-close-btn');
      const panel    = document.getElementById('pd-panel');
      const overlay  = document.getElementById('pd-popup-overlay');
      if (!panel || !panel.classList.contains('open')) return;
      if (
        (closeBtn && closeBtn.contains(e.target)) ||
        (overlay  && e.target === overlay)
      ) closePopup();
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePopup();
    });

    // Reposition on scroll / resize
    const reposition = () => {
      const panel = document.getElementById('pd-panel');
      if (panel && panel.classList.contains('open')) positionPanel();
    };
    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
