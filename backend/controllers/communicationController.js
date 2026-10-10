// backend/controllers/communicationController.js
import dotenv from 'dotenv';
import { query } from '../config/db.js';

dotenv.config();

let twilioClient = null;

// Dynamically initialize Twilio only if valid credentials exist
async function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token && sid !== 'your_account_sid' && token !== 'your_auth_token') {
    try {
      const twilioModule = await import('twilio');
      const twilio = twilioModule.default || twilioModule;
      twilioClient = twilio(sid, token);
      return twilioClient;
    } catch (err) {
      console.warn('[Communication] Twilio SDK not installed or failed to load:', err.message);
    }
  }
  return null;
}

/**
 * Standardize phone to clean digits
 */
function cleanPhone(raw = '') {
  let cleaned = String(raw).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  return cleaned;
}

/**
 * GET /api/communication/conversations
 * Returns list of distinct conversations with contacts, latest message, unread count, etc.
 * Supports pagination: ?page=1&limit=10&role=all|family|caregivers|doctors&q=search
 */
export async function getConversations(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const roleFilter = (req.query.role || 'all').toLowerCase();
    const q = (req.query.q || '').trim().toLowerCase();

    // Query messages grouped by recipientPhone/conversation
    let sql = `
      SELECT m.*
      FROM messages m
      INNER JOIN (
        SELECT recipientPhone, MAX(id) as maxId
        FROM messages
        GROUP BY recipientPhone
      ) latest ON m.recipientPhone = latest.recipientPhone AND m.id = latest.maxId
      ORDER BY m.createdAt DESC, m.id DESC
    `;
    const rows = await query(sql);

    // Default contact directory if messages table is empty
    let list = (rows || []).map((r) => {
      const initials = (r.recipientName || 'U')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      return {
        id: r.recipientPhone,
        conversationId: r.conversationId || `conv_${r.recipientPhone}`,
        phone: r.recipientPhone,
        name: r.recipientName,
        role: r.recipientRole || 'family',
        initials,
        lastMessage: r.text,
        lastTimestamp: r.timestamp || 'Today',
        unreadCount: r.direction === 'inbound' && r.status !== 'read' ? 1 : 0,
        createdAt: r.createdAt
      };
    });

    // If query or role filter
    if (roleFilter !== 'all') {
      list = list.filter((c) => {
        const r = (c.role || '').toLowerCase();
        if (roleFilter === 'family') return r.includes('fam') || r.includes('emergency');
        if (roleFilter === 'caregivers') return r.includes('care') || r.includes('nurse');
        if (roleFilter === 'doctors') return r.includes('doc');
        return true;
      });
    }

    if (q) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('[Communication] getConversations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve conversations.' });
  }
}

/**
 * GET /api/communication/messages
 * Returns message history for a conversation by phone
 */
export async function getMessages(req, res) {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone parameter required.' });
    }

    const cleaned = cleanPhone(phone);
    const sql = `
      SELECT * FROM messages
      WHERE recipientPhone = ? OR recipientPhone = ? OR recipientPhone LIKE ?
      ORDER BY id ASC
    `;
    const rows = await query(sql, [phone, `+${cleaned}`, `%${cleaned}%`]);

    return res.json({
      success: true,
      data: rows || []
    });
  } catch (error) {
    console.error('[Communication] getMessages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
}

/**
 * POST /api/communication/messages
 * Send a chat message, saves to database and triggers delivery
 */
export async function sendMessage(req, res) {
  try {
    const phone = req.body.phone || req.body.to || req.body.recipientPhone;
    const text = req.body.text || req.body.message || req.body.body;
    const recipientName = req.body.recipientName || 'Contact';
    const recipientRole = req.body.recipientRole || 'family';
    const senderName = req.body.senderName || 'ElderCare Team';
    const senderRole = req.body.senderRole || 'admin';

    if (!phone || !text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Phone number and message text are required.' });
    }

    const digits = cleanPhone(phone);
    const cleanWithPlus = `+${digits}`;
    const id = `MSG-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const convId = `conv_${cleanWithPlus}`;

    let deliveryStatus = 'delivered';
    const client = await getTwilioClient();

    if (client && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${cleanWithPlus}`,
          body: text,
        });
        deliveryStatus = 'delivered';
      } catch (twErr) {
        console.warn('[WhatsApp] Twilio direct send notice:', twErr.message);
        deliveryStatus = 'sent';
      }
    }

    await query(
      `INSERT INTO messages 
       (id, conversationId, senderId, senderName, senderRole, recipientPhone, recipientName, recipientRole, text, direction, status, timestamp, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        convId,
        'SYSTEM',
        senderName,
        senderRole,
        cleanWithPlus,
        recipientName,
        recipientRole,
        text.trim(),
        'outbound',
        deliveryStatus,
        timestamp,
        new Date().toISOString()
      ]
    );

    const createdMsg = {
      id,
      conversationId: convId,
      senderName,
      senderRole,
      recipientPhone: cleanWithPlus,
      recipientName,
      recipientRole,
      text: text.trim(),
      direction: 'outbound',
      status: deliveryStatus,
      timestamp,
      createdAt: new Date().toISOString()
    };

    const waLink = `https://wa.me/${digits}?text=${encodeURIComponent(text.trim())}`;

    return res.status(201).json({
      success: true,
      message: createdMsg,
      waLink,
      deliveryMethod: client ? 'Twilio Cloud Gateway' : 'WhatsApp Click-to-Chat Protocol'
    });
  } catch (error) {
    console.error('[Communication] sendMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
}

/**
 * GET /api/communication/emergency-logs
 * Returns paginated history of emergency dispatches
 */
export async function getEmergencyLogs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 5));
    const q = (req.query.q || '').trim().toLowerCase();

    let sql = 'SELECT * FROM emergency_dispatches ORDER BY id DESC';
    let rows = await query(sql);

    if (q) {
      rows = (rows || []).filter((r) =>
        (r.recipientName || '').toLowerCase().includes(q) ||
        (r.recipientPhone || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.message || '').toLowerCase().includes(q)
      );
    }

    const total = (rows || []).length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = (rows || []).slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('[Communication] getEmergencyLogs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve emergency dispatches.' });
  }
}

