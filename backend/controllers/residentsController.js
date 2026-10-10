import { query } from '../config/db.js';

// Helper: Generate next sequential EC-XXX ID
async function generateNextResidentId() {
  const rows = await query("SELECT id FROM residents WHERE id LIKE 'EC-%'");
  let maxNum = 0;
  for (const row of rows) {
    const match = String(row.id).match(/^EC-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `EC-${String(nextNum).padStart(3, '0')}`;
}

// GET /api/residents
export async function getResidents(req, res) {
  try {
    const { role, caregiverName, residentId } = req.query;
    let sql = 'SELECT * FROM residents ORDER BY name ASC';
    let params = [];

    if (role === 'caregiver' && caregiverName) {
      sql = 'SELECT * FROM residents WHERE caregiver = ? ORDER BY name ASC';
      params = [caregiverName];
    } else if ((role === 'family' || role === 'patient') && residentId) {
      sql = 'SELECT * FROM residents WHERE id = ?';
      params = [residentId];
    }

    const rows = await query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Residents Controller] Get residents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve residents.' });
  }
}

// GET /api/residents/:id
export async function getResidentById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM residents WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resident not found.' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[Residents Controller] Get resident detail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resident details.' });
  }
}

// POST /api/residents
export async function createResident(req, res) {
  try {
    const userRole = req.headers['x-user-role'] || req.body.userRole || req.query.userRole;
    if (userRole && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Administrators are authorized to add new elderly residents.'
      });
    }

    const r = req.body;
    const name = r.name ? r.name.trim() : '';
    const age = parseInt(r.age, 10);
    const gender = r.gender ? r.gender.trim() : '';
    const room = r.room ? r.room.trim() : '';
    const caregiver = r.caregiver ? r.caregiver.trim() : '';
    const status = r.status ? r.status.trim() : 'stable';
    const emergencyContact = r.emergencyContact ? r.emergencyContact.trim() : '';
    const phone = r.phone ? r.phone.trim() : '';
    const notes = r.notes ? r.notes.trim() : '';
    const condition = r.condition ? r.condition.trim() : (r.notes || 'General Geriatric Care');
    const bloodGroup = r.bloodGroup ? r.bloodGroup.trim() : 'O+';

    if (!name) {
      return res.status(400).json({ success: false, message: 'Full Name is required.' });
    }
    if (isNaN(age) || age <= 0 || age > 130) {
      return res.status(400).json({ success: false, message: 'Please enter a valid age between 1 and 130.' });
    }
    if (!gender) {
      return res.status(400).json({ success: false, message: 'Gender is required.' });
    }
    if (!room) {
      return res.status(400).json({ success: false, message: 'Room assignment is required.' });
    }
    if (!caregiver) {
      return res.status(400).json({ success: false, message: 'Caregiver assignment is required.' });
    }
    if (!status) {
      return res.status(400).json({ success: false, message: 'Health Status is required.' });
    }
    if (!emergencyContact) {
      return res.status(400).json({ success: false, message: 'Emergency Contact is required.' });
    }

    let nextId = r.id;
    if (!nextId || !/^EC-\d+$/i.test(nextId)) {
      nextId = await generateNextResidentId();
    }

    const dupCheck = await query('SELECT id FROM residents WHERE id = ? LIMIT 1', [nextId]);
    if (dupCheck.length > 0) {
      nextId = await generateNextResidentId();
    }

    const initials = r.initials || name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('') || 'EC';
    const admittedDate = r.admitted || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const lastAssessment = r.lastAssessment || 'Today';

    await query(
      'INSERT INTO residents (id, name, initials, age, gender, status, room, caregiver, lastAssessment, `condition`, bloodGroup, admitted, emergencyContact, notes, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nextId,
        name,
        initials,
        age,
        gender,
        status,
        room,
        caregiver,
        lastAssessment,
        condition,
        bloodGroup,
        admittedDate,
        emergencyContact,
        notes,
        phone
      ]
    );

    const created = await query('SELECT * FROM residents WHERE id = ? LIMIT 1', [nextId]);
    return res.status(201).json({
      success: true,
      message: 'Resident added successfully.',
      data: created[0]
    });
  } catch (error) {
    console.error('[Residents Controller] Create resident error:', error);
    return res.status(500).json({ success: false, message: 'Unable to add resident. Database error occurred.' });
  }
}

// PUT /api/residents/:id
export async function updateResident(req, res) {
  try {
    const { id } = req.params;
    const r = req.body;

    await query(
      'UPDATE residents SET name = ?, age = ?, gender = ?, status = ?, room = ?, caregiver = ?, `condition` = ?, bloodGroup = ?, emergencyContact = ?, notes = ? WHERE id = ?',
      [
        r.name,
        r.age,
        r.gender,
        r.status,
        r.room,
        r.caregiver,
        r.condition,
        r.bloodGroup,
        r.emergencyContact,
        r.notes,
        id
      ]
    );

    const updated = await query('SELECT * FROM residents WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[Residents Controller] Update resident error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update resident.' });
  }
}

// DELETE /api/residents/:id
export async function deleteResident(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM residents WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Resident deleted successfully.' });
  } catch (error) {
    console.error('[Residents Controller] Delete resident error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete resident.' });
  }
}
