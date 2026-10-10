import { query } from '../config/db.js';

async function seedCp() {
  const existing = await query("SELECT * FROM care_plans WHERE residentId = 'EC-005'");
  if (existing.length === 0) {
    await query(
      'INSERT INTO care_plans (id, patient, residentId, initials, goal, caregiver, reviewDate, progress, tasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'CP-05',
        'Anitha Sundaram',
        'EC-005',
        'AS',
        'Cognitive retention & memory wellness',
        'Deepa Suresh',
        'In 5 days',
        70,
        JSON.stringify([
          { label: 'Daily memory-care puzzle session', done: true },
          { label: 'Afternoon music therapy interaction', done: true },
          { label: 'Evening gentle mobility stroll', done: false },
          { label: 'Weekly cognitive evaluation review', done: false }
        ])
      ]
    );
    console.log('Seeded CP-05 for Anitha Sundaram.');
  } else {
    console.log('CP-05 already exists.');
  }
  process.exit(0);
}

seedCp();