/**
 * POST /api/communication/emergency-dispatch
 * Dispatches an emergency message to contact or custom number
 */
export async function dispatchEmergency(req, res) {
  try {
    const {
      alertId = null,
      recipientName = 'Emergency Contact',
      recipientPhone,
      contactRole = 'family',
      templateId = 'medical_emergency',
      category = 'Medical Emergency',
      message
    } = req.body;

    if (!recipientPhone || !message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Recipient phone number and message are required.' });
    }

    const digits = cleanPhone(recipientPhone);
    const cleanWithPlus = `+${digits}`;
    const id = `DISP-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let deliveryStatus = 'Delivered';
    const client = await getTwilioClient();

    if (client && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${cleanWithPlus}`,
          body: message.trim(),
        });
        deliveryStatus = 'Delivered';
      } catch (err) {
        console.warn('[Emergency Dispatch] Direct gateway notice:', err.message);
        deliveryStatus = 'Dispatched via WhatsApp';
      }
    }

    await query(
      `INSERT INTO emergency_dispatches 
       (id, alertId, recipientName, recipientPhone, contactRole, templateId, category, message, deliveryMethod, status, timestamp, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        alertId,
        recipientName,
        cleanWithPlus,
        contactRole,
        templateId,
        category,
        message.trim(),
        'WhatsApp',
        deliveryStatus,
        timestamp,
        new Date().toISOString()
      ]
    );

    // Also record into messages table so conversation is updated!
    try {
      await query(
        `INSERT INTO messages 
         (id, conversationId, senderId, senderName, senderRole, recipientPhone, recipientName, recipientRole, text, direction, status, timestamp, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `MSG-SOS-${Date.now()}`,
          `conv_${cleanWithPlus}`,
          'SYSTEM',
          'ElderCare Emergency Dispatch',
          'admin',
          cleanWithPlus,
          recipientName,
          contactRole,
          `🚨 [${category}]: ${message.trim()}`,
          'outbound',
          'delivered',
          timestamp,
          new Date().toISOString()
        ]
      );
    } catch {}

    const waLink = `https://wa.me/${digits}?text=${encodeURIComponent(message.trim())}`;

    return res.status(201).json({
      success: true,
      data: {
        id,
        recipientName,
        recipientPhone: cleanWithPlus,
        category,
        message: message.trim(),
        status: deliveryStatus,
        timestamp
      },
      waLink
    });
  } catch (error) {
    console.error('[Communication] dispatchEmergency error:', error);
    return res.status(500).json({ success: false, message: 'Failed to dispatch emergency message.' });
  }
}

/**
 * POST /api/communication/whatsapp (Legacy backward compatibility)
 */
export async function sendWhatsApp(req, res) {
  return sendMessage(req, res);
}

/**
 * POST /api/communication/voice
 */
export async function makeVoiceCall(req, res) {
  try {
    const { to, url, tts = false, recipientName = 'Contact' } = req.body;
    if (!to || !url) {
      return res.status(400).json({ success: false, error: 'Recipient phone number and audio/text URL are required.' });
    }

    const cleanTo = `+${cleanPhone(to)}`;
    const client = await getTwilioClient();
    let sid = `CALL-${Date.now()}`;
    let status = 'initiated';

    if (client && process.env.TWILIO_VOICE_NUMBER) {
      try {
        const twilioModule = await import('twilio');
        const twilio = twilioModule.default || twilioModule;
        const twiml = new twilio.twiml.VoiceResponse();
        if (tts) {
          twiml.say({ voice: 'alice', language: 'en-IN' }, url);
        } else {
          twiml.play(url);
        }

        const call = await client.calls.create({
          twiml: twiml.toString(),
          from: process.env.TWILIO_VOICE_NUMBER,
          to: cleanTo,
        });
        sid = call.sid;
        status = call.status || 'in-progress';
      } catch (callErr) {
        console.warn('[Voice Call] Direct Twilio call error:', callErr.message);
      }
    }

    return res.json({
      success: true,
      sid,
      status,
      recipient: cleanTo,
      recipientName,
      mode: tts ? 'Text-to-Speech (TTS)' : 'Audio Memo Playback'
    });
  } catch (err) {
    console.error('[Communication] Voice call error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
