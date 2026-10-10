import { query } from '../config/db.js';

function parseSettings(row) {
  let toggles = { medication: true, appointment: true, health: true, emergency: true };
  try {
    if (row && row.toggles) {
      toggles = typeof row.toggles === 'string' ? JSON.parse(row.toggles) : row.toggles;
    }
  } catch {}

  return {
    language: row?.language || 'en',
    theme: row?.theme || 'light',
    colorTheme: row?.colorTheme || 'oceanic',
    toggles
  };
}

// GET /api/settings/:userId
export async function getSettings(req, res) {
  try {
    const { userId } = req.params;
    const rows = await query('SELECT * FROM user_settings WHERE userId = ? LIMIT 1', [userId]);
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          language: 'en',
          theme: 'light',
          colorTheme: 'oceanic',
          toggles: { medication: true, appointment: true, health: true, emergency: true }
        }
      });
    }
    return res.json({ success: true, data: parseSettings(rows[0]) });
  } catch (error) {
    console.error('[Settings Controller] Get settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
  }
}

// PUT /api/settings/:userId
export async function updateSettings(req, res) {
  try {
    const { userId } = req.params;
    const { language, theme, colorTheme, toggles } = req.body;
    const togglesStr = toggles ? JSON.stringify(toggles) : null;

    await query(`
      INSERT INTO user_settings (userId, language, theme, colorTheme, toggles)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        language = VALUES(language),
        theme = VALUES(theme),
        colorTheme = VALUES(colorTheme),
        toggles = VALUES(toggles)
    `, [userId, language || 'en', theme || 'light', colorTheme || 'oceanic', togglesStr]);

    const updated = await query('SELECT * FROM user_settings WHERE userId = ? LIMIT 1', [userId]);
    return res.json({ success: true, data: parseSettings(updated[0]) });
  } catch (error) {
    console.error('[Settings Controller] Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
}
