const API_BASE = 'http://localhost:5000/api';

async function testDuplicatePrevention() {
  console.log('===========================================================');
  console.log('  Testing Emergency Duplicate Prevention (Idempotency)    ');
  console.log('===========================================================\n');

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
    const testEmergencyId = `TEST-SOS-${Date.now()}`;

    // Step 1: Trigger Emergency Call 1 for EC-002
    console.log('--- Step 1: First Emergency Trigger ---');
    const res1 = await fetch(`${API_BASE}/emergency/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emergencyId: testEmergencyId,
        residentId: 'EC-002',
        residentName: 'Meenakshi Raman',
        emergencyType: 'Fall / Suspected fracture',
        notes: 'Resident slipped in corridor, suspected wrist fracture.',
        severity: 'HIGH',
        senderRole: 'patient'
      })
    });
    const data1 = await res1.json();
    assert(res1.status === 201 || res1.status === 200, 'First trigger responds with success status');
    assert(data1.data?.appointment !== undefined, 'Specialist appointment created or returned');
    const firstApptId = data1.data?.appointmentId || data1.data?.appointment?.id;
    console.log(`  First appointment ID: ${firstApptId}`);

    // Step 2: Trigger Repeated Emergency Call with same emergencyId (Simulating rapid double-click or network retry)
    console.log('\n--- Step 2: Repeated Trigger with Same emergencyId ---');
    const res2 = await fetch(`${API_BASE}/emergency/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emergencyId: testEmergencyId,
        residentId: 'EC-002',
        residentName: 'Meenakshi Raman',
        emergencyType: 'Fall / Suspected fracture',
        notes: 'Resident slipped in corridor, suspected wrist fracture.',
        severity: 'HIGH',
        senderRole: 'patient'
      })
    });
    const data2 = await res2.json();
    assert(res2.status === 200, 'Repeated trigger returns HTTP 200 (reused existing)');
    assert(data2.isDuplicate === true, 'Response flags isDuplicate: true');
    const secondApptId = data2.data?.appointmentId || data2.data?.appointment?.id;
    assert(secondApptId === firstApptId, `Reuses identical appointment ID (got ${secondApptId}, expected ${firstApptId})`);

    // Step 3: Check Appointments Endpoint does not have duplicates
    console.log('\n--- Step 3: Verify Appointments Endpoint for EC-002 ---');
    const apptsRes = await fetch(`${API_BASE}/appointments?patientId=EC-002`);
    const apptsData = await apptsRes.json();
    assert(apptsRes.status === 200, 'Appointments query returns HTTP 200');
    
    const matchingAppts = apptsData.data.filter(a => a.emergencyId === testEmergencyId);
    assert(matchingAppts.length === 1, `Exactly ONE appointment exists for emergencyId ${testEmergencyId} (found ${matchingAppts.length})`);

    // Step 4: Verify Total Orthopedics Emergency Appointments for Meenakshi is exactly 1
    const orthoAppts = apptsData.data.filter(a => a.emergencyId === testEmergencyId || (a.type?.includes('Orthopedics') && a.emergencyId));
    assert(orthoAppts.length === 1, `Total Orthopedics emergency referral appointments for Meenakshi is exactly 1 (found ${orthoAppts.length})`);

    // Cleanup test record
    const { query } = await import('../config/db.js');
    await query('DELETE FROM appointments WHERE emergencyId = ?', [testEmergencyId]);
    await query('DELETE FROM emergency_alerts WHERE id = ?', [testEmergencyId]);
    await query('DELETE FROM notifications WHERE emergencyId = ?', [testEmergencyId]);
    console.log('\n  ✓ Test records cleaned up.');

  } catch (err) {
    console.error('Test failed with error:', err);
    failed++;
  }

  console.log('\n===========================================================');
  console.log(`  Summary: ${passed} Passed, ${failed} Failed`);
  console.log('===========================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

testDuplicatePrevention();
