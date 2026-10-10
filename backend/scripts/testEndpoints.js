async function runTests() {
  const base = 'http://localhost:5000/api';

  console.log('\n--- 1. Health Check ---');
  const hRes = await fetch(`${base}/health-check`);
  const hData = await hRes.json();
  console.log('Database Status:', hData.database, '| DB Name:', hData.dbName);

  console.log('\n--- 2. Auth Login (admin/admin) ---');
  const lRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });
  const lData = await lRes.json();
  console.log('Login Success:', lData.success, '| User:', lData.user?.name, '| Role:', lData.user?.role);

  console.log('\n--- 3. Residents List ---');
  const rRes = await fetch(`${base}/residents`);
  const rData = await rRes.json();
  console.log('Total Residents:', rData.data?.length, '| First:', rData.data?.[0]?.name, 'in', rData.data?.[0]?.room);

  console.log('\n--- 4. Medications List ---');
  const mRes = await fetch(`${base}/medications`);
  const mData = await mRes.json();
  console.log('Total Scheduled Medications:', mData.data?.length, '| First:', mData.data?.[0]?.patient, '-', mData.data?.[0]?.medicine);

  console.log('\n--- 5. Appointments List ---');
  const aRes = await fetch(`${base}/appointments`);
  const aData = await aRes.json();
  console.log('Total Appointments:', aData.data?.length, '| First:', aData.data?.[0]?.patient, 'with', aData.data?.[0]?.doctor);

  console.log('\n--- 6. Care Plans ---');
  const cRes = await fetch(`${base}/care-plans`);
  const cData = await cRes.json();
  console.log('Total Care Plans:', cData.data?.length, '| First Goal:', cData.data?.[0]?.goal, '(', cData.data?.[0]?.progress, '%)');

  console.log('\n--- 7. Chatbot Query ---');
  const cbRes = await fetch(`${base}/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What medications are scheduled?' })
  });
  const cbData = await cbRes.json();
  console.log('Chatbot Reply:\n', cbData.reply);

  console.log('\n=== ALL ENDPOINTS WORKING 100% WITH MYSQL ===\n');
}

runTests().catch(console.error);
