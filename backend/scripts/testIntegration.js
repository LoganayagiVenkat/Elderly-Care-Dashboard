// Automated Integration Test Suite for ElderCare Modules
// Care Records, Medications, Emergency -> Specialist Auto-Scheduling, and Role Scoping

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('  ElderCare Comprehensive System Integration Tests  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Health check & MySQL connection
    console.log('--- Test Group 1: Database & Health Check ---');
    const healthRes = await fetch(`${API_BASE}/health-check`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health check returns HTTP 200');
    assert(healthData.status === 'connected' || healthData.database === 'connected', 'Database reports connected status');
    assert(healthData.mode === 'mysql' || healthData.database === 'connected', `Database engine is MySQL (mode: ${healthData.mode}, db: ${healthData.database})`);

    // Test 2: Complete Care History for Anitha Sundaram (EC-005)
    console.log('\n--- Test Group 2: Complete Care History ---');
    const asCareRes = await fetch(`${API_BASE}/health/records/EC-005`);
    const asCareData = await asCareRes.json();
    assert(asCareRes.status === 200, 'Care records for EC-005 returns HTTP 200');
    assert(asCareData.success === true, 'Care records query succeeds');
    assert(Array.isArray(asCareData.history), 'Care records history is an array');
    assert(asCareData.history.length >= 5, `EC-005 has complete historical records (${asCareData.history.length} records found)`);
    assert(asCareData.summary && asCareData.summary.blood_pressure && asCareData.summary.blood_pressure.includes('/'), `Latest summary BP is present and valid (got ${asCareData.summary?.blood_pressure})`);
    
    // Test 3: Empty State for EC-007
    console.log('\n--- Test Group 3: Empty State Verification ---');
    const emptyCareRes = await fetch(`${API_BASE}/health/records/EC-007`);
    const emptyCareData = await emptyCareRes.json();
    assert(emptyCareData.history.length === 0, `EC-007 has 0 records for empty state demonstration (${emptyCareData.history.length})`);

    // Test 4: Prescribed Medications for Anitha Sundaram (EC-005)
    console.log('\n--- Test Group 4: Multi-Medications Module ---');
    const asMedsRes = await fetch(`${API_BASE}/medications?patientId=EC-005`);
    const asMedsData = await asMedsRes.json();
    assert(asMedsRes.status === 200, 'Medications for EC-005 returns HTTP 200');
    assert(Array.isArray(asMedsData.data), 'Medications data is an array');
    assert(asMedsData.data.length >= 4, `EC-005 has all 4 prescribed medications (found ${asMedsData.data.length})`);
    
    const medNames = asMedsData.data.map(m => m.medicine.toLowerCase());
    assert(medNames.includes('amlodipine'), 'Contains prescribed Amlodipine');
    assert(medNames.includes('metformin'), 'Contains prescribed Metformin');
    assert(medNames.includes('vitamin d'), 'Contains prescribed Vitamin D');
    assert(medNames.includes('donepezil'), 'Contains prescribed Donepezil');

    // Test 5: Mark as Taken in Database
    console.log('\n--- Test Group 5: Medication Status Persistence ---');
    const pendingMed = asMedsData.data.find(m => m.status === 'pending') || asMedsData.data[0];
    const updateRes = await fetch(`${API_BASE}/medications/${pendingMed.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Mark medication status returns HTTP 200');
    assert(updateData.data.status === 'completed', `Medication status updated to completed (got ${updateData.data.status})`);

    // Test 6: Issue-to-Specialist Mappings & Directory
    console.log('\n--- Test Group 6: Emergency Specialist Mappings ---');
    const mappingsRes = await fetch(`${API_BASE}/emergency/mappings`);
    const mappingsData = await mappingsRes.json();
    assert(mappingsRes.status === 200, 'Issue mappings returns HTTP 200');
    assert(Array.isArray(mappingsData.data) && mappingsData.data.length > 0, 'Mappings array populated from MySQL');
    const skinMap = mappingsData.data.find(m => m.issue_type.toLowerCase().includes('skin'));
    assert(skinMap && skinMap.specialty === 'Dermatology', `Skin disease maps to Dermatology (got ${skinMap?.specialty})`);

    const specsRes = await fetch(`${API_BASE}/emergency/specialists`);
    const specsData = await specsRes.json();
    assert(specsRes.status === 200, 'Specialists directory returns HTTP 200');
    assert(specsData.data.some(s => s.specialty === 'Dermatology'), 'Dermatology specialist exists in directory');

    // Test 7: Emergency SOS Trigger -> Automatic Specialist Appointment
    console.log('\n--- Test Group 7: Emergency SOS & Auto-Appointment Scheduling ---');
    const triggerRes = await fetch(`${API_BASE}/emergency/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        residentId: 'EC-005',
        residentName: 'Anitha Sundaram',
        emergencyType: 'Skin disease',
        notes: 'Resident developed acute rash and irritation on arms.',
        severity: 'HIGH',
        senderRole: 'patient'
      })
    });
    const triggerData = await triggerRes.json();
    assert(triggerRes.status === 201 || triggerRes.status === 200, 'Emergency trigger returns HTTP 201 Created or 200 OK (reused)');
    assert(triggerData.success === true, 'Emergency trigger succeeded');
    assert(triggerData.data.specialty === 'Dermatology', `Issue auto-mapped to Dermatology (got ${triggerData.data.specialty})`);
    assert(triggerData.data.appointment !== undefined, 'Auto-scheduled appointment created in database');
    assert(triggerData.data.appointment.doctorId !== undefined, `Specialist assigned: ${triggerData.data.appointment.doctor}`);
    assert(triggerData.data.appointment.emergencyId === triggerData.data.alert.id, `Appointment linked to Emergency ID: ${triggerData.data.appointment.emergencyId}`);

    // Test 8: Verify appointment appears in Appointments API (Exactly ONCE)
    console.log('\n--- Test Group 8: Appointment Visibility & Deduplication ---');
    const apptsRes = await fetch(`${API_BASE}/appointments?patientId=EC-005`);
    const apptsData = await apptsRes.json();
    const emergencyAppts = apptsData.data.filter(a => a.emergencyId === triggerData.data.alert.id || (a.specialty === 'Dermatology' && a.emergencyId));
    assert(emergencyAppts.length === 1, `Exactly ONE emergency appointment exists for Anitha Sundaram (found ${emergencyAppts.length})`);
    assert(emergencyAppts[0]?.specialty === 'Dermatology', `Appointment specialty is Dermatology (got ${emergencyAppts[0]?.specialty})`);

    // Test 9: Verify Notification Scoping in Database
    console.log('\n--- Test Group 9: Role Scoping & Notifications ---');
    const notifsRes = await fetch(`${API_BASE}/notifications`);
    const notifsData = await notifsRes.json();
    const sosNotif = notifsData.data.find(n => n.emergencyId === triggerData.data.alert.id);
    assert(sosNotif !== undefined, 'Emergency SOS notification exists in database');
    assert(sosNotif?.residentId === 'EC-005', `Notification scoped to residentId EC-005 (got ${sosNotif?.residentId})`);
    assert(triggerData.data.assignedCaregiver === 'Deepa Suresh', `Resident EC-005 assigned caregiver is Deepa Suresh (got ${triggerData.data.assignedCaregiver})`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();
