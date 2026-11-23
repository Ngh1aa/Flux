/* Helpers shared by the direction mock-ups. They read the real seed (data/seed.js) so every direction
   shows the same payments, people and amounts. Mock-ups only: no saving, no routing. */
(function () {
  const S = window.FLUX_SEED;
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const money = (amount, ccy) => amount.toLocaleString('en-US', {
    minimumFractionDigits: ccy === 'JPY' ? 0 : 2, maximumFractionDigits: ccy === 'JPY' ? 0 : 2,
  });
  const usd = (p) => p.amount * (S.fx[p.currency] || 1);
  const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const time = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const STATUS = { pending: 'Pending', processing: 'Processing', completed: 'Completed', draft: 'Draft', rejected: 'Rejected', cancelled: 'Cancelled' };

  /* The control chain of one payment as steps: created, each approver, execution. */
  function rail(p) {
    const steps = [{ label: 'Created', who: 'Jamie Stone', at: p.createdAt, state: 'done' }];
    if (p.status === 'draft') {
      steps[0] = { label: 'Draft', who: 'Jamie Stone', at: p.createdAt, state: 'current' };
      return steps.concat({ label: 'Submit', who: 'Not submitted', state: 'next' });
    }
    p.chain.forEach((role, i) => {
      const approval = p.approvals.find((a) => a.role === role);
      const state = approval ? 'done' : i === p.stage && p.status === 'pending' ? 'current' : 'next';
      steps.push({ label: role, who: approval ? approval.by : S.approverDirectory[role] || role, at: approval && approval.at, state });
    });
    const executed = p.status === 'completed';
    steps.push({ label: 'Execution', who: 'System', at: executed ? p.executionDate + 'T09:00:00' : null, state: executed ? 'done' : p.status === 'processing' ? 'current' : 'next' });
    return steps;
  }

  /* Where a payment waits, from the point of view of the signed-in approver (Finance manager). */
  function lane(p) {
    if (p.status === 'draft') return 'draft';
    if (p.status === 'pending') return p.chain[p.stage] === 'Finance manager' ? 'mine' : 'others';
    if (p.status === 'processing') return 'settling';
    return 'done';
  }

  window.MOCK = { S, esc, money, usd, day, time, STATUS, rail, lane, payments: S.payments };
})();
