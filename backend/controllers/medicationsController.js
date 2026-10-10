import { query } from '../config/db.js';

// GET /api/medications
export async function getMedications(req, res) {
  try {
    const patientId = req.query.patientId || req.query.residentId;
    const prescribedBy = req.query.prescribedBy || req.query.doctor;
    let sql = 'SELECT * FROM medications WHERE 1=1';
    let params = [];

    if (patientId) {
      sql += ' AND patientId = ?';
      params.push(patientId);
    }
    if (prescribedBy && prescribedBy !== 'all') {
      sql += ' AND LOWER(prescribedBy) LIKE LOWER(?)';
      params.push(`%${prescribedBy}%`);
    }
    sql += ' ORDER BY time ASC';

    const rows = await query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Medications Controller] Get medications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve medications.' });
  }
}

// POST /api/medications
export async function createMedication(req, res) {
  try {
    const m = req.body;
    const id = m.id || `MED-${Date.now().toString().slice(-4)}`;
    const initials = m.initials || (m.patient ? m.patient.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() : 'RX');
    const patientId = m.patientId || m.residentId;

    await query(
      'INSERT INTO medications (id, time, slot, patient, patientId, initials, medicine, dosage, frequency, instructions, prescribedBy, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        m.time || '08:00 AM',
        m.slot || 'Morning Medication',
        m.patient,
        patientId,
        initials,
        m.medicine,
        m.dosage,
        m.frequency || 'Once Daily',
        m.instructions || '',
        m.prescribedBy || 'Attending Physician',
        m.startDate || new Date().toISOString().split('T')[0],
        m.endDate || 'Ongoing',
        m.status || 'pending'
      ]
    );

    const created = await query('SELECT * FROM medications WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error('[Medications Controller] Create medication error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add medication.' });
  }
}

// PATCH /api/medications/:id/status
export async function updateMedicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    await query('UPDATE medications SET status = ? WHERE id = ?', [status, id]);
    const updated = await query('SELECT * FROM medications WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[Medications Controller] Update status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update medication status.' });
  }
}

// DELETE /api/medications/:id
export async function deleteMedication(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM medications WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Medication removed.' });
  } catch (error) {
    console.error('[Medications Controller] Delete medication error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete medication.' });
  }
}
