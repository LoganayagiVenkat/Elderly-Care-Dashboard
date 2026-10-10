import { query } from '../config/db.js';

// GET /api/activities
export async function getActivities(req, res) {
  try {
    const rows = await query('SELECT * FROM activities ORDER BY id ASC');
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Activities Controller] Get activities error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve activities.' });
  }
}

// POST /api/activities
export async function createActivity(req, res) {
  try {
    const a = req.body;
    const id = a.id || `ACT-${Date.now().toString().slice(-4)}`;

    await query(
      'INSERT INTO activities (id, name, icon, type, schedule, duration, facilitator, participants, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        a.name,
        a.icon || 'Users',
        a.type || 'General',
        a.schedule || 'Daily',
        a.duration || '30 min',
        a.facilitator || 'Care Coordinator',
        Number(a.participants) || 0,
        a.status || 'active'
      ]
    );

    const created = await query('SELECT * FROM activities WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error('[Activities Controller] Create activity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create activity.' });
  }
}
