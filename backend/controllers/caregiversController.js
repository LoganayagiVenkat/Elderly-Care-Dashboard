import { query } from '../config/db.js';

// GET /api/caregivers
export async function getCaregivers(req, res) {
  try {
    const { role, caregiverName } = req.query;
    let sql = 'SELECT * FROM caregivers ORDER BY name ASC';
    let params = [];

    if (role === 'caregiver' && caregiverName) {
      sql = 'SELECT * FROM caregivers WHERE name = ?';
      params = [caregiverName];
    } else if (role === 'family' || role === 'patient') {
      sql = 'SELECT * FROM caregivers WHERE status = "active" ORDER BY name ASC';
    }

    const rows = await query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Caregivers Controller] Get caregivers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve caregivers.' });
  }
}

// POST /api/caregivers
export async function createCaregiver(req, res) {
  try {
    const c = req.body;
    const id = c.id || `CG-${String(Math.floor(Math.random() * 90) + 10)}`;
    const initials = c.initials || c.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

    await query(
      'INSERT INTO caregivers (id, name, initials, role, experience, assigned, availability, status, shift, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        c.name,
        initials,
        c.role || 'Care Assistant',
        c.experience || '1 year',
        Number(c.assigned) || 0,
        c.availability || 'On Duty',
        c.status || 'active',
        c.shift || 'Morning · 8:00 AM – 4:00 PM',
        c.phone || '+91 90000 00000'
      ]
    );

    const created = await query('SELECT * FROM caregivers WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error('[Caregivers Controller] Create caregiver error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create caregiver.' });
  }
}

// PUT /api/caregivers/:id
export async function updateCaregiver(req, res) {
  try {
    const { id } = req.params;
    const c = req.body;
    await query(
      'UPDATE caregivers SET name = ?, role = ?, experience = ?, assigned = ?, availability = ?, status = ?, shift = ?, phone = ? WHERE id = ?',
      [c.name, c.role, c.experience, c.assigned, c.availability, c.status, c.shift, c.phone, id]
    );
    const updated = await query('SELECT * FROM caregivers WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[Caregivers Controller] Update caregiver error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update caregiver.' });
  }
}

// DELETE /api/caregivers/:id
export async function deleteCaregiver(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM caregivers WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Caregiver deleted successfully.' });
  } catch (error) {
    console.error('[Caregivers Controller] Delete caregiver error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete caregiver.' });
  }
}
