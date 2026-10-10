import mysql from 'mysql2/promise';

async function runTests() {
  console.log('=====================================================');
  console.log('   ElderCare Care Records - Automated Verification   ');
  console.log('=====================================================');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Verify MySQL Connection Status
  const healthRes = await fetch(`${BASE_URL}/health-check`).then(r => r.json());
  console.log('\n[TEST 1] Backend Health Check:');
  console.log('  Database Status:', healthRes.database);
  console.log('  Mode:', healthRes.mode);
  if (healthRes.database !== 'connected') {
    throw new Error('Database is not connected to MySQL!');
  }
  console.log('  PASS: MySQL is connected.');

  // 2. Test Anitha Sundaram (EC-005) History
  console.log('\n[TEST 2] Fetch Anitha Sundaram (EC-005) Care Records:');
  const anithaRes = await fetch(`${BASE_URL}/health/records/EC-005`).then(r => r.json());
  console.log('  Count:', anithaRes.count);
  console.log('  Latest Record:');
  console.log('    Date:', anithaRes.latest?.date);
  console.log('    BP:', anithaRes.latest?.bp);
  console.log('    Temp:', anithaRes.latest?.temp);
  console.log('    Weight:', anithaRes.latest?.weight);
  console.log('    Observation:', anithaRes.latest?.observation);
  console.log('    Recorded By:', anithaRes.latest?.recordedBy);
  
  if (!anithaRes.success || anithaRes.count < 5) {
    throw new Error(`Expected at least 5 records for EC-005, got ${anithaRes.count}`);
  }
  console.log('  Historical entries count:', anithaRes.history.length);
  anithaRes.history.forEach((h, i) => {
    console.log(`    [${i + 1}] ${h.date} | BP: ${h.bp} | Temp: ${h.temp} | Wt: ${h.weight} | Obs: ${h.observation} | By: ${h.recordedBy}`);
  });
  console.log('  PASS: Complete history retrieved with all required fields.');

  // 3. Test Search Across Complete History
  console.log('\n[TEST 3] Search Across Complete History:');
  // 3a. Search "Deepa"
  const searchDeepa = await fetch(`${BASE_URL}/health/records?search=Deepa`).then(r => r.json());
  console.log('  Search "Deepa" results count:', searchDeepa.count);
  if (!searchDeepa.success || searchDeepa.count === 0) {
    throw new Error('Search for "Deepa" returned 0 results');
  }
  console.log('  PASS: Search "Deepa" matches records across residents.');

  // 3b. Search "04 Sep 2026"
  const searchDate = await fetch(`${BASE_URL}/health/records?search=04%20Sep%202026`).then(r => r.json());
  console.log('  Search "04 Sep 2026" results count:', searchDate.count);
  if (!searchDate.success || searchDate.count === 0) {
    throw new Error('Search for "04 Sep 2026" returned 0 results');
  }
  console.log('  PASS: Search "04 Sep 2026" correctly locates specific date record.');

  // 4. Test Empty State for Sangeetha (EC-007)
  console.log('\n[TEST 4] Empty State Verification (EC-007):');
  const emptyRes = await fetch(`${BASE_URL}/health/records/EC-007`).then(r => r.json());
  console.log('  EC-007 records count:', emptyRes.count);
  console.log('  Latest:', emptyRes.latest);
  if (emptyRes.count !== 0 || emptyRes.history.length !== 0) {
    throw new Error(`Expected 0 records for EC-007, got ${emptyRes.count}`);
  }
  console.log('  PASS: Empty resident returns 0 records without fake data.');

  // 5. Add New Record and Verify Zero-Overwrite & Persistence
  console.log('\n[TEST 5] Add New Care Record (Zero-Overwrite Test):');
  const initialCount = anithaRes.count;
  const newPostData = {
    residentId: 'EC-005',
    date: '19 Sep 2026',
    time: '04:15 PM',
    bp: '121/79',
    temp: '98.3°F',
    weight: '60 kg',
    observation: 'Stable',
    notes: 'Afternoon round checkup. Resident in good spirits, vitals within normal parameters.',
    recordedBy: 'Deepa Suresh',
    recordType: 'Routine Round'
  };

  const createRes = await fetch(`${BASE_URL}/health/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPostData)
  }).then(r => r.json());

  console.log('  Create Response:', createRes.message);
  console.log('  Created Record ID:', createRes.data?.record_id);

  // Re-fetch Anitha's records
  const afterPostRes = await fetch(`${BASE_URL}/health/records/EC-005`).then(r => r.json());
  console.log('  Count after insertion:', afterPostRes.count);
  console.log('  New Latest Record Date:', afterPostRes.latest?.date);
  console.log('  New Latest BP:', afterPostRes.latest?.bp);
  console.log('  New Latest Temp:', afterPostRes.latest?.temp);

  if (afterPostRes.count !== initialCount + 1) {
    throw new Error(`Expected count ${initialCount + 1}, got ${afterPostRes.count}`);
  }
  if (afterPostRes.latest?.bp !== '121/79' || afterPostRes.latest?.temp !== '98.3°F') {
    throw new Error('Latest summary does not reflect new record values');
  }

  // Verify older records are still present
  const has04Sep = afterPostRes.history.some(h => h.date === '04 Sep 2026');
  const has03Sep = afterPostRes.history.some(h => h.date === '03 Sep 2026');
  const has01Sep = afterPostRes.history.some(h => h.date === '01 Sep 2026');
  if (!has04Sep || !has03Sep || !has01Sep) {
    throw new Error('Previous historical records were lost or overwritten!');
  }
  console.log('  PASS: New record became latest; previous records (04 Sep, 03 Sep, 01 Sep) remain intact.');

  // 6. Direct MySQL Verification
  console.log('\n[TEST 6] Direct MySQL Database Verification:');
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'eldercare_db'
  });

  const [dbRows] = await conn.query('SELECT record_id, resident_id, date, blood_pressure, temperature, weight, observation, recorded_by FROM care_records WHERE resident_id = "EC-005" ORDER BY created_at DESC');
  console.log(`  MySQL care_records table has ${dbRows.length} rows for EC-005.`);
  console.log('  Top MySQL record:', dbRows[0]);
  await conn.end();

  if (dbRows.length !== afterPostRes.count) {
    throw new Error(`MySQL row count (${dbRows.length}) does not match API count (${afterPostRes.count})`);
  }
  console.log('  PASS: Records verified directly in MySQL `care_records` table.');

  // 7. Role-Based Access Scoping Test
  console.log('\n[TEST 7] Role-Based Access Scoping:');
  // Caregiver Priya Nair (assigned to EC-001, EC-006, not EC-005)
  const caregiverRes = await fetch(`${BASE_URL}/health/records/EC-005`, {
    headers: {
      'x-user-role': 'caregiver',
      'x-user-caregiver-name': 'Priya Nair'
    }
  });
  console.log('  Caregiver access to unassigned resident HTTP status:', caregiverRes.status);
  if (caregiverRes.status !== 403) {
    throw new Error('Expected 403 Forbidden for caregiver accessing unassigned resident');
  }
  console.log('  PASS: Caregiver cannot access unassigned resident records.');

  // Family member of EC-001 trying to access EC-005
  const familyRes = await fetch(`${BASE_URL}/health/records/EC-005`, {
    headers: {
      'x-user-role': 'family',
      'x-user-resident-id': 'EC-001'
    }
  });
  console.log('  Family member access to other resident HTTP status:', familyRes.status);
  if (familyRes.status !== 403) {
    throw new Error('Expected 403 Forbidden for family accessing other resident');
  }
  console.log('  PASS: Family member cannot access other resident records.');

  console.log('\n=====================================================');
  console.log('   ALL 7 TESTS PASSED SUCCESSFULLY!                 ');
  console.log('=====================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
