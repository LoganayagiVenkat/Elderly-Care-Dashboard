import { query } from '../config/db.js';

// Helper: Role scoping for care records
async function getPermittedResidentIds(role, caregiverName, userResidentId) {
  if (role === 'admin' || !role) return null;
  if (role === 'caregiver' && caregiverName) {
    const assigned = await query('SELECT id FROM residents WHERE caregiver = ?', [caregiverName]);
    return new Set(assigned.map((r) => r.id));
  }
  if ((role === 'family' || role === 'patient') && userResidentId) {
    return new Set([userResidentId]);
  }
  return new Set();
}

// GET /api/health/overview
export async function getHealthOverview(req, res) {
  try {
    const rows = await query(`
      SELECT hv.*, r.name as residentName, r.room
      FROM health_vitals hv
      INNER JOIN (
        SELECT residentId, MAX(id) as maxId
        FROM health_vitals
        GROUP BY residentId
      ) latest ON hv.id = latest.maxId
      LEFT JOIN residents r ON hv.residentId = r.id
      ORDER BY hv.residentId ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Health Controller] Get overview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve health overview.' });
  }
}

// GET /api/health/records
export async function getCareRecords(req, res) {
  try {
    const { residentId, search, recordType, recordedBy, sort } = req.query;
    const role = req.headers['x-user-role'] || req.query.role;
    const caregiverName = req.headers['x-user-caregiver-name'] || req.query.caregiverName;
    const userResidentId = req.headers['x-user-resident-id'] || req.query.userResidentId;

    const permittedIds = await getPermittedResidentIds(role, caregiverName, userResidentId);

    let sql = `
      SELECT 
        cr.record_id as id,
        cr.record_id,
        cr.resident_id as residentId,
        cr.resident_id,
        cr.date,
        cr.time,
        cr.blood_pressure as bp,
        cr.blood_pressure,
        cr.temperature as temp,
        cr.temperature,
        cr.weight,
        cr.observation,
        cr.notes as note,
        cr.notes,
        cr.recorded_by as recordedBy,
        cr.recorded_by,
        cr.record_type as recordType,
        cr.record_type,
        cr.created_at as createdAt,
        cr.created_at,
        r.name as residentName
      FROM care_records cr
      LEFT JOIN residents r ON cr.resident_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (permittedIds !== null) {
      if (permittedIds.size === 0) {
        return res.json({ success: true, data: [] });
      }
      const placeholders = Array.from(permittedIds).map(() => '?').join(',');
      sql += ` AND cr.resident_id IN (${placeholders})`;
      params.push(...Array.from(permittedIds));
    }

    if (residentId) {
      sql += ' AND cr.resident_id = ?';
      params.push(residentId);
    }

    if (recordType && recordType !== 'all') {
      sql += ' AND cr.record_type = ?';
      params.push(recordType);
    }

    if (recordedBy && recordedBy !== 'all') {
      sql += ' AND cr.recorded_by LIKE ?';
      params.push(`%${recordedBy}%`);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (
        r.name LIKE ? OR
        cr.resident_id LIKE ? OR
        cr.date LIKE ? OR
        cr.recorded_by LIKE ? OR
        cr.observation LIKE ? OR
        cr.notes LIKE ? OR
        cr.record_type LIKE ? OR
        cr.blood_pressure LIKE ? OR
        cr.temperature LIKE ? OR
        cr.weight LIKE ?
      )`;
      for (let i = 0; i < 10; i++) {
        params.push(term);
      }
    }

    if (sort === 'asc') {
      sql += ' ORDER BY cr.created_at ASC';
    } else {
      sql += ' ORDER BY cr.created_at DESC';
    }

    const rows = await query(sql, params);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[Health Controller] Get care records error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve care records.' });
  }
}

// GET /api/health/records/:residentId
export async function getResidentCareRecords(req, res) {
  try {
    const { residentId } = req.params;
    const role = req.headers['x-user-role'] || req.query.role;
    const caregiverName = req.headers['x-user-caregiver-name'] || req.query.caregiverName;
    const userResidentId = req.headers['x-user-resident-id'] || req.query.userResidentId;

    const permittedIds = await getPermittedResidentIds(role, caregiverName, userResidentId);
    if (permittedIds !== null && !permittedIds.has(residentId)) {
      return res.status(403).json({ success: false, message: 'Access denied to this resident records.' });
    }

    const rows = await query(
      `SELECT 
        cr.record_id as id,
        cr.record_id,
        cr.resident_id as residentId,
        cr.resident_id,
        cr.date,
        cr.time,
        cr.blood_pressure as bp,
        cr.blood_pressure,
        cr.temperature as temp,
        cr.temperature,
        cr.weight,
        cr.observation,
        cr.notes as note,
        cr.notes,
        cr.recorded_by as recordedBy,
        cr.recorded_by,
        cr.record_type as recordType,
        cr.record_type,
        cr.created_at as createdAt,
        cr.created_at,
        r.name as residentName
      FROM care_records cr
      LEFT JOIN residents r ON cr.resident_id = r.id
      WHERE cr.resident_id = ?
      ORDER BY cr.created_at DESC`,
      [residentId]
    );

    const latest = rows.length > 0 ? rows[0] : null;
    return res.json({ success: true, count: rows.length, latest, summary: latest, history: rows });
  } catch (error) {
    console.error('[Health Controller] Get resident care records error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resident care records.' });
  }
}

// POST /api/health/records
export async function insertCareRecord(req, res) {
  try {
    const {
      residentId,
      resident_id,
      date,
      time,
      bp,
      blood_pressure,
      temp,
      temperature,
      weight,
      observation,
      note,
      notes,
      recordedBy,
      recorded_by,
      recordType,
      record_type
    } = req.body;

    const targetResidentId = residentId || resident_id;
    const finalBp = (bp || blood_pressure || '').trim();
    const finalTemp = (temp || temperature || '').trim();
    const finalWeight = (weight || '').trim();
    const finalNotes = (note || notes || '').trim();
    const finalObservation = (observation || 'Normal').trim();
    const finalRecordedBy = (recordedBy || recorded_by || req.headers['x-user-name'] || 'Caregiver').trim();
    const finalRecordType = (recordType || record_type || 'Routine Round').trim();

    if (!targetResidentId) {
      return res.status(400).json({ success: false, message: 'Resident ID is required.' });
    }
    if (!finalBp || !finalTemp || !finalWeight || !finalNotes) {
      return res.status(400).json({ success: false, message: 'Blood pressure, temperature, weight, and observation notes are required.' });
    }

    const now = new Date();
    const finalDate = (date || '').trim() || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const finalTime = (time || '').trim() || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const recordId = `REC-${Date.now()}`;

    await query(
      `INSERT INTO care_records (record_id, resident_id, date, time, blood_pressure, temperature, weight, observation, notes, recorded_by, record_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        targetResidentId,
        finalDate,
        finalTime,
        finalBp,
        finalTemp,
        finalWeight,
        finalObservation,
        finalNotes,
        finalRecordedBy,
        finalRecordType
      ]
    );

    try {
      const parts = finalBp.replace(/[^\d/]/g, '').split('/');
      const systolic = parts[0] ? parseInt(parts[0], 10) : 120;
      const diastolic = parts[1] ? parseInt(parts[1], 10) : 80;
      await query(
        'INSERT INTO health_vitals (residentId, heartRate, systolic, diastolic, spO2, glucose, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          targetResidentId,
          72,
          systolic,
          diastolic,
          98,
          100,
          finalObservation
        ]
      );
    } catch (syncErr) {
      console.warn('[Health Controller] Failed to sync to health_vitals:', syncErr);
    }

    const created = await query(
      `SELECT 
        cr.record_id as id,
        cr.record_id,
        cr.resident_id as residentId,
        cr.resident_id,
        cr.date,
        cr.time,
        cr.blood_pressure as bp,
        cr.blood_pressure,
        cr.temperature as temp,
        cr.temperature,
        cr.weight,
        cr.observation,
        cr.notes as note,
        cr.notes,
        cr.recorded_by as recordedBy,
        cr.recorded_by,
        cr.record_type as recordType,
        cr.record_type,
        cr.created_at as createdAt,
        cr.created_at,
        r.name as residentName
      FROM care_records cr
      LEFT JOIN residents r ON cr.resident_id = r.id
      WHERE cr.record_id = ?
      LIMIT 1`,
      [recordId]
    );

    return res.status(201).json({
      success: true,
      message: 'Care record inserted successfully.',
      data: created[0] || {
        id: recordId,
        record_id: recordId,
        residentId: targetResidentId,
        date: finalDate,
        time: finalTime,
        bp: finalBp,
        temp: finalTemp,
        weight: finalWeight,
        observation: finalObservation,
        notes: finalNotes,
        recordedBy: finalRecordedBy,
        recordType: finalRecordType
      }
    });
  } catch (error) {
    console.error('[Health Controller] Insert care record error:', error);
    return res.status(500).json({ success: false, message: 'Failed to insert care record.' });
  }
}

