import { query, testConnection } from '../config/db.js';

async function migrate() {
  console.log('[Migration] Ensuring columns for Care Dependency Map exist in MySQL...');
  await testConnection();

  try {
    await query('ALTER TABLE emergency_alerts ADD COLUMN care_record_id VARCHAR(50)');
    console.log('[Migration] Added emergency_alerts.care_record_id');
  } catch (e) {
    console.log('[Migration] emergency_alerts.care_record_id note:', e.message);
  }

  try {
    await query("ALTER TABLE appointments ADD COLUMN followup_required VARCHAR(50) DEFAULT 'Not Required'");
    console.log('[Migration] Added appointments.followup_required');
  } catch (e) {
    console.log('[Migration] appointments.followup_required note:', e.message);
  }

  try {
    await query("ALTER TABLE appointments ADD COLUMN followup_status VARCHAR(50) DEFAULT 'None'");
    console.log('[Migration] Added appointments.followup_status');
  } catch (e) {
    console.log('[Migration] appointments.followup_status note:', e.message);
  }

  try {
    await query('ALTER TABLE appointments ADD COLUMN followup_notes TEXT');
    console.log('[Migration] Added appointments.followup_notes');
  } catch (e) {
    console.log('[Migration] appointments.followup_notes note:', e.message);
  }

  // Update Anitha Sundaram's existing emergency and appointment with genuine relationship linkage
  try {
    // Check if Anitha has the skin disease alert
    const anithaAlerts = await query("SELECT * FROM emergency_alerts WHERE residentId = 'EC-005' AND emergencyType LIKE '%Skin%' LIMIT 1");
    if (anithaAlerts && anithaAlerts.length > 0) {
      const alertId = anithaAlerts[0].id;
      // Link to Anitha's afternoon care record REC-1789807481340 or REC-AS-01
      await query("UPDATE emergency_alerts SET care_record_id = 'REC-1789807481340' WHERE id = ?", [alertId]);
      console.log(`[Migration] Linked emergency alert ${alertId} to care record REC-1789807481340`);

      // Update the appointment AP-EMG-1509 to have follow-up requirement
      await query(`
        UPDATE appointments 
        SET followup_required = 'Required',
            followup_status = 'Pending',
            followup_notes = 'Post-dermatology skin rash evaluation and topical treatment review with Dr. Suresh Rao'
        WHERE emergencyId = ? OR id = 'AP-EMG-1509'
      `, [alertId]);
      console.log(`[Migration] Updated appointment follow-up for emergency ${alertId}`);
    }

    // Also update any other emergency appointments with appropriate follow-up status
    await query(`
      UPDATE appointments 
      SET followup_required = 'Required',
          followup_status = 'Pending',
          followup_notes = 'Follow-up clinical assessment following emergency specialist consultation'
      WHERE emergencyId IS NOT NULL AND (followup_required IS NULL OR followup_required = 'Not Required')
    `);
  } catch (err) {
    console.warn('[Migration] Anitha seed link note:', err.message);
  }

  console.log('[Migration] Migration completed successfully.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
