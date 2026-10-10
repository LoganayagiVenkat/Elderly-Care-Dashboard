import { processCareAssistantQuery } from '../services/residentCareAssistant.js';

// POST /api/chatbot - Database-Aware Resident Care Assistant
export async function handleChatQuery(req, res) {
  try {
    const { message, user, lang, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const resolvedUser = {
      role: req.headers['x-user-role'] || user?.role || 'admin',
      caregiverName: req.headers['x-user-caregiver-name'] || user?.caregiverName || user?.name || null,
      residentId: req.headers['x-user-resident-id'] || user?.residentId || null,
      name: user?.name || null,
      id: user?.id || null,
      ...user,
    };

    const result = await processCareAssistantQuery({
      message: message.trim(),
      user: resolvedUser,
      lang: lang || 'en',
      history: Array.isArray(history) ? history : [],
    });

    return res.json({
      success: true,
      reply: result.reply,
      detectedLang: result.detectedLang,
      residentId: result.residentId || null,
    });
  } catch (error) {
    console.error('[Chatbot Controller] Error:', error);
    return res.status(500).json({
      success: false,
      message: "I'm unable to retrieve the latest ElderCare records right now. Please try again.",
      reply: "I'm unable to retrieve the latest ElderCare records right now. Please try again.",
    });
  }
}
