/**
 * PilotDesk — Pilot Popup v3.0
 * One mother Liquid Glass frame with:
 *   · Pilot mascot sitting on top (same as welcome popup)
 *   · Tail pointing up-right toward pilot's position
 *   · Single ✕ close button on mother frame
 *   · Homepage blurs on open, unblurs on close
 *   · LEFT col:  speech bubble (tools list)
 *   · RIGHT col: animation iframe (top) + contact CTA (bottom)
 *
 * Requires: pilotdesk-animation.html in same folder as index.html
 * Version: 3.0 · May 2026
 */
(function () {
  'use strict';

  const ANIM_SRC   = './pilotdesk-animation.html';
  const ADMIN_EMAIL = 'DehghanMadisehA@rferl.org';
  const VERSION    = 'v1.5 · May 2026';
  const TEAM       = 'Digital Transformation · RFE/RL';
  const DISCLAIMER = 'Not an official Microsoft product.';
  const MISSION    = 'PilotDesk turns your editorial context into precision Copilot prompts. You fill the form — I build the prompt — you paste it in Outlook and fly.';

  const TOOLS = [
    { emoji: '🌅', name: 'Morning Briefing',    role: 'Daily intelligence brief',  href: './morning'   },
    { emoji: '🔍', name: 'Bias Detector',        role: 'Editorial bias analysis',   href: './bias'      },
    { emoji: '🧠', name: 'Memory Hunter',        role: 'Context & source recall',   href: './memory'    },
    { emoji: '🎙️', name: 'Meeting Recap',        role: 'Meeting to action items',   href: './meeting'   },
    { emoji: '✅', name: 'Fact-Check Assistant', role: 'Claim verification prompt', href: './factcheck' },
  ];

  /* ── STYLES ─────────────────────────────────────────── */
  const CSS = `
    /* Overlay — captures backdrop clicks, blurs homepage */
    #pd-overlay {
      position: fixed; inset: 0; z-index: 8000;
      pointer-events: none;
      background: rgba(15,25,35,0);
      transition: background 300ms ease;
    }
    #pd-overlay.open {
      pointer-events: all;
      background: rgba(15,25,35,0.38);
    }

    /* Homepage blur target */
    .pd-blur-target {
      transition: filter 300ms ease;
    }
    .pd-blur-target.blurred {
      filter: blur(5px);
    }

    /* ── MOTHER FRAME ── */
    #pd-frame {
      position: absolute;
      z-index: 8001;
      display: flex;
      flex-direction: column;
      gap: 0;

      /* Liquid Glass */
      background: rgba(248,247,246,0.52);
      backdrop-filter: blur(32px) saturate(2.2);
      -webkit-backdrop-filter: blur(32px) saturate(2.2);
      border: 1px solid rgba(255,255,255,0.85);
      border-radius: 22px;
      box-shadow:
        0 32px 80px rgba(26,57,72,0.18),
        0 8px 24px rgba(26,57,72,0.10),
        inset 0 1.5px 0 rgba(255,255,255,0.95),
        inset 0 -1px 0 rgba(26,57,72,0.03);
      overflow: visible;

      /* enter animation */
      opacity: 0;
      transform: scale(0.90) translateY(-10px);
      transform-origin: top right;
      transition: opacity 280ms cubic-bezier(0.25,0.46,0.45,0.94),
                  transform 320ms cubic-bezier(0.34,1.46,0.64,1);
      pointer-events: none;
    }
    #pd-frame.open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: all;
    }

    /* Ambient orbs inside mother frame */
    .pd-orb {
      position: absolute; border-radius: 50%;
      pointer-events: none; z-index: 0;
    }
    .pd-orb-1 {
      width: 300px; height: 220px; top: -60px; left: -60px;
      background: radial-gradient(ellipse, rgba(255,84,0,0.14) 0%, transparent 70%);
      filter: blur(60px);
    }
    .pd-orb-2 {
      width: 240px; height: 200px; bottom: 20px; right: -40px;
      background: radial-gradient(ellipse, rgba(255,192,71,0.10) 0%, transparent 70%);
      filter: blur(50px);
    }
    .pd-orb-3 {
      width: 200px; height: 160px; top: 40%; left: 30%;
      background: radial-gradient(ellipse, rgba(26,57,72,0.07) 0%, transparent 70%);
      filter: blur(50px);
    }

    /* Speech bubble tail — points up toward pilot (top-right) */
    #pd-tail {
      position: absolute;
      top: -11px;
      right: 44px;
      width: 22px; height: 12px;
      overflow: visible;
      z-index: 2;
    }
    .pd-tail-path {
      fill: rgba(248,247,246,0.80);
      stroke: rgba(255,255,255,0.85);
      stroke-width: 1;
    }

    /* Single ✕ close button on mother frame */
    #pd-close {
      position: absolute;
      top: 12px; right: 14px;
      z-index: 10;
      width: 26px; height: 26px;
      background: rgba(26,57,72,0.09);
      border: 1px solid rgba(26,57,72,0.12);
      border-radius: 8px;
      cursor: pointer;
      color: rgba(26,57,72,0.55);
      font-size: 13px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      transition: background 150ms, color 150ms;
      font-family: inherit;
    }
    #pd-close:hover {
      background: rgba(26,57,72,0.15);
      color: #1A3948;
    }

    /* Pilot mascot on top of mother frame */
    #pd-mascot {
      position: absolute;
      top: -62px;
      right: 14px;
      width: 90px; height: 90px;
      pointer-events: none;
      z-index: 9;
      filter: drop-shadow(0 6px 16px rgba(26,57,72,0.18));
      animation: pdFloat 4s ease-in-out infinite;
    }
    @keyframes pdFloat {
      0%,100% { transform: translateY(0px) rotate(-1deg); }
      50%      { transform: translateY(-7px) rotate(1deg); }
    }

    /* Propeller spin on hover */
    #pd-frame:hover #pd-prop {
      animation: pdPropSpin 0.4s linear infinite;
    }
    @keyframes pdPropSpin {
      from { transform: rotate(0deg);   }
      to   { transform: rotate(360deg); }
    }
    #pd-prop { transform-origin: 23.87px 8.5px; }

    /* Pupils track cursor */
    #pd-pl, #pd-pr {
      transition: transform 110ms cubic-bezier(0.25,0.46,0.45,0.94);
    }

    /* ── BENTO INNER LAYOUT ── */
    #pd-inner {
      position: relative; z-index: 1;
      display: flex;
      gap: 10px;
      padding: 16px;
    }

    /* LEFT COL — bubble */
    #pd-left {
      width: 220px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* RIGHT COL — animation + contact */
    #pd-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    /* ── BENTO CHILD CARDS ── */
    .pd-box {
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.88);
      border-radius: 14px;
      box-shadow:
        0 4px 16px rgba(26,57,72,0.07),
        inset 0 1px 0 rgba(255,255,255,0.95);
      overflow: hidden;
      font-family: 'Noto Sans', system-ui, sans-serif;
      color: #1A3948;
    }

    /* Speech bubble box */
    #pd-bubble-box {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Bubble header — teal */
    .pd-bh {
      background: #1A3948;
      padding: 12px 13px 11px;
      display: flex; gap: 9px; align-items: flex-start;
      flex-shrink: 0;
    }
    .pd-avatar {
      width: 30px; height: 30px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pd-avatar svg { width: 19px; height: 19px; }
    .pd-speech { flex: 1; min-width: 0; }
    .pd-bname {
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(255,255,255,0.42); margin-bottom: 3px;
    }
    .pd-bquote {
      font-family: 'Lora', Georgia, serif;
      font-size: 11.5px; font-style: italic;
      color: rgba(248,247,246,0.90);
      line-height: 1.5;
    }

    /* Bubble body */
    .pd-bb {
      padding: 10px 12px 8px;
      flex: 1;
      display: flex; flex-direction: column;
    }

    /* Tools label */
    .pd-tools-lbl {
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.11em; text-transform: uppercase;
      color: rgba(26,57,72,0.36); margin-bottom: 6px;
    }

    /* Tool rows */
    .pd-tools { display: flex; flex-direction: column; gap: 1px; flex: 1; }
    .pd-tool {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 7px; border-radius: 8px;
      text-decoration: none; color: inherit;
      transition: background 120ms;
    }
    .pd-tool:hover { background: rgba(26,57,72,0.05); }
    .pd-tool-icon { font-size: 12px; flex-shrink: 0; }
    .pd-tool-name { font-size: 11px; font-weight: 600; color: #1A3948; flex: 1; }
    .pd-tool-role { font-size: 9.5px; color: rgba(26,57,72,0.42); white-space: nowrap; }
    .pd-tool-arr  { font-size: 10px; color: rgba(26,57,72,0.22); margin-left: 2px; }

    /* Bubble footer */
    .pd-bf {
      border-top: 1px solid rgba(26,57,72,0.06);
      padding: 6px 12px;
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(26,57,72,0.025);
    }
    .pd-bf-left { font-size: 9px; color: rgba(26,57,72,0.36); line-height: 1.4; }
    .pd-version  { font-size: 8.5px; font-weight: 700; letter-spacing: 0.07em; color: rgba(255,84,0,0.52); }

    /* ── ANIMATION BOX ── */
    #pd-anim-box {
      position: relative;
      overflow: hidden;
    }
    #pd-anim-bar {
      position: absolute; top: 0; left: 0; right: 0;
      height: 26px; z-index: 2;
      background: rgba(26,57,72,0.86);
      backdrop-filter: blur(8px);
      border-radius: 14px 14px 0 0;
      display: flex; align-items: center; padding: 0 11px; gap: 6px;
    }
    #pd-anim-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #FF5400; flex-shrink: 0;
      animation: pdDotPulse 2s ease-in-out infinite;
    }
    @keyframes pdDotPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,84,0,0.5); }
      50%      { box-shadow: 0 0 0 5px rgba(255,84,0,0); }
    }
    #pd-anim-bar span {
      font-family: 'Noto Sans', system-ui, sans-serif;
      font-size: 9.5px; font-weight: 600;
      letter-spacing: 0.07em; text-transform: uppercase;
      color: rgba(248,247,246,0.65);
    }
    #pd-anim-iframe {
      display: block; border: none;
      transform-origin: top left;
      margin-top: 26px;
    }

    /* ── CONTACT BOX ── */
    #pd-contact-box {
      padding: 12px 14px;
    }
    .pd-contact-top {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .pd-contact-icon {
      width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
      background: rgba(255,84,0,0.08);
      border: 1px solid rgba(255,84,0,0.16);
      display: flex; align-items: center; justify-content: center;
    }
    .pd-contact-title {
      font-size: 11px; font-weight: 700; color: #1A3948; line-height: 1;
    }
    .pd-contact-sub {
      font-size: 10px; color: rgba(26,57,72,0.48); margin-top: 1px;
    }
    .pd-email-row {
      display: flex; align-items: center; gap: 7px;
      background: rgba(26,57,72,0.04);
      border: 1px solid rgba(26,57,72,0.09);
      border-radius: 8px; padding: 7px 10px;
    }
    .pd-email-addr {
      flex: 1; font-size: 10.5px; font-weight: 500;
      color: #1A3948; font-family: 'JetBrains Mono', 'Fira Mono', monospace;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #pd-copy-email {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 9px; border-radius: 6px;
      border: 1px solid rgba(26,57,72,0.14);
      background: rgba(255,255,255,0.7);
      font-family: 'Noto Sans', system-ui, sans-serif;
      font-size: 10px; font-weight: 600; color: #1A3948;
      cursor: pointer; flex-shrink: 0;
      transition: all 140ms;
    }
    #pd-copy-email:hover { background: rgba(255,255,255,0.95); border-color: #1A3948; }
    #pd-copy-email.copied { border-color: #237a57; color: #237a57; background: rgba(35,122,87,0.06); }

    /* Responsive — hide animation on narrow */
    @media (max-width: 780px) {
      #pd-right { display: none; }
      #pd-left  { width: 100%; }
    }
  `;

  /* ── PILOT SVG ──────────────────────────────────────── */
  const PILOT_SVG = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" style="width:100%;height:100%">
    <defs><style>.mpc{fill:none;stroke:#1A3948;stroke-linecap:round;stroke-linejoin:round;stroke-width:0.9}.mph{fill:#FF5400;stroke:none}</style></defs>
    <g id="pd-wing-l">
      <path class="mpc" d="M15.67,13.06c-.38,.23-.76,.48-1.13,.74l-2.18-2.21c-1.04-1.04-2.73-1.04-3.77,0h0c-1.03,1.04-1.03,2.71,0,3.75l2.26,2.23"/>
    </g>
    <path class="mpc" d="M32.43,13.06c.38,.23,.76,.48,1.13,.74l2.18-2.21c1.04-1.04,2.73-1.04,3.77,0h0c1.03,1.04,1.03,2.71,0,3.75l-2.26,2.23"/>
    <path class="mpc" d="M12.5,22.98c-1.99,2.75-3.07,6.06-3.07,9.46v3.41h31.26v-3.41c.01-3.4-.98-6.71-2.96-9.47"/>
    <path class="mpc" d="M7.78,30.52v10.23c0,.97,.78,1.75,1.75,1.75h28.86c.96,0,1.75-.79,1.75-1.75v-10.32"/>
    <polyline class="mpc" points="17.14 30.43 23.96 37.34 30.69 30.43"/>
    <circle class="mph" cx="17.14" cy="35.23" r=".85"/>
    <circle class="mph" cx="17.14" cy="38.54" r=".85"/>
    <circle class="mph" cx="30.69" cy="35.23" r=".85"/>
    <circle class="mph" cx="30.69" cy="38.54" r=".85"/>
    <path fill="rgba(255,84,0,0.10)" stroke="#1A3948" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"
      d="M23.87,12.76c4.35,0,10.42-1.32,10.42-2.72,0-1.4-4.41-4.54-10.42-4.54-6,0-10.42,3.14-10.42,4.54s6.07,2.72,10.42,2.72Z"/>
    <path fill="none" stroke="#1A3948" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"
      d="M32.24,11.48v1.28c0,.78-4.13,2.68-8.36,2.68-4.23,0-8.36-1.9-8.36-2.68v-1.28"/>
    <path fill="#FF5400" fill-opacity="0.75" stroke="none"
      d="M13.9,10.3c0,0,2.5-.75,9.97-.75c7.47,0,9.97,.75,9.97,.75v0.95c0,0-2.5-.72-9.97-.72c-7.47,0-9.97,.72-9.97,.72Z"/>
    <g id="pd-prop">
      <line stroke="#1A3948" stroke-width="1.1" stroke-linecap="round" x1="23.87" y1="9.15" x2="23.87" y2="7.05"/>
      <line stroke="#1A3948" stroke-width="1.1" stroke-linecap="round" x1="22.4" y1="8.72" x2="20.25" y2="7.78"/>
      <line stroke="#1A3948" stroke-width="1.1" stroke-linecap="round" x1="25.35" y1="8.72" x2="27.5" y2="7.78"/>
      <circle class="mph" cx="23.87" cy="8.5" r="0.85"/>
    </g>
    <circle stroke="#1A3948" stroke-width="0.85" fill="rgba(225,242,255,0.95)" cx="17.14" cy="24.38" r="2.62"/>
    <circle id="pd-pl" fill="#1A3948" cx="17.14" cy="24.38" r="1.18"/>
    <circle fill="white" cx="17.74" cy="23.8" r="0.46"/>
    <circle stroke="#1A3948" stroke-width="0.85" fill="rgba(225,242,255,0.95)" cx="30.69" cy="24.38" r="2.62"/>
    <circle id="pd-pr" fill="#1A3948" cx="30.69" cy="24.38" r="1.18"/>
    <circle fill="white" cx="31.3" cy="23.8" r="0.46"/>
    <line stroke="#1A3948" stroke-width="0.72" stroke-linecap="round" x1="19.76" y1="24.38" x2="28.07" y2="24.38"/>
    <path stroke="#1A3948" stroke-width="0.65" fill="none" stroke-linecap="round" d="M21.6,27.6 Q24,29.2 26.4,27.6"/>
  </svg>`;

  /* ── MARKUP ─────────────────────────────────────────── */
  function buildHTML() {
    const tools = TOOLS.map(t => `
      <a class="pd-tool" href="${t.href}">
        <span class="pd-tool-icon">${t.emoji}</span>
        <span class="pd-tool-name">${t.name}</span>
        <span class="pd-tool-role">${t.role}</span>
        <span class="pd-tool-arr">›</span>
      </a>`).join('');

    const miniPilot = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
      <style>.mpc2{fill:none;stroke:rgba(255,255,255,0.75);stroke-linecap:round;stroke-linejoin:round;stroke-width:1.1}.mph2{fill:#FF5400;stroke:none}</style>
      <path class="mpc2" d="M23.87,12.76c4.35,0,10.42-1.32,10.42-2.72,0-1.4-4.41-4.54-10.42-4.54-6,0-10.42,3.14-10.42,4.54s6.07,2.72,10.42,2.72Z"/>
      <path class="mpc2" d="M32.24,11.48v1.28c0,.78-4.13,2.68-8.36,2.68-4.23,0-8.36-1.9-8.36-2.68v-1.28"/>
      <path fill="rgba(255,84,0,0.7)" stroke="none" d="M13.9,10.3c0,0,2.5-.75,9.97-.75c7.47,0,9.97,.75,9.97,.75v0.95c0,0-2.5-.72-9.97-.72c-7.47,0-9.97,.72-9.97,.72Z"/>
      <line stroke="rgba(255,255,255,0.75)" stroke-width="1.3" stroke-linecap="round" x1="23.87" y1="9.15" x2="23.87" y2="7.05"/>
      <line stroke="rgba(255,255,255,0.75)" stroke-width="1.3" stroke-linecap="round" x1="22.4" y1="8.72" x2="20.25" y2="7.78"/>
      <line stroke="rgba(255,255,255,0.75)" stroke-width="1.3" stroke-linecap="round" x1="25.35" y1="8.72" x2="27.5" y2="7.78"/>
      <circle class="mph2" cx="23.87" cy="8.5" r="0.9"/>
      <circle stroke="rgba(255,255,255,0.7)" stroke-width="0.9" fill="rgba(220,238,255,0.9)" cx="17.14" cy="24.38" r="2.62"/>
      <circle fill="#1A3948" cx="17.14" cy="24.38" r="1.18"/>
      <circle fill="white" cx="17.74" cy="23.8" r="0.46"/>
      <circle stroke="rgba(255,255,255,0.7)" stroke-width="0.9" fill="rgba(220,238,255,0.9)" cx="30.69" cy="24.38" r="2.62"/>
      <circle fill="#1A3948" cx="30.69" cy="24.38" r="1.18"/>
      <circle fill="white" cx="31.3" cy="23.8" r="0.46"/>
      <line stroke="rgba(255,255,255,0.65)" stroke-width="0.8" stroke-linecap="round" x1="19.76" y1="24.38" x2="28.07" y2="24.38"/>
      <path stroke="rgba(255,255,255,0.65)" stroke-width="0.7" fill="none" stroke-linecap="round" d="M21.6,27.6 Q24,29.2 26.4,27.6"/>
      <path class="mpc2" stroke-width="0.85" d="M12.5,22.98c-1.99,2.75-3.07,6.06-3.07,9.46v3.41h31.26v-3.41c.01-3.4-.98-6.71-2.96-9.47"/>
      <path class="mpc2" stroke-width="0.85" d="M7.78,30.52v10.23c0,.97,.78,1.75,1.75,1.75h28.86c.96,0,1.75-.79,1.75-1.75v-10.32"/>
    </svg>`;

    return `
    <div id="pd-overlay">

      <!-- ── MOTHER FRAME ── -->
      <div id="pd-frame">

        <!-- ambient orbs -->
        <div class="pd-orb pd-orb-1"></div>
        <div class="pd-orb pd-orb-2"></div>
        <div class="pd-orb pd-orb-3"></div>

        <!-- bubble tail pointing toward pilot (top-right) -->
        <div id="pd-tail">
          <svg viewBox="0 0 22 12" width="22" height="12" xmlns="http://www.w3.org/2000/svg">
            <path class="pd-tail-path" d="M0,12 L9,12 L16,0 L22,12 Z"/>
          </svg>
        </div>

        <!-- pilot mascot on top of frame (right side) -->
        <div id="pd-mascot">${PILOT_SVG}</div>

        <!-- close button -->
        <button id="pd-close" aria-label="Close">✕</button>

        <!-- bento inner -->
        <div id="pd-inner">

          <!-- LEFT: speech bubble box -->
          <div id="pd-left">
            <div class="pd-box" id="pd-bubble-box">
              <div class="pd-bh">
                <div class="pd-avatar">${miniPilot}</div>
                <div class="pd-speech">
                  <div class="pd-bname">PilotDesk · Briefing intelligence</div>
                  <div class="pd-bquote">${MISSION}</div>
                </div>
              </div>
              <div class="pd-bb">
                <div class="pd-tools-lbl">5 tools on board</div>
                <div class="pd-tools">${tools}</div>
              </div>
              <div class="pd-bf">
                <div class="pd-bf-left">${TEAM}<br>${DISCLAIMER}</div>
                <div class="pd-version">${VERSION}</div>
              </div>
            </div>
          </div>

          <!-- RIGHT: animation + contact -->
          <div id="pd-right">

            <!-- animation box -->
            <div class="pd-box" id="pd-anim-box">
              <div id="pd-anim-bar">
                <div id="pd-anim-dot"></div>
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

            <!-- contact box -->
            <div class="pd-box" id="pd-contact-box">
              <div class="pd-contact-top">
                <div class="pd-contact-icon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#FF5400" stroke-width="1.3"/>
                    <path d="M1 4.5l6 4 6-4" stroke="#FF5400" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <div class="pd-contact-title">Got a question or suggestion?</div>
                  <div class="pd-contact-sub">Email the team directly</div>
                </div>
              </div>
              <div class="pd-email-row">
                <span class="pd-email-addr">${ADMIN_EMAIL}</span>
                <button id="pd-copy-email">
                  <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                    <rect x="1" y="5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M4 4V3a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                  Copy
                </button>
              </div>
            </div>

          </div><!-- /pd-right -->
        </div><!-- /pd-inner -->
      </div><!-- /pd-frame -->
    </div><!-- /pd-overlay -->`;
  }

  /* ── BLUR HOMEPAGE ──────────────────────────────────── */
  function blurPage(on) {
    const targets = [
      document.querySelector('.wrapper'),
      document.querySelector('main'),
      document.querySelector('#root'),
      document.querySelector('.hero'),
      document.querySelector('.tools-grid'),
    ].filter(Boolean);
    // fallback: blur direct children of body except our overlay
    if (!targets.length) {
      Array.from(document.body.children).forEach(el => {
        if (el.id !== 'pd-overlay') {
          el.classList.toggle('pd-blur-target', true);
          el.classList.toggle('blurred', on);
        }
      });
    } else {
      targets.forEach(el => {
        el.classList.toggle('pd-blur-target', true);
        el.classList.toggle('blurred', on);
      });
    }
  }

  /* ── POSITION FRAME ─────────────────────────────────── */
  function positionFrame() {
    const wrap  = document.getElementById('owlWrap');
    const frame = document.getElementById('pd-frame');
    if (!wrap || !frame) return;

    const wr     = wrap.getBoundingClientRect();
    const fw     = frame.offsetWidth  || 790;
    const fh     = frame.offsetHeight || 430;
    const margin = 12;
    const vw     = window.innerWidth;
    const vh     = window.innerHeight;

    // Drop below pilot, right-aligned to pilot's right edge
    let top  = wr.bottom + window.scrollY + margin;
    let left = wr.right  + window.scrollX - fw;

    // Clamp inside viewport
    if (left < margin)             left = margin;
    if (left + fw > vw - margin)   left = vw - fw - margin;
    if (top + fh > window.scrollY + vh - margin) {
      top = wr.top + window.scrollY - fh - margin;
    }

    frame.style.top  = top  + 'px';
    frame.style.left = left + 'px';

    // Position tail to point toward pilot center
    const tail = document.getElementById('pd-tail');
    if (tail) {
      // pilot center X relative to frame left
      const pilotCX    = wr.left + wr.width / 2;
      const framePosX  = parseFloat(frame.style.left) || left;
      const tailOffset = Math.max(12, Math.min(fw - 34, pilotCX - framePosX - 11));
      tail.style.right = 'auto';
      tail.style.left  = tailOffset + 'px';
    }

    // Scale iframe to fit right column
    scaleIframe();
  }

  function scaleIframe() {
    const iframe    = document.getElementById('pd-anim-iframe');
    const animPanel = document.getElementById('pd-anim-box');
    if (!iframe || !animPanel) return;

    const ANIM_W  = 900;
    const ANIM_H  = 560;
    const LABEL   = 26;
    const panelW  = animPanel.offsetWidth || 554;
    const scale   = panelW / ANIM_W;
    const scaledH = Math.round(ANIM_H * scale);

    iframe.style.width          = ANIM_W + 'px';
    iframe.style.height         = ANIM_H + 'px';
    iframe.style.transform      = `scale(${scale})`;
    iframe.style.transformOrigin = 'top left';
    animPanel.style.height      = (LABEL + scaledH) + 'px';
  }

  /* ── OPEN / CLOSE ───────────────────────────────────── */
  function openPopup() {
    const overlay = document.getElementById('pd-overlay');
    const frame   = document.getElementById('pd-frame');
    if (!overlay || !frame) return;
    positionFrame();
    overlay.classList.add('open');
    requestAnimationFrame(() => frame.classList.add('open'));
    blurPage(true);
    startPupilTracking();
  }

  function closePopup() {
    const overlay = document.getElementById('pd-overlay');
    const frame   = document.getElementById('pd-frame');
    if (!overlay || !frame) return;
    frame.classList.remove('open');
    overlay.classList.remove('open');
    blurPage(false);
  }

  function togglePopup() {
    const frame = document.getElementById('pd-frame');
    if (!frame) return;
    frame.classList.contains('open') ? closePopup() : openPopup();
  }

  /* ── PUPIL TRACKING ─────────────────────────────────── */
  let trackingActive = false;
  function startPupilTracking() {
    if (trackingActive) return;
    trackingActive = true;
    const mascot = document.getElementById('pd-mascot');
    const pl     = document.getElementById('pd-pl');
    const pr     = document.getElementById('pd-pr');
    if (!mascot || !pl || !pr) return;

    const SVG_W = 48, SVG_H = 48;
    const HEAD_CX = 24, HEAD_CY = 17;
    const TRAVEL  = 0.95;

    function track(cx, cy) {
      const rect   = mascot.getBoundingClientRect();
      const pivotX = rect.left + rect.width  * (HEAD_CX / SVG_W);
      const pivotY = rect.top  + rect.height * (HEAD_CY / SVG_H);
      const dx     = cx - pivotX;
      const dy     = cy - pivotY;
      const dist   = Math.sqrt(dx*dx + dy*dy) || 1;
      const norm   = Math.min(dist, 280) / 280;
      const pDx    = (dx / dist) * TRAVEL * norm;
      const pDy    = (dy / dist) * TRAVEL * norm;
      pl.style.transform = `translate(${pDx}px,${pDy}px)`;
      pr.style.transform = `translate(${pDx}px,${pDy}px)`;
    }

    document.addEventListener('mousemove', e => track(e.clientX, e.clientY), { passive: true });
    document.addEventListener('touchmove', e => track(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

    function blink() {
      const goggles = document.querySelectorAll('#pd-mascot circle[fill="rgba(225,242,255,0.95)"]');
      goggles.forEach(g => { g.style.transition = 'transform 55ms'; g.style.transform = 'scaleY(0.07)'; });
      setTimeout(() => goggles.forEach(g => { g.style.transition = 'transform 75ms'; g.style.transform = 'scaleY(1)'; }), 80);
      setTimeout(blink, 2800 + Math.random() * 4200);
    }
    setTimeout(blink, 1200 + Math.random() * 2000);
  }

  /* ── COPY EMAIL ─────────────────────────────────────── */
  function copyEmail() {
    const btn = document.getElementById('pd-copy-email');
    if (!btn) return;
    const done = () => {
      const orig = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 13 13" fill="none"><path d="M2 7l3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied`;
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2200);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(ADMIN_EMAIL).then(done);
    } else {
      const ta = document.createElement('textarea');
      ta.value = ADMIN_EMAIL; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); done();
    }
  }

  /* ── INIT ───────────────────────────────────────────── */
  function init() {
    const style = document.createElement('style');
    style.id = 'pd-popup-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', buildHTML());

    // Recalc on iframe load
    document.getElementById('pd-anim-iframe')?.addEventListener('load', () => {
      const frame = document.getElementById('pd-frame');
      if (frame && frame.classList.contains('open')) scaleIframe();
    });

    // Make pilot clickable
    const wrap = document.getElementById('owlWrap');
    if (wrap) {
      wrap.style.cursor       = 'pointer';
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
    document.getElementById('pd-close')?.addEventListener('click', closePopup);

    // Backdrop click
    document.getElementById('pd-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'pd-overlay') closePopup();
    });

    // Escape
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });

    // Copy email
    document.getElementById('pd-copy-email')?.addEventListener('click', copyEmail);

    // Reposition on resize / scroll
    const reposition = () => {
      const frame = document.getElementById('pd-frame');
      if (frame && frame.classList.contains('open')) positionFrame();
    };
    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
