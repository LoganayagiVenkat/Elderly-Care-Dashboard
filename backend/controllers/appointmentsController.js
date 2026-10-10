import { query } from '../config/db.js';

// GET /api/appointments/specialists
export async function getAppointmentSpecialists(req, res) {
  try {
    const { specialty } = req.query;
    let sql = 'SELECT * FROM specialists ORDER BY specialty ASC, name ASC';
    let params = [];
    if (specialty) {
      sql = 'SELECT * FROM specialists WHERE LOWER(specialty) = LOWER(?) ORDER BY name ASC';
      params = [specialty];
    }
    const rows = await query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Appointments Controller] Get specialists error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve specialists.' });
  }
}

// GET /api/appointments
export async function getAppointments(req, res) {
  try {
    const patientId = req.query.patientId || req.query.residentId;
    let sql = 'SELECT * FROM appointments WHERE 1=1';
    let params = [];

    if (patientId) {
      sql += ' AND patientId = ?';
      params.push(patientId);
    }
    const doctorId = req.query.doctorId;
    const doctor = req.query.doctor;
    if (doctorId && doctorId !== 'all') {
      sql += ' AND (doctorId = ? OR LOWER(doctor) LIKE LOWER(?))';
      params.push(doctorId, `%${doctorId}%`);
    } else if (doctor && doctor !== 'all') {
      sql += ' AND LOWER(doctor) LIKE LOWER(?)';
      params.push(`%${doctor}%`);
    }
    sql += ' ORDER BY date ASC, time ASC';

    const rows = await query(sql, params);

    const seenEmergencyIds = new Set();
    const uniqueRows = [];
    for (const row of rows) {
      if (row.emergencyId) {
        if (seenEmergencyIds.has(row.emergencyId)) {
          continue;
        }
        seenEmergencyIds.add(row.emergencyId);
      }
      uniqueRows.push(row);
    }

    return res.json({ success: true, data: uniqueRows });
  } catch (error) {
    console.error('[Appointments Controller] Get appointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve appointments.' });
  }
}

// POST /api/appointments
export async function createAppointment(req, res) {
  try {
    const a = req.body;
    const id = a.id || `AP-${Date.now().toString().slice(-4)}`;
    const patientId = a.patientId || a.residentId;

    if (a.emergencyId) {
      const existing = await query('SELECT * FROM appointments WHERE emergencyId = ? LIMIT 1', [a.emergencyId]);
      if (existing && existing.length > 0) {
        return res.status(200).json({ success: true, isDuplicate: true, data: existing[0] });
      }
    }

    if ((a.doctorId || a.doctor) && a.date && a.time) {
      const conflicting = await query(
        `SELECT id, patient, time, date, doctor FROM appointments 
         WHERE (doctorId = ? OR doctor = ?) 
           AND date = ? 
           AND time = ? 
           AND status != 'cancelled' 
         LIMIT 1`,
        [a.doctorId || null, a.doctor, a.date, a.time]
      );

      if (conflicting && conflicting.length > 0) {
        return res.status(409).json({
          success: false,
          isConflict: true,
          message: `This slot (${a.time} on ${a.date}) for ${a.doctor} is already booked for ${conflicting[0].patient}. Please select another available slot.`
        });
      }
    }

    await query(
      'INSERT INTO appointments (id, date, time, patient, patientId, doctor, doctorId, type, specialty, reason, emergencyId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        a.date,
        a.time,
        a.patient,
        patientId,
        a.doctor,
        a.doctorId || null,
        a.type || 'Consultation',
        a.specialty || 'General',
        a.reason || 'General checkup',
        a.emergencyId || null,
        a.status || 'confirmed'
      ]
    );

    const created = await query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error('[Appointments Controller] Create appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to book appointment.' });
  }
}

// PATCH /api/appointments/:id/status
export async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    await query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    const updated = await query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[Appointments Controller] Update appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update appointment status.' });
  }
}

// DELETE /api/appointments/:id
export async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [id]);
    if (existing && existing.length > 0 && existing[0].emergencyId) {
      try {
        await query('UPDATE emergency_alerts SET status = "resolved", resolutionNotes = "Emergency appointment deleted by staff" WHERE id = ?', [existing[0].emergencyId]);
      } catch { }
    }
    await query('DELETE FROM appointments WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Appointment deleted successfully.' });
  } catch (error) {
    console.error('[Appointments Controller] Delete appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete appointment.' });
  }
}
