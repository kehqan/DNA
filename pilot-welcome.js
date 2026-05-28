/**
 * PilotDesk — First Visit Welcome Popup
 * Self-contained injectable snippet.
 * Add ONE line before </body> in index.html:
 *   <script src="./pilot-welcome.js"></script>
 *
 * Shows once on first visit. Controlled by localStorage key 'pd_welcomed'.
 * Checking "Don't show this again" OR clicking "Got it" both set the flag.
 * Zero changes to index.html required.
 *
 * Version: 1.0 · May 2026
 */
(function () {
  'use strict';

  const LS_KEY = 'pd_welcomed';

  /* ── Already seen — do nothing ─────────────────────── */
  if (localStorage.getItem(LS_KEY)) return;

  /* ── STYLES ─────────────────────────────────────────── */
  const CSS = `
    /* Backdrop */
    #pd-welcome-overlay {
      position: fixed;
      inset: 0;
      z-index: 9000;
      background: rgba(15, 25, 35, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      opacity: 0;
      transition: opacity 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    #pd-welcome-overlay.open {
      opacity: 1;
    }

    /* Card */
    #pd-welcome-card {
      position: relative;
      width: 100%;
      max-width: 360px;
      background: rgba(255, 255, 255, 0.62);
      backdrop-filter: blur(28px) saturate(2.2);
      -webkit-backdrop-filter: blur(28px) saturate(2.2);
      border: 1px solid rgba(255, 255, 255, 0.88);
      border-radius: 24px;
      box-shadow:
        0 32px 80px rgba(26, 57, 72, 0.18),
        0 8px 24px rgba(26, 57, 72, 0.10),
        inset 0 1.5px 0 rgba(255, 255, 255, 0.95),
        inset 0 -1px 0 rgba(26, 57, 72, 0.03);
      overflow: visible;
      transform: scale(0.90) translateY(16px);
      transition: transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1),
                  opacity 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
      opacity: 0;
      font-family: 'Noto Sans', system-ui, sans-serif;
    }
    #pd-welcome-overlay.open #pd-welcome-card {
      transform: scale(1) translateY(0);
      opacity: 1;
    }

    /* Mascot — sits on top edge, centered */
    #pd-welcome-mascot {
      position: absolute;
      top: -58px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 100px;
      filter: drop-shadow(0 6px 18px rgba(26, 57, 72, 0.20));
      animation: pdMascotFloat 4s ease-in-out infinite;
    }
    @keyframes pdMascotFloat {
      0%, 100% { transform: translateX(-50%) translateY(0px);  }
      50%       { transform: translateX(-50%) translateY(-7px); }
    }

    /* Card body */
    #pd-welcome-body {
      padding: 64px 26px 24px;
    }

    /* Eyebrow chip */
    .pd-w-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 16px;
    }
    .pd-w-chip-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #FF5400;
      animation: pdDotPulse 2.4s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes pdDotPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255,84,0,0.5); }
      50%       { box-shadow: 0 0 0 5px rgba(255,84,0,0); }
    }
    .pd-w-chip-label {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: rgba(26, 57, 72, 0.45);
    }

    /* Headline */
    .pd-w-headline {
      font-family: 'Lora', Georgia, serif;
      font-size: 22px; font-weight: 400;
      color: #1A3948;
      text-align: center;
      line-height: 1.25;
      letter-spacing: -0.02em;
      margin: 0 0 10px;
    }
    .pd-w-headline em {
      font-style: italic;
      color: #24506A;
    }

    /* Sub copy */
    .pd-w-sub {
      font-size: 13.5px; line-height: 1.65;
      color: rgba(26, 57, 72, 0.58);
      text-align: center;
      margin: 0 0 22px;
    }

    /* Divider */
    .pd-w-divider {
      height: 1px;
      background: rgba(26, 57, 72, 0.07);
      margin: 0 -26px 20px;
    }

    /* Hint box — glass inset */
    .pd-w-hint {
      background: rgba(26, 57, 72, 0.045);
      border: 1px solid rgba(26, 57, 72, 0.09);
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      align-items: flex-start;
      gap: 11px;
      margin-bottom: 20px;
    }
    .pd-w-hint-icon {
      width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
      background: rgba(255, 84, 0, 0.10);
      border: 1px solid rgba(255, 84, 0, 0.18);
      display: flex; align-items: center; justify-content: center;
    }
    .pd-w-hint-text {
      font-size: 12.5px; color: rgba(26, 57, 72, 0.65);
      line-height: 1.55; margin: 0;
    }
    .pd-w-hint-text strong {
      color: #1A3948; font-weight: 600;
    }

    /* CTA button */
    .pd-w-btn {
      width: 100%;
      padding: 13px 20px;
      background: #1A3948;
      color: rgba(248, 247, 246, 0.96);
      border: none;
      border-radius: 12px;
      font-family: 'Noto Sans', system-ui, sans-serif;
      font-size: 14px; font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      box-shadow:
        0 4px 16px rgba(26, 57, 72, 0.22),
        inset 0 1px 0 rgba(255, 255, 255, 0.10);
      transition: transform 140ms, box-shadow 140ms, background 180ms;
      margin-bottom: 14px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .pd-w-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(26, 57, 72, 0.28), inset 0 1px 0 rgba(255,255,255,0.12);
      background: #243C4A;
    }
    .pd-w-btn:active { transform: scale(0.98); }

    /* Checkbox row */
    .pd-w-check-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .pd-w-check-row input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 15px; height: 15px;
      border: 1.5px solid rgba(26, 57, 72, 0.25);
      border-radius: 4px;
      background: rgba(255,255,255,0.7);
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      transition: background 150ms, border-color 150ms;
    }
    .pd-w-check-row input:checked {
      background: #1A3948;
      border-color: #1A3948;
    }
    .pd-w-check-row input:checked::after {
      content: '';
      position: absolute;
      top: 2px; left: 4.5px;
      width: 4px; height: 7px;
      border: 1.5px solid white;
      border-top: none; border-left: none;
      transform: rotate(42deg);
    }
    .pd-w-check-label {
      font-size: 12px;
      color: rgba(26, 57, 72, 0.45);
    }

    /* Ambient orbs inside the card — subtle liquid glass warmth */
    .pd-w-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
    }
    .pd-w-orb-1 {
      width: 180px; height: 140px;
      top: -40px; left: -40px;
      background: radial-gradient(ellipse, rgba(255,84,0,0.12) 0%, transparent 70%);
      filter: blur(40px);
    }
    .pd-w-orb-2 {
      width: 140px; height: 120px;
      bottom: 0; right: -20px;
      background: radial-gradient(ellipse, rgba(255,192,71,0.10) 0%, transparent 70%);
      filter: blur(36px);
    }

    /* Ensure body content sits above orbs */
    #pd-welcome-body { position: relative; z-index: 1; }
  `;

  /* ── PILOT SVG ──────────────────────────────────────── */
  const PILOT_SVG = `
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" style="width:100%;height:100%">
      <defs><style>
        .mpc{fill:none;stroke:#1A3948;stroke-linecap:round;stroke-linejoin:round;stroke-width:0.9}
        .mph{fill:#FF5400;stroke:none}
      </style></defs>
      <g id="pd-welcome-wing-l">
        <path class="mpc" d="M15.67,13.06c-.38,.23-.76,.48-1.13,.74l-2.18-2.21c-1.04-1.04-2.73-1.04-3.77,0h0c-1.03,1.04-1.03,2.71,0,3.75l2.26,2.23"/>
      </g>
      <path class="mpc" d="M32.43,13.06c.38,.23,.76,.48,1.13,.74l2.18-2.21c1.04-1.04,2.73-1.04,3.77,0h0c1.03,1.04,1.03,2.71,0,3.75l-2.26,2.23"/>
      <path class="mpc" d="M12.5,22.98c-1.99,2.75-3.07,6.06-3.07,9.46v3.41h31.26v-3.41c.01-3.4-.98-6.71-2.96-9.47"/>
      <path class="mpc" d="M7.78,30.52v10.23c0,.97,.78,1.75,1.75,1.75h28.86c.96,0,1.75-.79,1.75-1.75v-10.32"/>
      <polyline class="mpc" points="17.14 30.43 23.96 37.34 30.69 30.43"/>
      <line class="mpc" x1="22.02" y1="30.43" x2="23.27" y2="32.28"/>
      <polyline class="mpc" points="25.72 35.47 24.56 32.28 23.27 32.28 22.11 35.47"/>
      <line class="mpc" x1="25.81" y1="30.43" x2="24.56" y2="32.28"/>
      <circle class="mph" cx="17.14" cy="35.23" r=".85"/>
      <circle class="mph" cx="17.14" cy="38.54" r=".85"/>
      <circle class="mph" cx="30.69" cy="35.23" r=".85"/>
      <circle class="mph" cx="30.69" cy="38.54" r=".85"/>
      <line class="mpc" x1="35.15" y1="33.29" x2="36.33" y2="33.29"/>
      <path class="mpc" d="M7.78,34.97c2.51,0,4.54-2.03,4.54-4.54"/>
      <!-- hat brim -->
      <path fill="rgba(255,84,0,0.10)" stroke="#1A3948" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"
        d="M23.87,12.76c4.35,0,10.42-1.32,10.42-2.72,0-1.4-4.41-4.54-10.42-4.54-6,0-10.42,3.14-10.42,4.54s6.07,2.72,10.42,2.72Z"/>
      <path fill="none" stroke="#1A3948" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"
        d="M32.24,11.48v1.28c0,.78-4.13,2.68-8.36,2.68-4.23,0-8.36-1.9-8.36-2.68v-1.28"/>
      <!-- flame band -->
      <path fill="#FF5400" fill-opacity="0.75" stroke="none"
        d="M13.9,10.3c0,0,2.5-.75,9.97-.75c7.47,0,9.97,.75,9.97,.75v0.95c0,0-2.5-.72-9.97-.72c-7.47,0-9.97,.72-9.97,.72Z"/>
      <!-- propeller -->
      <line stroke="#1A3948" stroke-width="1.1" stroke-linecap="round" x1="23.87" y1="9.15" x2="23.87" y2="7.05"/>
      <line stroke="#1A3948" stroke-width="1.1" stroke-linecap="round" x1="22.4" y1="8.72" x2="20.25" y2="7.78"/>
      <line stroke="#1A3948" stroke-width="1.1" stroke-linecap="round" x1="25.35" y1="8.72" x2="27.5" y2="7.78"/>
      <circle class="mph" cx="23.87" cy="8.5" r="0.85"/>
      <!-- left goggle -->
      <circle stroke="#1A3948" stroke-width="0.85" fill="rgba(225,242,255,0.95)" cx="17.14" cy="24.38" r="2.62"/>
      <circle id="pd-welcome-pl" fill="#1A3948" cx="17.14" cy="24.38" r="1.18"/>
      <circle fill="white" cx="17.74" cy="23.8" r="0.46"/>
      <!-- right goggle -->
      <circle stroke="#1A3948" stroke-width="0.85" fill="rgba(225,242,255,0.95)" cx="30.69" cy="24.38" r="2.62"/>
      <circle id="pd-welcome-pr" fill="#1A3948" cx="30.69" cy="24.38" r="1.18"/>
      <circle fill="white" cx="31.3" cy="23.8" r="0.46"/>
      <!-- goggle bridge -->
      <line stroke="#1A3948" stroke-width="0.72" stroke-linecap="round" x1="19.76" y1="24.38" x2="28.07" y2="24.38"/>
      <!-- smile -->
      <path stroke="#1A3948" stroke-width="0.65" fill="none" stroke-linecap="round" d="M21.6,27.6 Q24,29.2 26.4,27.6"/>
    </svg>`;

  /* ── BUILD MARKUP ──────────────────────────────────── */
  function buildHTML() {
    return `
    <div id="pd-welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome to PilotDesk">
      <div id="pd-welcome-card">

        <!-- ambient orbs -->
        <div class="pd-w-orb pd-w-orb-1"></div>
        <div class="pd-w-orb pd-w-orb-2"></div>

        <!-- mascot on top -->
        <div id="pd-welcome-mascot">${PILOT_SVG}</div>

        <div id="pd-welcome-body">

          <!-- eyebrow chip -->
          <div class="pd-w-chip">
            <div class="pd-w-chip-dot"></div>
            <span class="pd-w-chip-label">PilotDesk · Welcome</span>
          </div>

          <!-- headline -->
          <h2 class="pd-w-headline">Hi, I'm <em>PilotDesk</em>.</h2>

          <!-- sub -->
          <p class="pd-w-sub">
            I turn your editorial context into<br>
            precision Copilot prompts — fast.
          </p>

          <div class="pd-w-divider"></div>

          <!-- hint box -->
          <div class="pd-w-hint">
            <div class="pd-w-hint-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v8M5 6l3 3 3-3" stroke="#FF5400" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="#FF5400" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="pd-w-hint-text">
              Whenever you need help, click me at the
              <strong>top-right corner</strong> of this page —
              I'll show you how it works.
            </p>
          </div>

          <!-- CTA -->
          <button class="pd-w-btn" id="pd-welcome-cta">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Got it, let's go
          </button>

          <!-- don't show again -->
          <label class="pd-w-check-row">
            <input type="checkbox" id="pd-welcome-no-show">
            <span class="pd-w-check-label">Don't show this again</span>
          </label>

        </div>
      </div>
    </div>`;
  }

  /* ── DISMISS ────────────────────────────────────────── */
  function dismiss() {
    const overlay = document.getElementById('pd-welcome-overlay');
    if (!overlay) return;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => overlay.remove(), 380);
    localStorage.setItem(LS_KEY, '1');
  }

  /* ── PUPIL TRACKING — follows cursor like homepage ──── */
  function startPupilTracking() {
    const mascot = document.getElementById('pd-welcome-mascot');
    const pl     = document.getElementById('pd-welcome-pl');
    const pr     = document.getElementById('pd-welcome-pr');
    if (!mascot || !pl || !pr) return;

    const SVG_W = 48, SVG_H = 48;
    const HEAD_CX = 24, HEAD_CY = 17;
    const TRAVEL  = 0.9;

    function track(clientX, clientY) {
      const rect   = mascot.getBoundingClientRect();
      const pivotX = rect.left + rect.width  * (HEAD_CX / SVG_W);
      const pivotY = rect.top  + rect.height * (HEAD_CY / SVG_H);
      const dx = clientX - pivotX;
      const dy = clientY - pivotY;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const norm = Math.min(dist, 280) / 280;
      const pDx  = (dx / dist) * TRAVEL * norm;
      const pDy  = (dy / dist) * TRAVEL * norm;
      pl.style.transition = 'transform 110ms ease';
      pr.style.transition = 'transform 110ms ease';
      pl.style.transform  = `translate(${pDx}px,${pDy}px)`;
      pr.style.transform  = `translate(${pDx}px,${pDy}px)`;
    }

    document.addEventListener('mousemove', e => track(e.clientX, e.clientY), { passive: true });
    document.addEventListener('touchmove', e => {
      track(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    /* random blink */
    function blink() {
      const eyes = [
        mascot.querySelector('circle[stroke="#1A3948"][fill="rgba(225,242,255,0.95)"]:nth-child(1)'),
      ];
      // target all goggle circles via querySelectorAll
      const goggles = mascot.querySelectorAll('circle[fill="rgba(225,242,255,0.95)"]');
      goggles.forEach(g => {
        g.style.transition = 'transform 55ms ease';
        g.style.transform  = 'scaleY(0.08)';
      });
      setTimeout(() => {
        goggles.forEach(g => {
          g.style.transition = 'transform 75ms ease';
          g.style.transform  = 'scaleY(1)';
        });
      }, 80);
      setTimeout(blink, 2800 + Math.random() * 4200);
    }
    setTimeout(blink, 1500 + Math.random() * 2000);
  }

  /* ── WING WAVE animation ────────────────────────────── */
  function startWingWave() {
    const wing = document.getElementById('pd-welcome-wing-l');
    if (!wing) return;
    wing.style.transformOrigin = '12px 13px';
    wing.style.animation = 'pdWingWave 0.8s ease-in-out 2 alternate';
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pdWingWave {
        from { transform: rotate(0deg);  }
        to   { transform: rotate(-14deg); }
      }`;
    document.head.appendChild(style);
  }

  /* ── INIT ───────────────────────────────────────────── */
  function init() {
    /* styles */
    const style = document.createElement('style');
    style.id = 'pd-welcome-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    /* markup */
    document.body.insertAdjacentHTML('beforeend', buildHTML());

    /* open animation — rAF ensures transition fires */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const overlay = document.getElementById('pd-welcome-overlay');
        if (overlay) overlay.classList.add('open');
      });
    });

    /* CTA */
    document.getElementById('pd-welcome-cta')?.addEventListener('click', dismiss);

    /* checkbox — sets flag immediately without dismissing */
    document.getElementById('pd-welcome-no-show')?.addEventListener('change', e => {
      if (e.target.checked) localStorage.setItem(LS_KEY, '1');
      else localStorage.removeItem(LS_KEY);
    });

    /* backdrop click */
    document.getElementById('pd-welcome-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'pd-welcome-overlay') dismiss();
    });

    /* Escape */
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        dismiss();
        document.removeEventListener('keydown', handler);
      }
    });

    /* alive pilot */
    startPupilTracking();
    setTimeout(startWingWave, 600);
  }

  /* run after DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
