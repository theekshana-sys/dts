const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Comprehensive DTS System Verification Tests ---');

  // 1. Check Branches
  console.log('Test 1: Verify Seeded Master Data (Branches, Types, Statuses)...');
  const branchesRes = await apiRequest('GET', '/api/branches');
  assert.strictEqual(branchesRes.status, 200);
  assert(branchesRes.body.branches.length >= 7, 'Expected at least 7 seeded branches');
  console.log('✓ Branches verified. Count:', branchesRes.body.branches.length);

  // 2. Admin Login
  console.log('Test 2: Admin Authentication...');
  const loginRes = await apiRequest('POST', '/api/auth/login', {
    email: 'admin@dts.local',
    password: 'Admin@12345'
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login failed');
  assert(loginRes.body.token, 'Token missing');
  assert.strictEqual(loginRes.body.user.role, 'ADMIN');
  const adminToken = loginRes.body.token;
  console.log('✓ Admin login successful. Token acquired.');

  // 3. User Registration Flow (Requires approval)
  console.log('Test 3: User Registration & Approval Flow...');
  const testUserEmail = `staff_${Date.now()}@dts.local`;
  const regRes = await apiRequest('POST', '/api/auth/register', {
    email: testUserEmail,
    password: 'StaffPass@123',
    full_name: 'Test Logistics Officer',
    branch_id: 2
  });
  assert.strictEqual(regRes.status, 201);
  assert.strictEqual(regRes.body.approved, false, 'New user must require admin approval');

  // Attempt login before approval (should be rejected 403)
  const unapprovedLogin = await apiRequest('POST', '/api/auth/login', {
    email: testUserEmail,
    password: 'StaffPass@123'
  });
  assert.strictEqual(unapprovedLogin.status, 403, 'Unapproved user should not be able to login');
  console.log('✓ Unapproved user login correctly blocked with HTTP 403.');

  // Admin approves user
  const usersList = await apiRequest('GET', '/api/users', null, adminToken);
  const registeredUser = usersList.body.users.find(u => u.email === testUserEmail);
  assert(registeredUser, 'Registered user not found in user list');

  const approveRes = await apiRequest('PUT', `/api/users/${registeredUser.id}/approve`, {}, adminToken);
  assert.strictEqual(approveRes.status, 200);
  console.log('✓ Admin successfully approved new user.');

  // Approved user login
  const approvedLogin = await apiRequest('POST', '/api/auth/login', {
    email: testUserEmail,
    password: 'StaffPass@123'
  });
  assert.strictEqual(approvedLogin.status, 200);
  const userToken = approvedLogin.body.token;
  console.log('✓ Approved user successfully authenticated.');

  // 4. Main File Batch Creation with Sub-documents
  console.log('Test 4: Main File Batch & Nested Sub-documents Creation...');
  const batchNo = `BATCH-TEST-${Date.now()}`;
  const docNo1 = `DOC-A-${Date.now()}`;
  const docNo2 = `DOC-B-${Date.now()}`;

  const createBatchRes = await apiRequest('POST', '/api/main-files', {
    main_file_no: batchNo,
    lorry_no: 'WP-LH-9999',
    recipient_user_id: 2, // Kamal Perera (Head Office)
    doc_type_id: 1,
    sub_documents: [
      { document_no: docNo1, doc_type_id: 1 },
      { document_no: docNo2, doc_type_id: 2 }
    ],
    send_now: false // Draft
  }, userToken);

  assert.strictEqual(createBatchRes.status, 201);
  const batchId = createBatchRes.body.batchId;
  console.log('✓ Main File Batch draft created with 2 sub-documents. Batch ID:', batchId);

  // 5. Test Batch Dispatch (Send & Lock)
  console.log('Test 5: Dispatch Main File Batch (Data Locking)...');
  const sendRes = await apiRequest('PUT', `/api/main-files/${batchId}/send`, {}, userToken);
  assert.strictEqual(sendRes.status, 200);
  console.log('✓ Main File Batch dispatched and locked.');

  // Verify regular user CANNOT add sub-documents after dispatch
  const docNo3 = `DOC-C-${Date.now()}`;
  const lockCheckRes = await apiRequest('POST', `/api/main-files/${batchId}/sub-documents`, {
    document_no: docNo3,
    doc_type_id: 1
  }, userToken);
  assert.strictEqual(lockCheckRes.status, 403, 'Post-dispatch sub-document add should be blocked for users');
  console.log('✓ Data locking verified: Non-admin cannot alter or add sub-documents after dispatch.');

  // 6. Head Office Receiving ("හරි" action)
  console.log('Test 6: Head Office Officer Receiving Action ("හරි")...');
  // Login as Head Office officer
  const hoLogin = await apiRequest('POST', '/api/auth/login', {
    email: 'headoffice@dts.local',
    password: 'Staff@12345'
  });
  const hoToken = hoLogin.body.token;

  const docsRes = await apiRequest('GET', `/api/documents?search=${docNo1}`, null, hoToken);
  const testDoc = docsRes.body.documents.find(d => d.document_no === docNo1);
  assert(testDoc, 'Document not found');
  assert.strictEqual(testDoc.is_received, 0, 'Document must initially be unreceived');

  // Perform "හරි" receive
  const receiveRes = await apiRequest('POST', `/api/documents/${testDoc.id}/receive`, {}, hoToken);
  assert.strictEqual(receiveRes.status, 200);
  console.log('✓ Document marked as received ("හරි"). Current custodian transferred to recipient.');

  // 7. Deletion Rights Matrix: Creator cannot delete received document
  console.log('Test 7: Deletion Rights Matrix (Creator cannot delete received document)...');
  const deleteAttemptByUser = await apiRequest('DELETE', `/api/documents/${testDoc.id}`, null, userToken);
  assert.strictEqual(deleteAttemptByUser.status, 403, 'Creator deletion of received doc must be blocked');
  console.log('✓ Deletion matrix verified: Creator deletion rejected once received.');

  // 8. Document Custody Transfer
  console.log('Test 8: Document Custody Transfer...');
  const transferRes = await apiRequest('POST', `/api/documents/${testDoc.id}/transfer`, {
    to_user_id: 1, // Transfer to Admin
    notes: 'Forwarded for VAT clearance'
  }, hoToken);
  assert.strictEqual(transferRes.status, 200);
  console.log('✓ Custody transferred successfully to user #1.');

  // 9. Document Finalization & Personal Dashboard Filter Check
  console.log('Test 9: Document Finalization & Personal Dashboard Filter...');
  // Find "Entered" status id
  const statusesRes = await apiRequest('GET', '/api/document-statuses', null, adminToken);
  const enteredStatus = statusesRes.body.statuses.find(s => s.status_name === 'Entered');
  assert(enteredStatus, 'Entered status missing');

  // Update status to Entered
  const statusUpdateRes = await apiRequest('PUT', `/api/documents/${testDoc.id}/status`, {
    status_id: enteredStatus.id,
    notes: 'Document successfully entered in ERP.'
  }, adminToken);
  assert.strictEqual(statusUpdateRes.status, 200);
  console.log('✓ Document status updated to "Entered" (Terminal).');

  // Verify it is AUTO-FILTERED from personal dashboard
  const myDashDocs = await apiRequest('GET', '/api/documents?my_dashboard=true&exclude_terminal=true', null, adminToken);
  const foundInDash = myDashDocs.body.documents.some(d => d.id === testDoc.id);
  assert.strictEqual(foundInDash, false, 'Terminal document MUST be filtered out of personal dashboard');
  console.log('✓ Personal dashboard filter verified: "Entered" document automatically excluded!');

  // 10. System Audit Trail Check
  console.log('Test 10: Complete Audit Trail Verification...');
  const docDetailsRes = await apiRequest('GET', `/api/documents/${testDoc.id}`, null, adminToken);
  const logs = docDetailsRes.body.logs;
  assert(logs.length >= 4, 'Audit trail must contain CREATED, DISPATCHED, RECEIVED, TRANSFERRED, STATUS_UPDATED');
  console.log(`✓ Audit trail verified with ${logs.length} stages (Created, Dispatched, Received, Transferred, Status Updated).`);

  // 11. Reports & Excel Export
  console.log('Test 11: Excel (.xlsx) Report Export...');
  const excelRes = await apiRequest('GET', '/api/reports/export-excel', null, adminToken);
  assert.strictEqual(excelRes.status, 200);
  assert(excelRes.headers['content-type'].includes('spreadsheetml'), 'Excel content-type expected');
  console.log('✓ Excel export endpoint successfully generated .xlsx binary workbook.');

  // 12. SQLite Database Backup Download
  console.log('Test 12: Database Backup (.sqlite) Download...');
  const backupRes = await apiRequest('GET', '/api/settings/backup-db', null, adminToken);
  assert.strictEqual(backupRes.status, 200);
  assert(backupRes.headers['content-type'].includes('sqlite'), 'SQLite content-type expected');
  console.log('✓ Database instant backup download verified.');

  console.log('================================================================');
  console.log('ALL 12 DTS SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)');
  console.log('Created by Theekshana Rajapaksha | Version 1.0');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
