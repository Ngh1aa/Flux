// Approval Rail Logic for Payments Page
document.addEventListener('DOMContentLoaded', () => {
  const newPaymentForm = document.getElementById('new-payment-view');
  const paymentDetailView = document.getElementById('payment-detail-view');
  const submitBtn = document.getElementById('submit-payment-btn');
  const cancelBtn = document.getElementById('cancel-payment-btn');
  
  if (submitBtn && newPaymentForm && paymentDetailView) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update values in detail view
      const amount = document.getElementById('amount-input').value;
      const currency = document.getElementById('currency-input').value;
      const recipient = document.getElementById('recipient-input').value;
      
      const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
      document.getElementById('detail-amount').textContent = formatted;
      document.getElementById('detail-recipient').textContent = `To: ${recipient}`;
      
      // Switch view
      newPaymentForm.classList.add('hidden');
      paymentDetailView.classList.remove('hidden');
      
      updateApprovalRail(1); // Set to step 1 (draft created, needs mgr)
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      document.getElementById('amount-input').value = '';
      document.getElementById('recipient-input').value = '';
    });
  }

  const approveBtn = document.getElementById('approve-action-btn');
  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      let currentStep = parseInt(approveBtn.dataset.step || '1');
      if (currentStep < 4) {
        currentStep++;
        updateApprovalRail(currentStep);
      }
    });
  }
});

function updateApprovalRail(currentStep) {
  const btn = document.getElementById('approve-action-btn');
  const badge = document.getElementById('status-badge');
  const progressLine = document.getElementById('rail-progress');
  const activityMgr = document.getElementById('activity-mgr');
  const activityCfo = document.getElementById('activity-cfo');
  
  if (!btn) return;
  
  btn.dataset.step = currentStep;
  progressLine.style.width = `${((currentStep - 1) / 3) * 100}%`;

  // Update Rail Icons
  for (let i = 1; i <= 4; i++) {
    const icon = document.getElementById(`rail-icon-${i}`);
    const title = document.getElementById(`rail-title-${i}`);
    
    icon.classList.remove('success', 'current', 'pending');
    title.classList.remove('pending');
    icon.innerHTML = '';
    
    if (currentStep > i) {
      icon.classList.add('success');
      icon.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (currentStep === i) {
      icon.classList.add('current');
      icon.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
    } else {
      icon.classList.add('pending');
      title.classList.add('pending');
    }
  }

  // Update actions and activity trail
  if (currentStep === 1) {
    btn.textContent = 'Approve as Manager';
  } else if (currentStep === 2) {
    btn.textContent = 'Approve as CFO';
    if(activityMgr) activityMgr.classList.remove('hidden');
  } else if (currentStep === 3) {
    btn.textContent = 'Execute';
    if(activityCfo) activityCfo.classList.remove('hidden');
  } else if (currentStep === 4) {
    document.getElementById('action-buttons').classList.add('hidden');
    badge.textContent = 'Executed';
    badge.className = 'badge badge-success';
  }
}
