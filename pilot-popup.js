/**
 * PilotDesk — Pilot Popup v4.0
 * Fixed centered modal. No tail. No mascot on frame.
 * Stable size. Blurs homepage on open.
 *
 * LEFT:  speech bubble + tools list
 * RIGHT: animation iframe (top) + contact CTA (bottom)
 *
 * Requires: pilotdesk-animation.html in same folder as index.html
 * Version: 4.0 · May 2026
 */
(function () {
  'use strict';

  const ANIM_SRC    = './pilotdesk-animation.html';
  const ADMIN_EMAIL = 'DehghanMadisehA@rferl.org';
  const VERSION     = 'v1.5 · May 2026';
  const TEAM        = 'Digital Transformation · RFE/RL';
  const DISCLAIMER  = 'Not an official Microsoft product.';
  const MISSION     = 'PilotDesk turns your editorial context into precision Copilot prompts. You fill the form — I build the prompt — you paste it in Outlook and fly.';

  const TOOLS = [
    { emoji: '🌅', name: 'Morning Briefing',    role: 'Daily intelligence brief',   href: './morning'   },
    { emoji: '🔍', name: 'Bias Detector',        role: 'Editorial bias analysis',    href: './bias'      },
    { emoji: '🧠', name: 'Memory Hunter',        role: 'Context & source recall',    href: './memory'    },
    { emoji: '🎙️', name: 'Meeting Recap',        role: 'Meeting to action items',    href: './meeting'   },
    { emoji: '✅', name: 'Fact-Check Assistant', role: 'Claim verification prompt',  href: './factcheck' },
  ];

  /* ─────────────────────────────────────────────────────
     STYLES
  ───────────────────────────────────────────────────── */
  const CSS = `

    /* Overlay — fixed, covers full screen, blurs bg */
    #pd-overlay {
      position: fixed;
      inset: 0;
      z-index: 8000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 25, 35, 0);
      transition: background 280ms ease;
      pointer-events: none;
    }
    #pd-overlay.open {
      pointer-events: all;
      background: rgba(15, 25, 35, 0.45);
    }

    /* Homepage blur */
    .pd-blur-target {
      transition: filter 280ms ease;
    }
    .pd-blur-target.blurred {
      filter: blur(5px);
    }

    /* ── MOTHER FRAME — fixed size, centered ── */
    #pd-frame {
      position: relative;
      width: 820px;
      max-width: calc(100vw - 48px);

      /* Liquid Glass */
      background: rgba(248, 247, 246, 0.60);
      backdrop-filter: blur(28px) saturate(2.0);
      -webkit-backdrop-filter: blur(28px) saturate(2.0);
      border: 1px solid rgba(255, 255, 255, 0.88);
      border-radius: 20px;
      box-shadow:
        0 32px 80px rgba(26, 57, 72, 0.18),
        0 8px 24px rgba(26, 57, 72, 0.10),
        inset 0 1.5px 0 rgba(255, 255, 255, 0.95),
        inset 0 -1px 0 rgba(26, 57, 72, 0.03);
      overflow: hidden;

      /* enter animation */
      opacity: 0;
      transform: scale(0.94) translateY(12px);
      transition:
        opacity 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        transform 320ms cubic-bezier(0.34, 1.40, 0.64, 1);
      pointer-events: none;
    }
    #pd-frame.open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: all;
    }

    /* Ambient orbs — decorative, no layout effect */
    .pd-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
    }
    .pd-orb-1 {
      width: 280px; height: 200px;
      top: -60px; left: -60px;
      background: radial-gradient(ellipse, rgba(255,84,0,0.12) 0%, transparent 70%);
      filter: blur(60px);
    }
    .pd-orb-2 {
      width: 220px; height: 180px;
      bottom: -30px; right: -40px;
      background: radial-gradient(ellipse, rgba(255,192,71,0.09) 0%, transparent 70%);
      filter: blur(50px);
    }
    .pd-orb-3 {
      width: 180px; height: 160px;
      top: 40%; left: 35%;
      background: radial-gradient(ellipse, rgba(26,57,72,0.06) 0%, transparent 70%);
      filter: blur(50px);
    }

    /* ── SINGLE CLOSE BUTTON ── */
    #pd-close {
      position: absolute;
      top: 11px; right: 12px;
      z-index: 10;
      width: 26px; height: 26px;
      background: rgba(26, 57, 72, 0.08);
      border: 1px solid rgba(26, 57, 72, 0.12);
      border-radius: 8px;
      cursor: pointer;
      color: rgba(26, 57, 72, 0.50);
      font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      transition: background 140ms, color 140ms;
      font-family: inherit;
    }
    #pd-close:hover {
      background: rgba(26, 57, 72, 0.14);
      color: #1A3948;
    }

    /* ── BENTO LAYOUT ── */
    #pd-inner {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 10px;
      padding: 14px;
    }

    /* LEFT column */
    #pd-left {
      width: 236px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    /* RIGHT column */
    #pd-right {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* ── BENTO CHILD BOXES ── */
    .pd-box {
      background: rgba(255, 255, 255, 0.58);
      border: 1px solid rgba(255, 255, 255, 0.90);
      border-radius: 12px;
      box-shadow:
        0 2px 12px rgba(26, 57, 72, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.95);
      overflow: hidden;
      font-family: 'Noto Sans', system-ui, sans-serif;
      color: #1A3948;
    }

    /* Bubble box fills left column height */
    #pd-bubble-box {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Bubble header */
    .pd-bh {
      background: #1A3948;
      padding: 12px 13px 11px;
      display: flex; gap: 9px; align-items: flex-start;
      flex-shrink: 0;
    }
    .pd-avatar {
      width: 28px; height: 28px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pd-avatar svg { width: 18px; height: 18px; }
    .pd-bname {
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.10em; text-transform: uppercase;
      color: rgba(255,255,255,0.40); margin-bottom: 3px;
    }
    .pd-bquote {
      font-family: 'Lora', Georgia, serif;
      font-size: 11px; font-style: italic;
      color: rgba(248,247,246,0.90);
      line-height: 1.5;
    }

    /* Bubble body */
    .pd-bb {
      padding: 10px 11px 8px;
      flex: 1; display: flex; flex-direction: column;
    }
    .pd-tools-lbl {
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.11em; text-transform: uppercase;
      color: rgba(26,57,72,0.35); margin-bottom: 5px;
    }
    .pd-tools { display: flex; flex-direction: column; gap: 0; flex: 1; }
    .pd-tool {
      display: flex; align-items: center; gap: 7px;
      padding: 5px 6px; border-radius: 7px;
      text-decoration: none; color: inherit;
      transition: background 120ms;
    }
    .pd-tool:hover { background: rgba(26,57,72,0.05); }
    .pd-tool-icon { font-size: 12px; flex-shrink: 0; }
    .pd-tool-name { font-size: 11px; font-weight: 600; color: #1A3948; flex: 1; line-height: 1.2; }
    .pd-tool-role { font-size: 9.5px; color: rgba(26,57,72,0.40); white-space: nowrap; }
    .pd-tool-arr  { font-size: 9px; color: rgba(26,57,72,0.20); margin-left: 1px; }

    /* Bubble footer */
    .pd-bf {
      border-top: 1px solid rgba(26,57,72,0.06);
      padding: 6px 11px;
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(26,57,72,0.025); flex-shrink: 0;
    }
    .pd-bf-left  { font-size: 9px; color: rgba(26,57,72,0.35); line-height: 1.4; }
    .pd-version  { font-size: 8.5px; font-weight: 700; letter-spacing: 0.06em; color: rgba(255,84,0,0.50); white-space: nowrap; }

    /* ── ANIMATION BOX ── */
    #pd-anim-box {
      position: relative;
      /* height set by JS — stays fixed once set */
      flex-shrink: 0;
    }
    #pd-anim-bar {
      position: absolute; top: 0; left: 0; right: 0;
      height: 26px; z-index: 2;
      background: rgba(26,57,72,0.86);
      border-radius: 12px 12px 0 0;
      display: flex; align-items: center; padding: 0 11px; gap: 6px;
    }
    #pd-anim-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: #FF5400; flex-shrink: 0;
      animation: pdDotPulse 2s ease-in-out infinite;
    }
    @keyframes pdDotPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,84,0,0.5); }
      50%      { box-shadow: 0 0 0 5px rgba(255,84,0,0); }
    }
    #pd-anim-bar span {
      font-size: 9.5px; font-weight: 600;
      letter-spacing: 0.07em; text-transform: uppercase;
      color: rgba(248,247,246,0.65);
      font-family: 'Noto Sans', system-ui, sans-serif;
    }
    #pd-anim-iframe {
      display: block; border: none;
      transform-origin: top left;
      /* width/height/transform set by JS */
    }

    /* ── CONTACT BOX ── */
    #pd-contact-box { padding: 11px 13px; flex-shrink: 0; }
    .pd-contact-top {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .pd-contact-icon {
      width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
      background: rgba(255,84,0,0.08);
      border: 1px solid rgba(255,84,0,0.15);
      display: flex; align-items: center; justify-content: center;
    }
    .pd-contact-title { font-size: 11px; font-weight: 700; color: #1A3948; }
    .pd-contact-sub   { font-size: 9.5px; color: rgba(26,57,72,0.45); margin-top: 1px; }
    .pd-email-row {
      display: flex; align-items: center; gap: 7px;
      background: rgba(26,57,72,0.04);
      border: 1px solid rgba(26,57,72,0.08);
      border-radius: 7px; padding: 6px 10px;
    }
    .pd-email-addr {
      flex: 1; font-size: 10.5px; font-weight: 500; color: #1A3948;
      font-family: 'JetBrains Mono', 'Fira Mono', monospace;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #pd-copy-email {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 9px; border-radius: 6px;
      border: 1px solid rgba(26,57,72,0.13);
      background: rgba(255,255,255,0.75);
      font-family: 'Noto Sans', system-ui, sans-serif;
      font-size: 10px; font-weight: 600; color: #1A3948;
      cursor: pointer; flex-shrink: 0;
      transition: all 130ms;
    }
    #pd-copy-email:hover   { background: white; border-color: #1A3948; }
    #pd-copy-email.copied  { border-color: #237a57; color: #237a57; background: rgba(35,122,87,0.06); }

    /* Responsive — single column on narrow screens */
    @media (max-width: 700px) {
      #pd-right { display: none; }
      #pd-left  { width: 100%; }
      #pd-frame { width: calc(100vw - 48px); }
    }
  `;

  /* ── MINI PILOT SVG (for header avatar only) ─────── */
  const MINI_PILOT = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none">
    <style>.mp{fill:none;stroke:rgba(255,255,255,0.75);stroke-linecap:round;stroke-linejoin:round;stroke-width:1.1}.mh{fill:#FF5400;stroke:none}</style>
    <path class="mp" d="M23.87,12.76c4.35,0,10.42-1.32,10.42-2.72,0-1.4-4.41-4.54-10.42-4.54-6,0-10.42,3.14-10.42,4.54s6.07,2.72,10.42,2.72Z"/>
    <path class="mp" d="M32.24,11.48v1.28c0,.78-4.13,2.68-8.36,2.68-4.23,0-8.36-1.9-8.36-2.68v-1.28"/>
    <path fill="rgba(255,84,0,0.7)" stroke="none" d="M13.9,10.3c0,0,2.5-.75,9.97-.75c7.47,0,9.97,.75,9.97,.75v.95c0,0-2.5-.72-9.97-.72c-7.47,0-9.97,.72-9.97,.72Z"/>
    <circle class="mh" cx="23.87" cy="8.5" r="0.9"/>
    <circle stroke="rgba(255,255,255,0.7)" stroke-width="0.9" fill="rgba(220,238,255,0.9)" cx="17.14" cy="24.38" r="2.62"/>
    <circle fill="#1A3948" cx="17.14" cy="24.38" r="1.18"/>
    <circle fill="white" cx="17.74" cy="23.8" r="0.46"/>
    <circle stroke="rgba(255,255,255,0.7)" stroke-width="0.9" fill="rgba(220,238,255,0.9)" cx="30.69" cy="24.38" r="2.62"/>
    <circle fill="#1A3948" cx="30.69" cy="24.38" r="1.18"/>
    <circle fill="white" cx="31.3" cy="23.8" r="0.46"/>
    <line stroke="rgba(255,255,255,0.65)" stroke-width="0.8" stroke-linecap="round" x1="19.76" y1="24.38" x2="28.07" y2="24.38"/>
    <path stroke="rgba(255,255,255,0.65)" stroke-width="0.7" fill="none" stroke-linecap="round" d="M21.6,27.6 Q24,29.2 26.4,27.6"/>
    <path class="mp" stroke-width="0.85" d="M12.5,22.98c-1.99,2.75-3.07,6.06-3.07,9.46v3.41h31.26v-3.41c.01-3.4-.98-6.71-2.96-9.47"/>
    <path class="mp" stroke-width="0.85" d="M7.78,30.52v10.23c0,.97,.78,1.75,1.75,1.75h28.86c.96,0,1.75-.79,1.75-1.75v-10.32"/>
  </svg>`;

  /* ── BUILD HTML ─────────────────────────────────── */
  function buildHTML() {
    const tools = TOOLS.map(t => `
      <a class="pd-tool" href="${t.href}">
        <span class="pd-tool-icon">${t.emoji}</span>
        <span class="pd-tool-name">${t.name}</span>
        <span class="pd-tool-role">${t.role}</span>
        <span class="pd-tool-arr">›</span>
      </a>`).join('');

    return `
    <div id="pd-overlay">
      <div id="pd-frame">

        <!-- orbs -->
        <div class="pd-orb pd-orb-1"></div>
        <div class="pd-orb pd-orb-2"></div>
        <div class="pd-orb pd-orb-3"></div>

        <!-- close -->
        <button id="pd-close" aria-label="Close">✕</button>

        <!-- bento -->
        <div id="pd-inner">

          <!-- LEFT: bubble -->
          <div id="pd-left">
            <div class="pd-box" id="pd-bubble-box">
              <div class="pd-bh">
                <div class="pd-avatar">${MINI_PILOT}</div>
                <div>
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

            <div class="pd-box" id="pd-contact-box">
              <div class="pd-contact-top">
                <div class="pd-contact-icon">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
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
                  <svg width="10" height="10" viewBox="0 0 13 13" fill="none">
                    <rect x="1" y="5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M4 4V3a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                  Copy
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>`;
  }

  /* ── SCALE IFRAME — called once on open, never again ── */
  let iframeScaled = false;
  function scaleIframe() {
    if (iframeScaled) return;
    const iframe    = document.getElementById('pd-anim-iframe');
    const animBox   = document.getElementById('pd-anim-box');
    if (!iframe || !animBox) return;

    const ANIM_W  = 900;
    const ANIM_H  = 560;
    const LABEL_H = 26;
    const panelW  = animBox.offsetWidth;
    if (!panelW) return;          // not yet painted — retry
    const scale   = panelW / ANIM_W;
    const scaledH = Math.round(ANIM_H * scale);

    iframe.style.width           = ANIM_W + 'px';
    iframe.style.height          = ANIM_H + 'px';
    iframe.style.transform       = `scale(${scale})`;
    iframe.style.transformOrigin = 'top left';
    iframe.style.marginTop       = LABEL_H + 'px';
    animBox.style.height         = (LABEL_H + scaledH) + 'px';
    animBox.style.minHeight      = animBox.style.height;

    iframeScaled = true;
  }

  /* ── BLUR HOMEPAGE ──────────────────────────────── */
  function blurPage(on) {
    Array.from(document.body.children).forEach(el => {
      if (el.id === 'pd-overlay') return;
      el.classList.add('pd-blur-target');
      if (on) el.classList.add('blurred');
      else     el.classList.remove('blurred');
    });
  }

  /* ── OPEN / CLOSE ───────────────────────────────── */
  function openPopup() {
    const overlay = document.getElementById('pd-overlay');
    const frame   = document.getElementById('pd-frame');
    if (!overlay || !frame) return;
    overlay.classList.add('open');
    requestAnimationFrame(() => {
      frame.classList.add('open');
      // scale iframe after frame is visible so offsetWidth is correct
      requestAnimationFrame(scaleIframe);
    });
    blurPage(true);
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

  /* ── COPY EMAIL ─────────────────────────────────── */
  function copyEmail() {
    const btn = document.getElementById('pd-copy-email');
    const done = () => {
      const orig = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 13 13" fill="none"><path d="M2 7l3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied`;
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2200);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(ADMIN_EMAIL).then(done);
    } else {
      const ta = document.createElement('textarea');
      ta.value = ADMIN_EMAIL; ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); done();
    }
  }

  /* ── INIT ───────────────────────────────────────── */
  function init() {
    const style = document.createElement('style');
    style.id = 'pd-popup-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', buildHTML());

    // Wire pilot mascot on homepage
    const wrap = document.getElementById('owlWrap');
    if (wrap) {
      wrap.style.cursor        = 'pointer';
      wrap.style.pointerEvents = 'all';
      wrap.setAttribute('role',       'button');
      wrap.setAttribute('aria-label', 'About PilotDesk');
      wrap.setAttribute('tabindex',   '0');
      wrap.addEventListener('click',   togglePopup);
      wrap.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePopup(); }
      });
    }

    document.getElementById('pd-close')?.addEventListener('click', closePopup);
    document.getElementById('pd-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'pd-overlay') closePopup();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });
    document.getElementById('pd-copy-email')?.addEventListener('click', copyEmail);

    // Rescale if window resizes (but don't thrash — reset flag so it recalculates)
    window.addEventListener('resize', () => {
      iframeScaled = false;
      const frame = document.getElementById('pd-frame');
      if (frame && frame.classList.contains('open')) scaleIframe();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
