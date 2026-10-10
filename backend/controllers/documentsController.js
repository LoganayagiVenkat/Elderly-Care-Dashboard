import { query } from '../config/db.js';

// GET /api/documents
export async function getDocuments(req, res) {
  try {
    const { residentId } = req.query;
    let sql = 'SELECT * FROM documents ORDER BY id ASC';
    let params = [];

    if (residentId) {
      sql = 'SELECT * FROM documents WHERE residentId = ?';
      params = [residentId];
    }

    const rows = await query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Documents Controller] Get documents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
}

// POST /api/documents
export async function createDocument(req, res) {
  try {
    const d = req.body;
    const id = d.id || `DOC-${Date.now().toString().slice(-4)}`;

    await query(
      'INSERT INTO documents (id, name, type, patient, residentId, date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        d.name,
        d.type || 'Medical Report',
        d.patient,
        d.residentId || null,
        d.date || 'Today',
        d.status || 'reviewed'
      ]
    );

    const created = await query('SELECT * FROM documents WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error('[Documents Controller] Create document error:', error);
    return res.status(500).json({ success: false, message: 'Failed to register document.' });
  }
}