// DELETE /api/health/records/:recordId
export async function deleteCareRecord(req, res) {
  try {
    const { recordId } = req.params;
    await query('DELETE FROM care_records WHERE record_id = ?', [recordId]);
    return res.json({ success: true, message: 'Care record deleted successfully.' });
  } catch (error) {
    console.error('[Health Controller] Delete care record error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete care record.' });
  }
}

// GET /api/health/:residentId
export async function getResidentVitals(req, res) {
  try {
    const { residentId } = req.params;
    const rows = await query(
      'SELECT * FROM health_vitals WHERE residentId = ? ORDER BY id DESC LIMIT 20',
      [residentId]
    );
    const latest = rows.length > 0 ? rows[0] : null;
    return res.json({ success: true, latest, history: rows });
  } catch (error) {
    console.error('[Health Controller] Get vitals error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve vitals.' });
  }
}

// POST /api/health/:residentId
export async function recordResidentVitals(req, res) {
  try {
    const { residentId } = req.params;
    const { heartRate, systolic, diastolic, spO2, glucose, status } = req.body;

    let derivedStatus = status;
    if (!derivedStatus) {
      if ((heartRate && (heartRate > 100 || heartRate < 50)) || (systolic && systolic > 140)) {
        derivedStatus = 'Attention';
      } else {
        derivedStatus = 'Normal';
      }
    }

    await query(
      'INSERT INTO health_vitals (residentId, heartRate, systolic, diastolic, spO2, glucose, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        residentId,
        Number(heartRate) || 72,
        Number(systolic) || 120,
        Number(diastolic) || 80,
        Number(spO2) || 98,
        Number(glucose) || 100,
        derivedStatus
      ]
    );

    const latest = await query(
      'SELECT * FROM health_vitals WHERE residentId = ? ORDER BY id DESC LIMIT 1',
      [residentId]
    );

    return res.status(201).json({ success: true, data: latest[0] });
  } catch (error) {
    console.error('[Health Controller] Record vitals error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record vitals.' });
  }
}
