/* Flux seed data.
   Single source of workspace data. Every page copies it into sessionStorage
   on first load (see core.js). All companies, people and accounts are fictional. */
(() => {
  'use strict';

  const seed = {
    meta: {
      version: 5,
      workspace: 'Minh An Trading',
      baseCurrency: 'USD',
      // The workspace clock starts here and advances in real time.
      clockStart: '2026-09-15T15:02:00',
      // Email and password stay on the old domain until the Team screen moves to the new content (step 4).
      currentUser: { name: 'Võ Ngọc Lan', title: 'Sales', role: 'Employee', email: 'jamie.stone@northstar.co', initials: 'NL' },
      // Seeded sign-in for the login screen (session only).
      credentials: { email: 'jamie.stone@northstar.co', password: 'northstar' }
    },

    fx: { USD: 1, EUR: 1.09, GBP: 1.27, JPY: 0.0068, SGD: 0.74, VND: 0.0000394 },

    // Team lead, Director and Accountant run the request chain. The old roles stay for the Team and
    // Settings screens until they move to the new content (step 4).
    approverDirectory: {
      'Team lead': 'Lê Minh Khoa',
      Director: 'Trần Quốc Bảo',
      Accountant: 'Nguyễn Thu Hà',
      'Finance manager': 'Alex Smith',
      CFO: 'Sarah Jensen',
      Controller: 'Mateo Ruiz',
      'Treasury lead': 'Sarah Jensen'
    },

    // Vendors the company pays directly.
    payees: [
      { id: 'PYE-1001', name: 'Phương Nam Printing', country: 'Hồ Chí Minh City', currency: 'VND', bank: 'Vietcombank', account: '0071 0004 •• 4410', email: 'sales@phuongnamprint.vn', createdAt: '2024-05-14' },
      { id: 'PYE-1002', name: 'Hòa Phát Furniture', country: 'Hà Nội', currency: 'VND', bank: 'BIDV', account: '3110 0012 •• 8823', email: 'b2b@hoaphatfurniture.vn', createdAt: '2023-11-02' },
      { id: 'PYE-1003', name: 'Sao Mai Catering', country: 'Hồ Chí Minh City', currency: 'VND', bank: 'Techcombank', account: '1903 5521 •• 0076', email: 'order@saomaicatering.vn', createdAt: '2026-09-08' },
      { id: 'PYE-1004', name: 'Viettel Business', country: 'Hà Nội', currency: 'VND', bank: 'MB Bank', account: '0680 1100 •• 2291', email: 'doanhnghiep@viettel.vn', createdAt: '2022-03-01' },
      { id: 'PYE-1005', name: 'Thiên Long Stationery', country: 'Hồ Chí Minh City', currency: 'VND', bank: 'ACB', account: '2046 7781 •• 5530', email: 'ban.hang@thienlong.vn', createdAt: '2023-06-20' }
    ],

    // Spend requests: advances, reimbursements and vendor payments. Amounts in VND.
    payments: [
      {
        id: 'REQ-2041', type: 'Vendor payment', requester: 'Võ Ngọc Lan', payeeId: 'PYE-1001', counterparty: 'Phương Nam Printing', country: 'Vietnam', currency: 'VND', amount: 45000000,
        purpose: 'Trade fair brochures', reference: 'Quote PN-0915, 5,000 copies', executionDate: '2026-09-18', createdAt: '2026-09-15T14:15:22',
        status: 'pending', chain: ['Team lead', 'Director'], stage: 0, policy: 'Rule 01: Large requests', approvals: [],
        activity: [
          { at: '2026-09-15T14:15:22', title: 'Request created', meta: 'Võ Ngọc Lan, Employee' },
          { at: '2026-09-15T14:15:24', title: 'Rule 01 applied', meta: 'Team lead → Director approval required' }
        ]
      },
      {
        id: 'REQ-2038', type: 'Advance', requester: 'Võ Ngọc Lan', payeeId: null, counterparty: 'Võ Ngọc Lan', country: 'Vietnam', currency: 'VND', amount: 26000000,
        purpose: 'Đà Nẵng trade fair, booth and travel', reference: 'Settle with receipts by 30 Sep', executionDate: '2026-09-16', createdAt: '2026-09-15T12:42:10',
        status: 'processing', chain: ['Team lead', 'Director'], stage: 2, policy: 'Rule 01: Large requests',
        approvals: [{ role: 'Team lead', by: 'Lê Minh Khoa', at: '2026-09-15T13:05:41' }, { role: 'Director', by: 'Trần Quốc Bảo', at: '2026-09-15T13:48:02' }],
        activity: [
          { at: '2026-09-15T12:42:10', title: 'Request created', meta: 'Võ Ngọc Lan, Employee' },
          { at: '2026-09-15T12:42:12', title: 'Rule 01 applied', meta: 'Team lead → Director approval required' },
          { at: '2026-09-15T13:05:41', title: 'Approved by Team lead', meta: 'Lê Minh Khoa' },
          { at: '2026-09-15T13:48:02', title: 'Approved by Director', meta: 'Trần Quốc Bảo' },
          { at: '2026-09-15T13:48:05', title: 'Sent to the accountant for payout', meta: 'Flux rules' }
        ]
      },
      {
        id: 'REQ-2036', type: 'Reimbursement', requester: 'Võ Ngọc Lan', payeeId: null, counterparty: 'Võ Ngọc Lan', country: 'Vietnam', currency: 'VND', amount: 1250000,
        purpose: 'Taxi and client lunch', reference: '2 receipts attached', executionDate: '2026-09-17', createdAt: '2026-09-15T10:06:33',
        status: 'pending', chain: ['Team lead'], stage: 0, policy: 'Default: team lead approval', approvals: [],
        activity: [
          { at: '2026-09-15T10:06:33', title: 'Request created', meta: 'Võ Ngọc Lan, Employee' },
          { at: '2026-09-15T10:06:35', title: 'Default applied', meta: 'Team lead approval required' }
        ]
      },
      {
        id: 'REQ-2033', type: 'Vendor payment', requester: 'Võ Ngọc Lan', payeeId: 'PYE-1002', counterparty: 'Hòa Phát Furniture', country: 'Vietnam', currency: 'VND', amount: 32400000,
        purpose: 'Twelve office chairs', reference: 'Invoice HP-2026-1144', executionDate: '2026-09-14', createdAt: '2026-09-14T16:28:00',
        status: 'completed', chain: ['Team lead', 'Director'], stage: 2, policy: 'Rule 01: Large requests',
        approvals: [{ role: 'Team lead', by: 'Lê Minh Khoa', at: '2026-09-14T16:51:12' }, { role: 'Director', by: 'Trần Quốc Bảo', at: '2026-09-14T17:20:40' }],
        activity: [
          { at: '2026-09-14T16:28:00', title: 'Request created', meta: 'Võ Ngọc Lan, Employee' },
          { at: '2026-09-14T16:51:12', title: 'Approved by Team lead', meta: 'Lê Minh Khoa' },
          { at: '2026-09-14T17:20:40', title: 'Approved by Director', meta: 'Trần Quốc Bảo' },
          { at: '2026-09-14T18:02:19', title: 'Paid out by bank transfer', meta: 'Nguyễn Thu Hà, Accountant' }
        ]
      },
      {
        id: 'REQ-2031', type: 'Vendor payment', requester: 'Võ Ngọc Lan', payeeId: 'PYE-1003', counterparty: 'Sao Mai Catering', country: 'Vietnam', currency: 'VND', amount: 6800000,
        purpose: 'Customer workshop lunch', reference: 'Order SM-0912', executionDate: '2026-09-18', createdAt: '2026-09-14T13:11:09',
        status: 'pending', chain: ['Team lead', 'Accountant'], stage: 0, policy: 'Rule 02: New vendor check', approvals: [],
        activity: [
          { at: '2026-09-14T13:11:09', title: 'Request created', meta: 'Võ Ngọc Lan, Employee' },
          { at: '2026-09-14T13:11:11', title: 'Rule 02 applied', meta: 'New vendor, Team lead → Accountant approval required' }
        ]
      },
      {
        id: 'REQ-2027', type: 'Advance', requester: 'Võ Ngọc Lan', payeeId: null, counterparty: 'Võ Ngọc Lan', country: 'Vietnam', currency: 'VND', amount: 8000000,
        purpose: 'Customer visits in Cần Thơ', reference: 'Settled 12 Sep', executionDate: '2026-09-08', createdAt: '2026-09-05T09:31:45',
        status: 'completed', chain: ['Team lead'], stage: 1, policy: 'Default: team lead approval',
        approvals: [{ role: 'Team lead', by: 'Lê Minh Khoa', at: '2026-09-05T10:02:00' }],
        activity: [
          { at: '2026-09-05T09:31:45', title: 'Request created', meta: 'Võ Ngọc Lan, Employee' },
          { at: '2026-09-05T10:02:00', title: 'Approved by Team lead', meta: 'Lê Minh Khoa' },
          { at: '2026-09-05T14:40:11', title: 'Paid out in cash', meta: 'Nguyễn Thu Hà, Accountant' }
        ]
      },
      {
        id: 'REQ-2024', type: 'Reimbursement', requester: 'Võ Ngọc Lan', payeeId: null, counterparty: 'Võ Ngọc Lan', country: 'Vietnam', currency: 'VND', amount: 640000,
        purpose: 'Printer ink', reference: 'Receipt to attach', executionDate: '2026-09-22', createdAt: '2026-09-12T08:12:00',
        status: 'draft', chain: [], stage: 0, policy: '', approvals: [],
        activity: [{ at: '2026-09-12T08:12:00', title: 'Draft saved', meta: 'Võ Ngọc Lan, Employee' }]
      }
    ],

    // Where the company's money sits: two bank accounts and the petty cash box. VND only.
    accounts: [
      { id: 'VCB', currency: 'VND', name: 'Vietcombank operating', purpose: 'Vendor payouts and payroll', available: 1284500000, reserved: 26000000, iban: '0071 0001 •• 2468', rails: 'Napas 247, interbank', settlement: 'Same business day', country: 'Hồ Chí Minh City', lastActivity: '2026-09-15T14:38:00' },
      { id: 'TCB', currency: 'VND', name: 'Techcombank collections', purpose: 'Customer receipts', available: 642300000, reserved: 0, iban: '1903 6620 •• 1155', rails: 'Napas 247', settlement: 'Same business day', country: 'Hồ Chí Minh City', lastActivity: '2026-09-15T13:12:00' },
      { id: 'CASH', currency: 'VND', name: 'Petty cash', purpose: 'Small advances and reimbursements', available: 18750000, reserved: 0, iban: 'Office safe, floor 3', rails: 'Cash', settlement: 'Counted every Friday', country: 'Head office', lastActivity: '2026-09-11T16:20:00' }
    ],

    transactions: [
      { id: 'TX-50311', accountId: 'VCB', date: '2026-09-15T14:38:00', description: 'Customer receipt', counterparty: 'Bách Hóa Xanh', direction: 'credit', amount: 186000000, status: 'posted' },
      { id: 'TX-50302', accountId: 'VCB', date: '2026-09-15T13:48:05', description: 'Reserved for REQ-2038', counterparty: 'Võ Ngọc Lan', direction: 'debit', amount: 26000000, status: 'pending' },
      { id: 'TX-50288', accountId: 'VCB', date: '2026-09-14T18:02:19', description: 'Paid REQ-2033', counterparty: 'Hòa Phát Furniture', direction: 'debit', amount: 32400000, status: 'posted' },
      { id: 'TX-50261', accountId: 'VCB', date: '2026-09-14T17:45:00', description: 'Customer receipt', counterparty: 'Co.opmart', direction: 'credit', amount: 94500000, status: 'posted' },
      { id: 'TX-50240', accountId: 'VCB', date: '2026-09-13T11:20:00', description: 'Payroll, August', counterparty: 'Minh An staff', direction: 'debit', amount: 612000000, status: 'posted' },
      { id: 'TX-50212', accountId: 'VCB', date: '2026-09-12T15:10:00', description: 'Interest', counterparty: 'Vietcombank', direction: 'credit', amount: 1284000, status: 'posted' },
      { id: 'TX-60118', accountId: 'TCB', date: '2026-09-15T13:12:00', description: 'Customer receipt', counterparty: 'Lotte Mart', direction: 'credit', amount: 72800000, status: 'posted' },
      { id: 'TX-60104', accountId: 'TCB', date: '2026-09-14T13:11:11', description: 'Customer receipt', counterparty: 'Thế Giới Di Động', direction: 'credit', amount: 128000000, status: 'posted' },
      { id: 'TX-60097', accountId: 'TCB', date: '2026-09-13T12:40:11', description: 'Transfer to Vietcombank operating', counterparty: 'Internal transfer', direction: 'debit', amount: 300000000, status: 'posted' },
      { id: 'TX-60081', accountId: 'TCB', date: '2026-09-12T10:00:00', description: 'Customer receipt', counterparty: 'Vinmart', direction: 'credit', amount: 58400000, status: 'posted' },
      { id: 'TX-60070', accountId: 'TCB', date: '2026-09-11T08:30:00', description: 'Bank fees', counterparty: 'Techcombank', direction: 'debit', amount: 220000, status: 'posted' },
      { id: 'TX-70044', accountId: 'CASH', date: '2026-09-11T16:20:00', description: 'Paid reimbursement', counterparty: 'Đặng Hoàng Huy', direction: 'debit', amount: 450000, status: 'posted' },
      { id: 'TX-70039', accountId: 'CASH', date: '2026-09-10T09:00:00', description: 'Top-up from Vietcombank operating', counterparty: 'Internal transfer', direction: 'credit', amount: 20000000, status: 'posted' },
      { id: 'TX-70021', accountId: 'CASH', date: '2026-09-05T14:40:11', description: 'Paid REQ-2027 advance', counterparty: 'Võ Ngọc Lan', direction: 'debit', amount: 8000000, status: 'posted' }
    ],

    cards: [
      { id: 'CRD-4821', holder: 'Jamie Stone', last4: '4821', type: 'Physical', status: 'Active', currency: 'USD', monthly: 4860.2, limit: 7500, department: 'Finance', program: 'Core operations', expiry: '09 / 29' },
      { id: 'CRD-1104', holder: 'Maya Chen', last4: '1104', type: 'Virtual', status: 'Active', currency: 'USD', monthly: 8210, limit: 12000, department: 'Growth', program: 'Demand generation', expiry: '03 / 28' },
      { id: 'CRD-7718', holder: 'Luca Meyer', last4: '7718', type: 'Physical', status: 'Frozen', currency: 'EUR', monthly: 1420.8, limit: 5000, department: 'Operations', program: 'EU field ops', expiry: '11 / 27' },
      { id: 'CRD-9632', holder: 'Priya Nair', last4: '9632', type: 'Virtual', status: 'Active', currency: 'USD', monthly: 11942.45, limit: 15000, department: 'Engineering', program: 'Cloud infrastructure', expiry: '06 / 28' },
      { id: 'CRD-2844', holder: 'Theo Brooks', last4: '2844', type: 'Physical', status: 'Pending', currency: 'USD', monthly: 0, limit: 3500, department: 'Sales', program: 'Client travel', expiry: '09 / 29' }
    ],

    cardPrograms: ['Core operations', 'Demand generation', 'EU field ops', 'Cloud infrastructure', 'Client travel'],

    roleTemplates: {
      Employee: ['cards-view'],
      Bookkeeper: ['accounts-view', 'payments-view', 'cards-view', 'team-view'],
      'Finance manager': ['accounts-view', 'payments-view', 'payments-create', 'payments-approve', 'cards-view', 'cards-create', 'team-view'],
      CFO: ['accounts-view', 'payments-view', 'payments-create', 'payments-approve', 'payments-admin', 'cards-view', 'cards-create', 'cards-admin', 'team-view', 'team-admin'],
      Admin: ['accounts-view', 'accounts-admin', 'payments-view', 'cards-view', 'cards-admin', 'team-view', 'team-create', 'team-admin']
    },

    members: [
      { id: 'MEM-01', name: 'Alex Smith', email: 'alex.smith@northstar.co', role: 'Finance manager', team: 'Finance', region: 'EU', status: 'Active', lastSeen: '2026-09-15T14:58:00' },
      { id: 'MEM-02', name: 'Sarah Jensen', email: 'sarah.jensen@northstar.co', role: 'CFO', team: 'Executive', region: 'Global', status: 'Active', lastSeen: '2026-09-15T14:41:00' },
      { id: 'MEM-03', name: 'Priya Nair', email: 'priya.nair@northstar.co', role: 'Employee', team: 'Engineering', region: 'US', status: 'Active', lastSeen: '2026-09-15T13:36:00' },
      { id: 'MEM-04', name: 'Mateo Ruiz', email: 'mateo.ruiz@northstar.co', role: 'Bookkeeper', team: 'Accounting', region: 'EU', status: 'Active', lastSeen: '2026-09-15T11:22:00' },
      { id: 'MEM-05', name: 'Theo Brooks', email: 'theo.brooks@northstar.co', role: 'Employee', team: 'Sales', region: 'UK', status: 'Invited', lastSeen: null, invitedAt: '2026-09-15T09:10:00' }
    ],

    // Receipts that settle an advance, or that an employee paid out of pocket. VND only.
    expenses: [
      { id: 'EXP-44182', merchant: 'Mường Thanh Đà Nẵng', detail: 'Hotel, 2 nights', owner: 'Võ Ngọc Lan', category: 'Travel', currency: 'VND', amount: 3200000, date: '2026-09-14', card: 'Advance REQ-2038', receipt: 'muongthanh-folio.pdf', status: 'review', note: '' },
      { id: 'EXP-44169', merchant: 'Grab', detail: 'Rides to the fair venue', owner: 'Võ Ngọc Lan', category: 'Transport', currency: 'VND', amount: 486000, date: '2026-09-14', card: 'Advance REQ-2038', receipt: '', status: 'missing', note: '' },
      { id: 'EXP-44131', merchant: 'Thiên Long Stationery', detail: 'Printer paper', owner: 'Đặng Hoàng Huy', category: 'Office supplies', currency: 'VND', amount: 640000, date: '2026-09-13', card: 'Out of pocket', receipt: 'thienlong-hd-0913.pdf', status: 'approved', note: '' },
      { id: 'EXP-44098', merchant: 'Vietnam Airlines', detail: 'Flights to Đà Nẵng', owner: 'Võ Ngọc Lan', category: 'Travel', currency: 'VND', amount: 6850000, date: '2026-09-13', card: 'Advance REQ-2038', receipt: 'vna-eticket-597.png', status: 'review', note: '' },
      { id: 'EXP-44061', merchant: 'Highlands Coffee', detail: 'Client meeting', owner: 'Lê Minh Khoa', category: 'Meals with clients', currency: 'VND', amount: 420000, date: '2026-09-12', card: 'Out of pocket', receipt: 'highlands-0912.jpg', status: 'approved', note: '' }
    ],

    expenseCategories: ['Travel', 'Transport', 'Meals with clients', 'Office supplies', 'Marketing', 'Equipment'],

    policies: [
      { id: 'POL-01', name: 'Large requests', scope: 'All requests', status: 'Active', conditions: [{ field: 'amount', op: '>', value: 'VND 20,000,000' }], approvers: ['Team lead', 'Director'] },
      { id: 'POL-02', name: 'New vendor check', scope: 'Vendor payments', status: 'Active', conditions: [{ field: 'beneficiary_age_days', op: '<', value: '30' }], approvers: ['Team lead', 'Accountant'] },
      { id: 'POL-03', name: 'Advances above 10 million', scope: 'Advances', status: 'Active', conditions: [{ field: 'amount', op: '>', value: 'VND 10,000,000' }], approvers: ['Team lead', 'Accountant'] },
      { id: 'POL-04', name: 'Weekend submission hold', scope: 'All requests', status: 'Inactive', conditions: [{ field: 'created_outside_hours', op: '=', value: 'true' }], approvers: ['Director'] }
    ],

    policyHistory: [
      { at: '2026-09-12T17:42:00', by: 'Trần Quốc Bảo', action: 'Rule 04 set to Inactive' },
      { at: '2026-09-02T10:15:00', by: 'Trần Quốc Bảo', action: 'Rule 01 threshold changed to VND 20,000,000' }
    ],

    reportSchedule: null
  };

  // Deterministic operating-spend ledger for Reports (1 Jan to 15 Sep 2026).
  // Generated, not stored, so the session copy stays small.
  function generateLedger() {
    let s = 20260915;
    const rand = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const categories = [
      { name: 'Cloud infrastructure', weight: 28, currency: ['USD', 'EUR'], source: 'card', base: 1900 },
      { name: 'Manufacturing services', weight: 22, currency: ['JPY'], source: 'payment', base: 4600 },
      { name: 'Freight & logistics', weight: 16, currency: ['EUR'], source: 'payment', base: 3100 },
      { name: 'Travel', weight: 10, currency: ['USD', 'EUR', 'GBP'], source: 'expense', base: 520 },
      { name: 'Software', weight: 9, currency: ['USD'], source: 'card', base: 640 },
      { name: 'Professional services', weight: 15, currency: ['GBP', 'USD', 'SGD'], source: 'payment', base: 2800 }
    ];
    const total = categories.reduce((sum, c) => sum + c.weight, 0);
    const rows = [];
    const start = new Date('2026-01-01T00:00:00');
    const end = new Date('2026-09-15T00:00:00');
    let n = 1;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const count = day === 0 || day === 6 ? 1 : 3 + Math.floor(rand() * 3);
      const trend = 0.82 + ((d - start) / (end - start)) * 0.38;
      for (let i = 0; i < count; i += 1) {
        let pick = rand() * total;
        const cat = categories.find((c) => (pick -= c.weight) < 0) || categories[0];
        const currency = cat.currency[Math.floor(rand() * cat.currency.length)];
        const usd = Math.round(cat.base * trend * (0.45 + rand() * 1.4) * 100) / 100;
        rows.push({
          id: `LGR-${String(n).padStart(5, '0')}`,
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          category: cat.name,
          currency,
          source: cat.source,
          amountUsd: usd,
          fxCostUsd: currency === 'USD' ? 0 : Math.round(usd * 0.0099 * 100) / 100,
          exception: rand() < 0.018
        });
        n += 1;
      }
    }
    return rows;
  }

  window.FLUX_SEED = seed;
  window.FLUX_LEDGER = generateLedger;
})();
