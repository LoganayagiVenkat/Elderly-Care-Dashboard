import { query, testConnection } from '../config/db.js';

async function runTests() {
  console.log('====================================================');
  console.log('      CARE DEPENDENCY MAP COMPREHENSIVE TEST        ');
  console.log('====================================================\n');

  await testConnection();
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // TEST 1: Database Columns Existence
  console.log('--- Test Suite 1: Database Schema & Columns ---');
  const apptCols = await query('SHOW COLUMNS FROM appointments');
  const apptColNames = apptCols.map((c) => c.Field);
  assert(apptColNames.includes('emergencyId'), 'appointments table has emergencyId column');
  assert(apptColNames.includes('doctorId'), 'appointments table has doctorId column');
  assert(apptColNames.includes('followup_required'), 'appointments table has followup_required column');
  assert(apptColNames.includes('followup_status'), 'appointments table has followup_status column');
  assert(apptColNames.includes('followup_notes'), 'appointments table has followup_notes column');

  const emgCols = await query('SHOW COLUMNS FROM emergency_alerts');
  const emgColNames = emgCols.map((c) => c.Field);
  assert(emgColNames.includes('care_record_id'), 'emergency_alerts table has care_record_id column');
  assert(emgColNames.includes('appointmentId'), 'emergency_alerts table has appointmentId column');
  assert(emgColNames.includes('specialty'), 'emergency_alerts table has specialty column');

  // TEST 2: Anitha Sundaram (EC-005) Dependency Chain
  console.log('\n--- Test Suite 2: Anitha Sundaram (EC-005) Chain Generation ---');
  const res = await fetch('http://localhost:5001/api/care-dependency-map/EC-005', {
    headers: { 'x-user-role': 'admin' }
  });
  const json = await res.json();
  assert(res.status === 200, 'GET /api/care-dependency-map/EC-005 returned HTTP 200');
  assert(json.success === true, 'Response payload has success: true');
  assert(json.data.resident.name === 'Anitha Sundaram', 'Resident name is Anitha Sundaram');
  assert(json.data.chains.emergency.length >= 1, 'At least 1 Emergency Care Chain generated');

  const emgChain = json.data.chains.emergency[0];
  const nodeTypes = emgChain.nodes.map((n) => n.type);
  console.log('Generated node types in Anitha Sundaram chain:', nodeTypes);

  assert(nodeTypes.includes('resident'), 'Chain contains Resident root node');
  assert(nodeTypes.includes('care_record'), 'Chain contains Care Record observation node');
  assert(nodeTypes.includes('emergency'), 'Chain contains Emergency node');
  assert(nodeTypes.includes('specialty'), 'Chain contains Required Specialty node');
  assert(nodeTypes.includes('specialist'), 'Chain contains Specialist node');
  assert(nodeTypes.includes('availability'), 'Chain contains Specialist Availability node');
  assert(nodeTypes.includes('appointment'), 'Chain contains Confirmed Appointment node');
  assert(nodeTypes.includes('followup'), 'Chain contains Follow-up node');

  // Verify Specialist is Dr. Suresh Rao & Specialty is Dermatology
  const specNode = emgChain.nodes.find((n) => n.type === 'specialist');
  assert(specNode && specNode.title.includes('Suresh Rao'), 'Specialist is Dr. Suresh Rao');

  const specialtyNode = emgChain.nodes.find((n) => n.type === 'specialty');
  assert(specialtyNode && specialtyNode.title.includes('Dermatology'), 'Specialty is Dermatology');

  // Verify Follow-up is Required / Pending
  const followupNode = emgChain.nodes.find((n) => n.type === 'followup');
  assert(followupNode && followupNode.details['Follow-up Requirement'] === 'Required', 'Follow-up is Required');
  assert(followupNode && followupNode.details['Current Status'] === 'Pending', 'Follow-up status is Pending');

  // TEST 3: Sangeetha (EC-007) Empty Emergency Chains Verification
  console.log('\n--- Test Suite 3: Empty State Handling (EC-007 Sangeetha) ---');
  const resEmpty = await fetch('http://localhost:5001/api/care-dependency-map/EC-007', {
    headers: { 'x-user-role': 'admin' }
  });
  const jsonEmpty = await resEmpty.json();
  assert(resEmpty.status === 200, 'GET /api/care-dependency-map/EC-007 returned HTTP 200');
  assert(jsonEmpty.data.chains.emergency.length === 0, 'EC-007 has 0 emergency chains (triggers empty state for emergency referrals)');
  assert(jsonEmpty.data.chains.routine.length === 0, 'EC-007 has 0 routine appointment chains');
  assert(jsonEmpty.data.chains.carePlans.length === 0, 'EC-007 has 0 care plan chains');

  // TEST 4: Role-Based Access Control (RBAC)
  console.log('\n--- Test Suite 4: Role-Based Access Control Enforcement ---');
  // Admin accessing EC-005: 200
  const rAdmin = await fetch('http://localhost:5001/api/care-dependency-map/EC-005', {
    headers: { 'x-user-role': 'admin' }
  });
  assert(rAdmin.status === 200, 'Admin can view any resident (HTTP 200)');

  // Caregiver Deepa Suresh (assigned to EC-005): 200
  const rCgAllowed = await fetch('http://localhost:5001/api/care-dependency-map/EC-005', {
    headers: { 'x-user-role': 'caregiver', 'x-user-caregiver-name': 'Deepa Suresh' }
  });
  assert(rCgAllowed.status === 200, 'Assigned Caregiver can view resident (HTTP 200)');

  // Caregiver Anand Raj (NOT assigned to EC-005): 403
  const rCgForbidden = await fetch('http://localhost:5001/api/care-dependency-map/EC-005', {
    headers: { 'x-user-role': 'caregiver', 'x-user-caregiver-name': 'Anand Raj' }
  });
  assert(rCgForbidden.status === 403, 'Unassigned Caregiver is rejected (HTTP 403 Forbidden)');

  // Family member tied to EC-001 attempting to view EC-005: 403
  const rFamForbidden = await fetch('http://localhost:5001/api/care-dependency-map/EC-005', {
    headers: { 'x-user-role': 'family', 'x-user-resident-id': 'EC-001' }
  });
  assert(rFamForbidden.status === 403, 'Family cannot view another resident (HTTP 403 Forbidden)');

  // Family member tied to EC-005 viewing EC-005: 200
  const rFamAllowed = await fetch('http://localhost:5001/api/care-dependency-map/EC-005', {
    headers: { 'x-user-role': 'family', 'x-user-resident-id': 'EC-005' }
  });
  assert(rFamAllowed.status === 200, 'Family can view their assigned resident (HTTP 200)');

  // Patient tied to EC-001 attempting to view EC-005: 403
  const rPatForbidden = await fetch('http://localhost:5001/api/care-dependency-map/EC-005', {
    headers: { 'x-user-role': 'patient', 'x-user-resident-id': 'EC-001' }
  });
  assert(rPatForbidden.status === 403, 'Patient cannot view another resident (HTTP 403 Forbidden)');

  // Patient tied to EC-005 viewing EC-005: 200
  const rPatAllowed = await fetch('http://localhost:5001/api/care-dependency-map/EC-005', {
    headers: { 'x-user-role': 'patient', 'x-user-resident-id': 'EC-005' }
  });
  assert(rPatAllowed.status === 200, 'Patient can view their own resident map (HTTP 200)');

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);
  console.log('====================================================');

  if (passedCount === totalCount) {
    console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  }
}

runTests()
  .then(async () => {
    await new Promise((r) => setTimeout(r, 200));
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Test Error]', err);
    process.exit(1);
  });
