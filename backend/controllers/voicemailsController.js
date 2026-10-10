// ============================================================
// ElderCare — Voicemails Controller
// Manages in-app voice notes and audio mail between elderly residents,
// caregivers, doctors, and family members.
// ============================================================

import { query } from '../config/db.js';

// GET /api/voicemails
export async function getVoicemails(req, res) {
  try {
    const { residentId, category, role } = req.query;
    let sql = 'SELECT * FROM voicemails';
    const params = [];
    const conditions = [];

    if (residentId) {
      conditions.push('residentId = ?');
      params.push(residentId);
    }

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY id DESC';

    const rows = await query(sql, params);
    return res.json({ success: true, data: rows || [] });
  } catch (error) {
    console.error('[Voicemails Controller] Get error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve voicemails.' });
  }
}

// POST /api/voicemails
export async function createVoicemail(req, res) {
  try {
    const {
      residentId,
      residentName,
      senderName,
      senderRole,
      recipientName,
      recipientRole,
      category = 'general',
      subject = 'Voice Message',
      duration = 0,
      audioUrl = '',
      notes = '',
      emergencyId = null,
    } = req.body;

    const id = `VM-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await query(
      `INSERT INTO voicemails 
       (id, residentId, residentName, senderName, senderRole, recipientName, recipientRole, category, subject, duration, audioUrl, notes, emergencyId, isRead, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        residentId || 'EC-001',
        residentName || 'Resident',
        senderName || 'Anonymous',
        senderRole || 'patient',
        recipientName || 'All Caregivers',
        recipientRole || 'caregiver',
        category,
        subject,
        duration,
        audioUrl,
        notes,
        emergencyId || null,
        0,
        createdAt
      ]
    );

    const created = await query('SELECT * FROM voicemails WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({
      success: true,
      data: created[0] || {
        id,
        residentId,
        residentName,
        senderName,
        senderRole,
        recipientName,
        recipientRole,
        category,
        subject,
        duration,
        audioUrl,
        notes,
        emergencyId,
        isRead: 0,
        createdAt
      }
    });
  } catch (error) {
    console.error('[Voicemails Controller] Create error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create voicemail.' });
  }
}

// PATCH /api/voicemails/:id/read
export async function markVoicemailAsRead(req, res) {
  try {
    const { id } = req.params;
    await query('UPDATE voicemails SET isRead = 1 WHERE id = ?', [id]);
    const updated = await query('SELECT * FROM voicemails WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, data: updated[0] || { id, isRead: 1 } });
  } catch (error) {
    console.error('[Voicemails Controller] Mark read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update voicemail status.' });
  }
}

// DELETE /api/voicemails/:id
export async function deleteVoicemail(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM voicemails WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Voicemail deleted successfully.' });
  } catch (error) {
    console.error('[Voicemails Controller] Delete error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete voicemail.' });
  }
}
