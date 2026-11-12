(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  if (window.top !== window.self || params.get('lens') === '1') return;

  const style = document.createElement('style');
  style.textContent = `
    .flux-review-entry{position:fixed;right:18px;bottom:18px;z-index:9997;display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #1f3a5f;background:rgba(255,255,255,.96);color:#1f3a5f;text-decoration:none;box-shadow:0 12px 30px rgba(20,23,26,.14);font:700 12px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;backdrop-filter:blur(10px)}
    .flux-review-entry:hover,.flux-review-entry:focus-visible{background:#1f3a5f;color:#fff;outline:none}
    .flux-review-entry:hover small,.flux-review-entry:focus-visible small{color:#dce3ec}
    .flux-review-entry small{font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#3d4f66;letter-spacing:0}
    @media(max-width:640px){.flux-review-entry{right:10px;bottom:10px;padding:9px 10px}.flux-review-entry small{display:none}}
    @media(prefers-reduced-motion:reduce){.flux-review-entry{scroll-behavior:auto}}
  `;
  document.head.appendChild(style);

  const entry = document.createElement('a');
  entry.className = 'flux-review-entry';
  entry.href = 'design-lens.html';
  entry.innerHTML = '<span>PORTFOLIO REVIEW ↗</span><small>Decisions, states, tour</small>';
  document.body.appendChild(entry);
})();
