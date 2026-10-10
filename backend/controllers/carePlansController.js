import { query } from '../config/db.js';

function parseCarePlan(row) {
  let tasks = [];
  try {
    tasks = typeof row.tasks === 'string' ? JSON.parse(row.tasks) : (row.tasks || []);
  } catch {
    tasks = [];
  }
  return {
    ...row,
    tasks
  };
}

// GET /api/care-plans
export async function getCarePlans(req, res) {
  try {
    const { residentId } = req.query;
    let sql = 'SELECT * FROM care_plans ORDER BY id ASC';
    let params = [];

    if (residentId) {
      sql = 'SELECT * FROM care_plans WHERE residentId = ?';
      params = [residentId];
    }

    const rows = await query(sql, params);
    return res.json({ success: true, data: rows.map(parseCarePlan) });
  } catch (error) {
    console.error('[CarePlans Controller] Get care plans error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve care plans.' });
  }
}

// POST /api/care-plans
export async function createCarePlan(req, res) {
  try {
    const p = req.body;
    const id = p.id || `CP-${Date.now().toString().slice(-4)}`;
    const initials = p.initials || (p.patient ? p.patient.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() : 'CP');
    const tasks = Array.isArray(p.tasks) ? JSON.stringify(p.tasks) : '[]';

    await query(
      'INSERT INTO care_plans (id, patient, residentId, initials, goal, caregiver, reviewDate, progress, tasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        p.patient,
        p.residentId || null,
        initials,
        p.goal,
        p.caregiver || 'Priya Nair',
        p.reviewDate || 'In 7 days',
        Number(p.progress) || 0,
        tasks
      ]
    );

    const created = await query('SELECT * FROM care_plans WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({ success: true, data: parseCarePlan(created[0]) });
  } catch (error) {
    console.error('[CarePlans Controller] Create care plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create care plan.' });
  }
}

// PATCH /api/care-plans/:id/task
export async function toggleCarePlanTask(req, res) {
  try {
    const { id } = req.params;
    const { taskLabel } = req.body;

    const rows = await query('SELECT * FROM care_plans WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Care plan not found.' });
    }

    const plan = parseCarePlan(rows[0]);
    const updatedTasks = plan.tasks.map((task) => {
      if (task.label !== taskLabel) return task;
      return { ...task, done: !task.done };
    });

    const completedCount = updatedTasks.filter((t) => t.done).length;
    const newProgress = updatedTasks.length ? Math.round((completedCount / updatedTasks.length) * 100) : 0;

    await query(
      'UPDATE care_plans SET tasks = ?, progress = ? WHERE id = ?',
      [JSON.stringify(updatedTasks), newProgress, id]
    );

    const updated = await query('SELECT * FROM care_plans WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, data: parseCarePlan(updated[0]) });
  } catch (error) {
    console.error('[CarePlans Controller] Toggle task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle task.' });
  }
}

// DELETE /api/care-plans/:id
export async function deleteCarePlan(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM care_plans WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Care plan deleted.' });
  } catch (error) {
    console.error('[CarePlans Controller] Delete care plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete care plan.' });
  }
}
