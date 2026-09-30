(() => {
  'use strict';

  const meta = {
    'D-01': {
      evidence: 'PROJECT_CONTEXT + WORKING_PROTOTYPE / HYPOTHESIS',
      tradeoff: 'More approval context in the working surface versus a simpler payment-detail pane.',
      task: 'Task 1 · explain why approval is required, who acts now, who acts next.'
    },
    'D-02': {
      evidence: 'WORKING_PROTOTYPE / HYPOTHESIS',
      tradeoff: 'Stable visibility across roles versus exposing permission complexity directly in the interface.',
      task: 'Task 2 · explain what changed when role authority changes and what stayed visible.'
    },
    'D-03': {
      evidence: 'FORCED_STATE TECHNICAL_PROOF / HYPOTHESIS',
      tradeoff: 'Explicit financial-consequence copy versus a more compact institutional interface.',
      task: 'Task 3 · handle settlement failure, state whether money moved, choose a safe recovery path.'
    },
    'D-04': {
      evidence: 'WORKING_PROTOTYPE / HYPOTHESIS',
      tradeoff: 'Reconstructable history in context versus denser visual scanning during approval.',
      task: 'Task 4 · reconstruct how and why the payment reached its current state.'
    }
  };

  const css = document.createElement('style');
  css.textContent = `
    .lens-proof-strip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}
    .lens-proof-stat{border:1px solid #cfd4ce;background:#fff;padding:8px;min-width:0}
    .lens-proof-stat strong{display:block;font:800 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#1f3a5f}
    .lens-proof-stat span{display:block;margin-top:4px;font:700 8px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;color:#66706a}
    .lens-return{display:inline-flex;align-items:center;gap:6px;margin-top:10px;color:#1f3a5f;text-decoration:none;font:800 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em}
    .lens-return:hover{text-decoration:underline;text-underline-offset:3px}
    .decision-evidence{margin-top:8px;padding-top:8px;border-top:1px solid #e1e4df;font-size:10px;line-height:1.45;color:#66706a}
    .decision-evidence b{color:#14171a}
    .lens-mobile-toggle{display:none;position:fixed;left:8px;top:8px;z-index:40;border:1px solid #1f3a5f;background:#fff;color:#1f3a5f;padding:8px 9px;font:800 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 8px 20px rgba(20,23,26,.12)}
    .lens-research-gate{margin-top:8px;border:1px dashed #b9c1b8;background:#fff;padding:9px;font-size:10px;line-height:1.45;color:#66706a}
    .lens-research-gate strong{color:#14171a}
    @media(max-width:900px){
      .lens-mobile-toggle{display:block}
      .rail{transition:transform .25s ease}
      .rail.lens-collapsed{transform:translateX(calc(-100% + 48px))}
      .rail.lens-collapsed .rail-head,.rail.lens-collapsed .scroll{visibility:hidden}
    }
    @media(prefers-reduced-motion:reduce){.rail{transition:none!important}}
  `;
  document.head.appendChild(css);

  const rail = document.querySelector('.rail');
  const railHead = document.querySelector('.rail-head');
  const stage = document.querySelector('.stage');
  const frame = document.getElementById('frame');

  if (railHead) {
    const proof = document.createElement('div');
    proof.className = 'lens-proof-strip';
    proof.setAttribute('aria-label', 'Flux evidence status');
    proof.innerHTML = `
      <div class="lens-proof-stat"><strong>0</strong><span>VERIFIED USERS</span></div>
      <div class="lens-proof-stat"><strong>4</strong><span>DECISIONS UNDER TEST</span></div>
      <div class="lens-proof-stat"><strong>4</strong><span>FORCED STATES</span></div>
      <div class="lens-proof-stat"><strong>R01</strong><span>READY TO RECRUIT</span></div>`;
    railHead.appendChild(proof);

    const gate = document.createElement('div');
    gate.className = 'lens-research-gate';
    gate.innerHTML = '<strong>Research gate:</strong> no direct-user finding exists yet. Current pins are design decisions + technical proof; iteration remains blocked until traceable participant evidence exists.';
    railHead.appendChild(gate);

    const back = document.createElement('a');
    back.className = 'lens-return';
    back.href = 'index.html';
    back.textContent = '← RETURN TO NORMAL PRODUCT';
    railHead.appendChild(back);
  }

  const stillOpenHeading = [...document.querySelectorAll('.section h2')].find((el) => el.textContent.trim() === 'STILL OPEN');
  if (stillOpenHeading) stillOpenHeading.textContent = 'STILL OPEN · BEFORE ROUND 01';

  document.querySelectorAll('.decision').forEach((card) => {
    const strong = card.querySelector('strong');
    const id = strong?.textContent.match(/D-0\d/)?.[0];
    if (!id || !meta[id] || card.querySelector('.decision-evidence')) return;
    const detail = document.createElement('div');
    detail.className = 'decision-evidence';
    detail.innerHTML = `<b>Evidence</b> — ${meta[id].evidence}<br><b>Trade-off</b> — ${meta[id].tradeoff}<br><b>Next evidence</b> — ${meta[id].task}`;
    card.appendChild(detail);
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'lens-mobile-toggle';
  toggle.setAttribute('aria-controls', 'flux-evidence-rail');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.textContent = 'EVIDENCE';
  document.body.appendChild(toggle);
  if (rail) rail.id = 'flux-evidence-rail';

  const syncMobile = () => {
    if (!rail) return;
    if (window.innerWidth <= 900 && !rail.dataset.mobileInitialized) {
      rail.classList.add('lens-collapsed');
      rail.dataset.mobileInitialized = 'true';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'EVIDENCE +';
    }
    if (window.innerWidth > 900) {
      rail.classList.remove('lens-collapsed');
      delete rail.dataset.mobileInitialized;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = 'EVIDENCE';
    }
  };

  toggle.addEventListener('click', () => {
    if (!rail) return;
    const collapsed = rail.classList.toggle('lens-collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.textContent = collapsed ? 'EVIDENCE +' : 'CLOSE ×';
  });
  window.addEventListener('resize', syncMobile);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && window.innerWidth <= 900 && rail && !rail.classList.contains('lens-collapsed')) {
      rail.classList.add('lens-collapsed');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'EVIDENCE +';
    }
  });
  syncMobile();

  const enhancePopover = (doc, pop) => {
    if (!pop || pop.dataset.deepEvidence === 'true') return;
    const id = pop.textContent.match(/D-0\d/)?.[0];
    if (!id || !meta[id]) return;
    const extra = doc.createElement('div');
    extra.className = 'meta';
    extra.innerHTML = `<b>Trade-off</b> — ${meta[id].tradeoff}<br><b>Next evidence</b> — ${meta[id].task}`;
    pop.appendChild(extra);
    pop.dataset.deepEvidence = 'true';
  };

  const watchFrame = () => {
    const doc = frame?.contentDocument;
    if (!doc?.body) return;
    doc.querySelectorAll('.lens-pop').forEach((pop) => enhancePopover(doc, pop));
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof frame.contentWindow.HTMLElement)) return;
          if (node.classList?.contains('lens-pop')) enhancePopover(doc, node);
          node.querySelectorAll?.('.lens-pop').forEach((pop) => enhancePopover(doc, pop));
        });
      }
    });
    observer.observe(doc.body, { childList: true, subtree: true });
  };

  frame?.addEventListener('load', watchFrame);
  if (frame?.contentDocument?.readyState === 'complete') watchFrame();
})();
