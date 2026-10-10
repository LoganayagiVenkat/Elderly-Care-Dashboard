import { query } from '../config/db.js';

async function cleanDuplicates() {
  console.log('--- Cleaning Duplicate Emergency Appointments & Alerts ---');

  // 1. Find all emergency appointments
  const appts = await query(`
    SELECT id, emergencyId, patientId, patient, specialty, date, time, doctor, type, created_at 
    FROM appointments 
    WHERE emergencyId IS NOT NULL OR type LIKE '%Emergency%'
    ORDER BY created_at DESC, id DESC
  `);

  console.log(`Found ${appts.length} total emergency appointments in database.`);

  const seenEmergencyKeys = new Set();
  const duplicateApptIds = [];
  const duplicateEmgIds = [];

  for (const a of appts) {
    // Key by emergencyId or (patient + specialty + date)
    const key = a.emergencyId ? `emgid:${a.emergencyId}` : `patient:${a.patientId || a.patient}:${a.specialty || a.type}:${a.date}`;
    
    // Also track by resident + specialty to ensure only ONE specialist referral per issue
    const issueKey = `issue:${a.patientId || a.patient}:${a.specialty || 'Dermatology'}`;

    if (seenEmergencyKeys.has(key) || seenEmergencyKeys.has(issueKey)) {
      duplicateApptIds.push(a.id);
      if (a.emergencyId) duplicateEmgIds.push(a.emergencyId);
    } else {
      seenEmergencyKeys.add(key);
      seenEmergencyKeys.add(issueKey);
    }
  }

  console.log(`Identified ${duplicateApptIds.length} duplicate emergency appointments to remove:`, duplicateApptIds);

  if (duplicateApptIds.length > 0) {
    for (const id of duplicateApptIds) {
      await query('DELETE FROM appointments WHERE id = ?', [id]);
    }
    console.log('✓ Successfully deleted duplicate appointments.');
  }

  if (duplicateEmgIds.length > 0) {
    for (const emgId of duplicateEmgIds) {
      await query('DELETE FROM emergency_alerts WHERE id = ?', [emgId]);
      await query('DELETE FROM notifications WHERE emergencyId = ?', [emgId]);
    }
    console.log('✓ Successfully deleted corresponding duplicate alerts and notifications.');
  }

  // 2. Add Unique Key on emergencyId in appointments table
  try {
    await query('ALTER TABLE appointments ADD UNIQUE KEY uq_appt_emergencyId (emergencyId)');
    console.log('✓ Successfully added UNIQUE KEY uq_appt_emergencyId on appointments(emergencyId).');
  } catch (err) {
    console.log('Unique key note:', err.message);
  }

  // 3. Verify remaining emergency appointments for Anitha Sundaram
  const remaining = await query(`
    SELECT id, emergencyId, patient, doctor, type, specialty, date, time 
    FROM appointments 
    WHERE patientId = 'EC-005' OR patient LIKE '%Anitha%'
  `);
  console.log('\nRemaining appointments for Anitha Sundaram:');
  console.table(remaining);
  process.exit(0);
}

cleanDuplicates().catch(err => {
  console.error('Error cleaning duplicates:', err);
  process.exit(1);
});
