// Approval Rail Logic for Payments Page
document.addEventListener('DOMContentLoaded', () => {
  const newPaymentForm = document.getElementById('new-payment-view');
  const paymentDetailView = document.getElementById('payment-detail-view');
  const submitBtn = document.getElementById('submit-payment-btn');
  const cancelBtn = document.getElementById('cancel-payment-btn');
  
  if (submitBtn && newPaymentForm && paymentDetailView) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const amount = document.getElementById('amount-input').value;
      const recipient = document.getElementById('recipient-input').value;
      
      document.getElementById('detail-amount').textContent = `$${amount}`;
      document.getElementById('detail-recipient').textContent = recipient;
      
      newPaymentForm.classList.add('hidden');
      paymentDetailView.classList.remove('hidden');
      
      updateApprovalRail(1); 
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
  const nextApprover = document.getElementById('next-approver-text');
  
  if (!btn) return;
  
  btn.dataset.step = currentStep;

  // Update Rail Nodes
  for (let i = 1; i <= 4; i++) {
    const node = document.getElementById(`rail-node-${i}`);
    const title = document.getElementById(`rail-title-${i}`);
    
    node.className = 'rail-node'; // reset
    title.classList.remove('future');
    
    if (currentStep > i) {
      node.classList.add('completed');
    } else if (currentStep === i) {
      node.classList.add('current');
    } else {
      node.classList.add('future');
      title.classList.add('future');
    }
  }

  // Update actions and status footer
  if (currentStep === 1) {
    btn.textContent = 'Approve as Manager';
    nextApprover.textContent = 'Next approver: Alex Smith, Finance Manager';
  } else if (currentStep === 2) {
    btn.textContent = 'Approve as CFO';
    nextApprover.textContent = 'Next approver: Sarah Jen, CFO';
  } else if (currentStep === 3) {
    btn.textContent = 'Execute';
    nextApprover.textContent = 'Next step: System Execution';
  } else if (currentStep === 4) {
    document.getElementById('action-buttons').classList.add('hidden');
    badge.textContent = 'Approved';
    badge.className = 'badge badge-approved';
    nextApprover.textContent = 'Payment successfully executed.';
  }
}
