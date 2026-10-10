import { mockStore } from '../config/mockStore.js';

async function syncMedications() {
  const base = 'http://localhost:5000/api/medications';
  console.log('Fetching current medications from running server...');
  const res = await fetch(base);
  const data = await res.json();
  const existing = data.data || [];
  console.log(`Found ${existing.length} existing medications on server.`);

  console.log('Clearing old medications...');
  for (const m of existing) {
    await fetch(`${base}/${m.id}`, { method: 'DELETE' });
  }

  console.log(`Injecting ${mockStore.medications.length} fresh comprehensive medications...`);
  for (const med of mockStore.medications) {
    const postRes = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(med)
    });
    if (!postRes.ok) {
      console.error(`Failed to post ${med.id}:`, await postRes.text());
    }
  }

  const verifyRes = await fetch(base);
  const verifyData = await verifyRes.json();
  console.log(`Verification: Server now has ${verifyData.data?.length} medications!`);
  
  // Group by resident
  const byResident = {};
  for (const m of verifyData.data || []) {
    const pid = m.patientId || m.residentId;
    byResident[pid] = (byResident[pid] || 0) + 1;
  }
  console.log('Counts per resident:', byResident);
}

syncMedications().catch(console.error);
