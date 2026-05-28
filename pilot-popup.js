/**
 * PilotDesk — Pilot Popup
 * Self-contained injectable snippet.
 * Drop this <script src="pilot-popup.js"></script> anywhere before </body>
 * in index.html. No external dependencies. Touches nothing in the host page
 * except: adds a click listener to #owlWrap, injects one <div> + <style>.
 *
 * Version: 1.0 · May 2026
 */
(function () {
  'use strict';

  /* ── CONFIG ──────────────────────────────────────────── */
  const VERSION   = 'v1.5 · May 2026';
  const TEAM      = 'Digital Transformation Department · RFE/RL';
  const DISCLAIMER = 'Not an official Microsoft product.';

  const MISSION = 'PilotDesk turns your editorial context into precision Copilot prompts. You fill the form — I build the prompt — you paste it in Outlook and fly.';

  const STEPS = [
    { icon: '📋', label: 'Fill the form', desc: 'Role, depth, focus, context' },
    { icon: '📋', label: 'Copy the prompt', desc: 'One click, clipboard ready' },
    { icon: '✈️', label: 'Paste in Copilot', desc: 'Outlook sidebar, hit Enter' },
  ];

  const TOOLS = [
    { emoji: '🌅', name: 'Morning Briefing',   role: 'Daily intelligence brief',       href: './morning'   },
    { emoji: '🔍', name: 'Bias Detector',       role: 'Editorial bias analysis',        href: './bias'      },
    { emoji: '🧠', name: 'Memory Hunter',       role: 'Context & source recall',        href: './memory'    },
    { emoji: '🎙️', name: 'Meeting Recap',       role: 'Meeting to action items',        href: './meeting'   },
    { emoji: '✅', name: 'Fact-Check Assistant', role: 'Claim verification prompt',     href: './factcheck' },
  ];

  /* ── STYLES ─────────────────────────────────────────── */
  const CSS = `
    /* ── Pilot popup overlay ── */
    #pd-popup-overlay {
      position: fixed; inset: 0; z-index: 900;
      pointer-events: none;
    }
    #pd-popup-overlay.open { pointer-events: all; }

    /* ── Bubble ── */
    #pd-bubble {
      position: absolute;
      width: 320px;
      opacity: 0;
      transform: scale(0.88) translateY(-6px);
      transform-origin: top right;
      transition: opacity 220ms cubic-bezier(0.25,0.46,0.45,0.94),
                  transform 220ms cubic-bezier(0.25,0.46,0.45,0.94);
      pointer-events: none;
    }
    #pd-bubble.open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: all;
    }

    /* Glass bubble card */
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

    /* Tail pointing up-right toward pilot */
    .pd-tail {
      position: absolute;
      top: -10px; right: 28px;
      width: 20px; height: 12px;
      overflow: visible;
    }
    .pd-tail-path {
      fill: rgba(255,255,255,0.82);
      stroke: rgba(255,255,255,0.90);
      stroke-width: 1;
      filter: drop-shadow(0 -2px 3px rgba(26,57,72,0.06));
    }

    /* Header — teal bar with pilot quote */
    .pd-header {
      background: #1A3948;
      padding: 14px 16px 13px;
      display: flex; gap: 11px; align-items: flex-start;
    }
    .pd-avatar {
      width: 34px; height: 34px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pd-avatar svg { width: 22px; height: 22px; }
    .pd-speech { flex: 1; }
    .pd-name {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(255,255,255,0.45); margin-bottom: 4px;
    }
    .pd-quote {
      font-family: 'Lora', Georgia, serif;
      font-size: 13px; font-style: italic;
      color: rgba(248,247,246,0.92);
      line-height: 1.55;
    }
    .pd-close {
      background: rgba(255,255,255,0.10);
      border: none; border-radius: 6px;
      width: 24px; height: 24px;
      cursor: pointer; color: rgba(255,255,255,0.55);
      font-size: 13px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 0;
      transition: background 150ms, color 150ms;
    }
    .pd-close:hover { background: rgba(255,255,255,0.20); color: #fff; }

    /* Body */
    .pd-body { padding: 14px 16px 4px; }

    /* Steps row */
    .pd-steps {
      display: flex; gap: 0;
      margin-bottom: 14px;
    }
    .pd-step {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; text-align: center;
      padding: 0 4px; position: relative;
    }
    .pd-step:not(:last-child)::after {
      content: '';
      position: absolute; right: -1px; top: 13px;
      width: 1px; height: 18px;
      background: rgba(26,57,72,0.10);
    }
    .pd-step-icon {
      font-size: 18px; line-height: 1;
      margin-bottom: 5px;
    }
    .pd-step-num {
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.07em; text-transform: uppercase;
      color: #FF5400; margin-bottom: 2px;
    }
    .pd-step-label {
      font-size: 11px; font-weight: 600; color: #1A3948;
      line-height: 1.3; margin-bottom: 2px;
    }
    .pd-step-desc {
      font-size: 10px; color: rgba(26,57,72,0.48);
      line-height: 1.4;
    }

    /* Divider */
    .pd-div {
      height: 1px;
      background: rgba(26,57,72,0.07);
      margin: 0 -16px 12px;
    }

    /* Tools section label */
    .pd-tools-label {
      font-size: 9.5px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(26,57,72,0.38); margin-bottom: 8px;
    }

    /* Tools list */
    .pd-tools { display: flex; flex-direction: column; gap: 1px; margin-bottom: 14px; }
    .pd-tool {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 9px; border-radius: 9px;
      text-decoration: none; color: inherit;
      transition: background 130ms;
    }
    .pd-tool:hover { background: rgba(26,57,72,0.05); }
    .pd-tool-icon { font-size: 14px; flex-shrink: 0; }
    .pd-tool-name {
      font-size: 12px; font-weight: 600; color: #1A3948;
      flex: 1; line-height: 1;
    }
    .pd-tool-role {
      font-size: 10.5px; color: rgba(26,57,72,0.45); white-space: nowrap;
    }
    .pd-tool-arr {
      font-size: 11px; color: rgba(26,57,72,0.25);
      margin-left: 2px;
    }

    /* Footer */
    .pd-footer {
      background: rgba(26,57,72,0.03);
      border-top: 1px solid rgba(26,57,72,0.06);
      padding: 8px 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .pd-footer-left {
      font-size: 10px; color: rgba(26,57,72,0.38); line-height: 1.4;
    }
    .pd-version {
      font-size: 9.5px; font-weight: 700;
      letter-spacing: 0.07em;
      color: rgba(255,84,0,0.55);
      white-space: nowrap;
    }

    /* Dismiss on backdrop click */
    #pd-popup-overlay.open::before {
      content: '';
      position: fixed; inset: 0; z-index: -1;
    }

    @media (max-width: 420px) {
      #pd-bubble { width: calc(100vw - 28px); right: 10px !important; left: auto !important; }
    }
  `;

  /* ── BUILD MARKUP ──────────────────────────────────── */
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

    /* Inline pilot SVG (mini, 22×22 display) */
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
      <circle fill="white" stroke="none" cx="17.74" cy="23.8" r="0.46"/>
      <circle stroke="rgba(255,255,255,0.7)" stroke-width="0.9" fill="rgba(220,238,255,0.9)" cx="30.6916" cy="24.376" r="2.62"/>
      <circle fill="#1A3948" cx="30.6916" cy="24.376" r="1.18"/>
      <circle fill="white" stroke="none" cx="31.3" cy="23.8" r="0.46"/>
      <line stroke="rgba(255,255,255,0.65)" stroke-width="0.8" stroke-linecap="round" x1="19.76" y1="24.376" x2="28.07" y2="24.376"/>
      <path stroke="rgba(255,255,255,0.65)" stroke-width="0.7" fill="none" stroke-linecap="round" d="M21.6,27.6 Q24,29.2 26.4,27.6"/>
      <path class="mpc" stroke-width="0.85" d="M12.4987,22.977c-1.9908,2.7515-3.0653,6.0597-3.0715,9.4559v3.4097H40.1328v-3.4097c.0112-3.3975-.9806-6.7121-2.9614-9.4725"/>
      <path class="mpc" stroke-width="0.85" d="M7.7798,30.5207v10.2305c0,.9658,.783,1.7488,1.7488,1.7488h28.8553c.9618,0,1.7488-.787,1.7488-1.7488v-10.318"/>
    </svg>`;

    return `
    <div id="pd-popup-overlay" role="dialog" aria-modal="true" aria-label="About PilotDesk">
      <div id="pd-bubble">

        <!-- speech bubble tail -->
        <div class="pd-tail">
          <svg viewBox="0 0 20 12" width="20" height="12" xmlns="http://www.w3.org/2000/svg">
            <path class="pd-tail-path" d="M0,12 L8,12 L14,0 L20,12 Z"/>
          </svg>
        </div>

        <div class="pd-card">

          <!-- HEADER: pilot speaks -->
          <div class="pd-header">
            <div class="pd-avatar">${pilotSvg}</div>
            <div class="pd-speech">
              <div class="pd-name">PilotDesk · Briefing intelligence</div>
              <div class="pd-quote">${MISSION}</div>
            </div>
            <button class="pd-close" id="pd-close-btn" aria-label="Close">✕</button>
          </div>

          <!-- BODY -->
          <div class="pd-body">

            <!-- 3-step workflow -->
            <div class="pd-steps">${steps}</div>

            <div class="pd-div"></div>

            <!-- Tools list -->
            <div class="pd-tools-label">5 tools on board</div>
            <div class="pd-tools">${tools}</div>

          </div>

          <!-- FOOTER -->
          <div class="pd-footer">
            <div class="pd-footer-left">${TEAM}<br>${DISCLAIMER}</div>
            <div class="pd-version">${VERSION}</div>
          </div>

        </div><!-- /pd-card -->
      </div><!-- /pd-bubble -->
    </div><!-- /pd-popup-overlay -->`;
  }

  /* ── POSITION ──────────────────────────────────────── */
  function positionBubble() {
    const wrap   = document.getElementById('owlWrap');
    const bubble = document.getElementById('pd-bubble');
    if (!wrap || !bubble) return;

    const wr = wrap.getBoundingClientRect();
    const bw = bubble.offsetWidth || 320;
    const margin = 12;

    // Anchor bubble below the pilot, right-aligned
    const top  = wr.bottom + window.scrollY + margin;
    let   left = wr.right  + window.scrollX - bw;

    // Keep inside viewport
    if (left < margin) left = margin;
    if (left + bw > window.innerWidth - margin) left = window.innerWidth - bw - margin;

    bubble.style.top  = top  + 'px';
    bubble.style.left = left + 'px';
  }

  /* ── OPEN / CLOSE ──────────────────────────────────── */
  function openPopup() {
    const overlay = document.getElementById('pd-popup-overlay');
    const bubble  = document.getElementById('pd-bubble');
    if (!overlay || !bubble) return;
    positionBubble();
    overlay.classList.add('open');
    bubble.classList.add('open');
    // Tiny delay so transform starts from invisible state
    requestAnimationFrame(() => bubble.classList.add('open'));
  }

  function closePopup() {
    const overlay = document.getElementById('pd-popup-overlay');
    const bubble  = document.getElementById('pd-bubble');
    if (!overlay || !bubble) return;
    bubble.classList.remove('open');
    overlay.classList.remove('open');
  }

  function togglePopup() {
    const bubble = document.getElementById('pd-bubble');
    if (!bubble) return;
    bubble.classList.contains('open') ? closePopup() : openPopup();
  }

  /* ── INIT ──────────────────────────────────────────── */
  function init() {
    // Inject styles
    const style = document.createElement('style');
    style.id = 'pd-popup-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    // Inject markup
    document.body.insertAdjacentHTML('beforeend', buildHTML());

    // Make pilot clickable
    const wrap = document.getElementById('owlWrap');
    if (wrap) {
      wrap.style.cursor = 'pointer';
      wrap.style.pointerEvents = 'all';
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('aria-label', 'About PilotDesk');
      wrap.setAttribute('tabindex', '0');
      wrap.addEventListener('click', togglePopup);
      wrap.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePopup(); }
      });
    }

    // Close button
    document.addEventListener('click', e => {
      const closeBtn = document.getElementById('pd-close-btn');
      const bubble   = document.getElementById('pd-bubble');
      const overlay  = document.getElementById('pd-popup-overlay');
      if (!bubble || !bubble.classList.contains('open')) return;

      // Close on close btn, or backdrop (overlay itself, not bubble)
      if (
        (closeBtn && closeBtn.contains(e.target)) ||
        (overlay && e.target === overlay)
      ) {
        closePopup();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePopup();
    });

    // Reposition on scroll / resize
    window.addEventListener('scroll', () => {
      const bubble = document.getElementById('pd-bubble');
      if (bubble && bubble.classList.contains('open')) positionBubble();
    }, { passive: true });
    window.addEventListener('resize', () => {
      const bubble = document.getElementById('pd-bubble');
      if (bubble && bubble.classList.contains('open')) positionBubble();
    }, { passive: true });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
