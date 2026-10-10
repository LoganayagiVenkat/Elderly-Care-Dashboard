import { query } from '../config/db.js';

function formatNotif(n) {
  return {
    ...n,
    read: Boolean(n.is_read),
    actionable: Boolean(n.actionable),
    group: n.group_name || 'today'
  };
}

// GET /api/notifications
export async function getNotifications(req, res) {
  try {
    const rows = await query('SELECT * FROM notifications ORDER BY created_at DESC, id DESC');
    return res.json({ success: true, data: rows.map(formatNotif) });
  } catch (error) {
    console.error('[Notifications Controller] Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

// POST /api/notifications
export async function createNotification(req, res) {
  try {
    const n = req.body;
    const id = n.id || `NT-${Date.now()}`;

    await query(
      'INSERT INTO notifications (id, type, title, time, patient, residentId, detail, `desc`, group_name, is_read, actionable, senderRole, emergencyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        n.type || 'general',
        n.title,
        n.time || 'Just now',
        n.patient || null,
        n.residentId || null,
        n.detail || '',
        n.desc || '',
        n.group || 'today',
        n.read ? 1 : 0,
        n.actionable ? 1 : 0,
        n.senderRole || null,
        n.emergencyId || null
      ]
    );

    const created = await query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({ success: true, data: formatNotif(created[0]) });
  } catch (error) {
    console.error('[Notifications Controller] Create notification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create notification.' });
  }
}

// PATCH /api/notifications/:id/read
export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    await query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('[Notifications Controller] Mark read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification read.' });
  }
}

// PATCH /api/notifications/read-all
export async function markAllNotificationsRead(req, res) {
  try {
    await query('UPDATE notifications SET is_read = 1');
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[Notifications Controller] Mark all read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all read.' });
  }
}

// DELETE /api/notifications/:id
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM notifications WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.error('[Notifications Controller] Delete notification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
}
