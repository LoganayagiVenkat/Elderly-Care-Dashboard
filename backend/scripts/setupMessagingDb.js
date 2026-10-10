import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { getDatabaseConfig } from '../config/db.js';

dotenv.config();

export async function setupMessagingTables() {
  const config = getDatabaseConfig();
  const conn = await mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port,
    ssl: config.ssl,
    connectTimeout: 8000
  });

  console.log('[Messaging DB] Setting up messages & emergency_dispatches tables...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(50) PRIMARY KEY,
      conversationId VARCHAR(100),
      senderId VARCHAR(50),
      senderName VARCHAR(150),
      senderRole VARCHAR(50),
      recipientPhone VARCHAR(50) NOT NULL,
      recipientName VARCHAR(150),
      recipientRole VARCHAR(50),
      text TEXT NOT NULL,
      direction ENUM('inbound', 'outbound') DEFAULT 'outbound',
      status VARCHAR(50) DEFAULT 'delivered',
      timestamp VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_recipient (recipientPhone),
      INDEX idx_conv (conversationId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS emergency_dispatches (
      id VARCHAR(50) PRIMARY KEY,
      alertId VARCHAR(50),
      recipientName VARCHAR(150),
      recipientPhone VARCHAR(50),
      contactRole VARCHAR(50),
      templateId VARCHAR(50),
      category VARCHAR(100),
      message TEXT,
      deliveryMethod VARCHAR(50) DEFAULT 'WhatsApp',
      status VARCHAR(50) DEFAULT 'Delivered',
      timestamp VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed sample initial conversation history matching the reference mockup if table is empty
  const [msgCount] = await conn.query('SELECT COUNT(*) as count FROM messages');
  if (msgCount[0].count === 0) {
    console.log('[Messaging DB] Seeding initial conversations from mockup...');
    const seedMessages = [
      // 1. Radha Pillai (Family Member · +91 97890 44532)
      ['MSG-01', 'conv_+919789044532', 'FAM-RADHA', 'Radha Pillai', 'family', '+91 97890 44532', 'ElderCare Care Team', 'caregiver', 'Good morning!\nHow is my mother doing today?', 'inbound', 'delivered', '09:12 AM', new Date(Date.now() - 3600000 * 2).toISOString()],
      ['MSG-02', 'conv_+919789044532', 'USR-CG-01', 'Care Team', 'caregiver', '+91 97890 44532', 'Radha Pillai', 'family', 'Good morning, Radha Ma\'am!\nShe is doing well today. Her vital signs are normal and she had breakfast.', 'outbound', 'delivered', '09:15 AM', new Date(Date.now() - 3600000 * 1.8).toISOString()],
      ['MSG-03', 'conv_+919789044532', 'FAM-RADHA', 'Radha Pillai', 'family', '+91 97890 44532', 'ElderCare Care Team', 'caregiver', 'Great to hear. Has she taken her morning medicine?', 'inbound', 'delivered', '09:18 AM', new Date(Date.now() - 3600000 * 1.5).toISOString()],
      ['MSG-04', 'conv_+919789044532', 'USR-CG-01', 'Care Team', 'caregiver', '+91 97890 44532', 'Radha Pillai', 'family', 'Yes, she has taken all her scheduled medicines for today. Next dose is at 2:00 PM. You will receive a reminder.', 'outbound', 'delivered', '09:20 AM', new Date(Date.now() - 3600000 * 1.2).toISOString()],

      // 2. Arjun Sundaram (Emergency Contact · +91 98940 22011)
      ['MSG-05', 'conv_+919894022011', 'USR-CG-01', 'Care Team', 'caregiver', '+91 98940 22011', 'Arjun Sundaram', 'family', 'Morning mobility routine completed with Anitha Ma\'am. Pulse: 74 bpm.', 'outbound', 'delivered', '09:10 AM', new Date(Date.now() - 3600000 * 3).toISOString()],
      ['MSG-06', 'conv_+919894022011', 'FAM-ARJUN', 'Arjun Sundaram', 'family', '+91 98940 22011', 'Care Team', 'caregiver', 'Thank you for the update!', 'inbound', 'delivered', '09:15 AM', new Date(Date.now() - 3600000 * 2.8).toISOString()],

      // 3. Ramesh Devi (Family · +91 98410 22311)
      ['MSG-07', 'conv_+919841022311', 'FAM-RAMESH', 'Ramesh Devi', 'family', '+91 98410 22311', 'Care Team', 'caregiver', 'When is the next appointment?', 'inbound', 'delivered', 'Yesterday', new Date(Date.now() - 86400000).toISOString()],

      // 4. Care Team Group (+91 98400 11223)
      ['MSG-08', 'conv_+919840011223', 'CG-01', 'Care Team Group', 'caregiver', '+91 98400 11223', 'All Staff', 'caregiver', 'Nurse: Medicine round completed.', 'inbound', 'delivered', 'Yesterday', new Date(Date.now() - 86400000 * 1.2).toISOString()],

      // 5. Kavitha Raman (Family · +91 91234 55678)
      ['MSG-09', 'conv_+919123455678', 'FAM-KAVITHA', 'Kavitha Raman', 'family', '+91 91234 55678', 'Care Team', 'caregiver', 'Sure, we will be there.', 'inbound', 'delivered', '8 Oct', new Date(Date.now() - 86400000 * 2).toISOString()]
    ];

    for (const msg of seedMessages) {
      await conn.query(
        `INSERT INTO messages 
         (id, conversationId, senderId, senderName, senderRole, recipientPhone, recipientName, recipientRole, text, direction, status, timestamp, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        msg
      );
    }
  }

  // Seed initial emergency dispatches matching Page 2 of mockup
  const [dispCount] = await conn.query('SELECT COUNT(*) as count FROM emergency_dispatches');
  if (dispCount[0].count === 0) {
    console.log('[Messaging DB] Seeding initial emergency dispatches...');
    const seedDispatches = [
      ['DISP-SEED-01', 'SOS-101', 'Arjun Sundaram', '+91 98940 22011', 'family', 'medical_emergency', 'Medical Emergency', 'This is an emergency. Please call us immediately.', 'WhatsApp', 'Delivered', '10:25 AM', new Date().toISOString()],
      ['DISP-SEED-02', 'SOS-102', 'Dr. Meera', '+91 90031 44556', 'doctor', 'unresponsive', 'Unresponsive', 'Patient unresponsive. Need immediate assistance.', 'WhatsApp', 'Delivered', '08:14 AM', new Date().toISOString()],
      ['DISP-SEED-03', 'SOS-103', 'Ramesh Devi', '+91 98410 22311', 'family', 'fall_alert', 'Fall Alert', 'Fall alert: Patient has fallen. Assistance requested.', 'WhatsApp', 'Delivered', 'Yesterday', new Date(Date.now() - 86400000).toISOString()],
      ['DISP-SEED-04', 'SOS-104', 'Caregiver Team', '+91 94441 88900', 'caregiver', 'urgent_assistance', 'Urgent Assistance', 'Requesting immediate assistance in Room 3.', 'WhatsApp', 'Delivered', '8 Oct', new Date(Date.now() - 86400000 * 2).toISOString()]
    ];

    for (const disp of seedDispatches) {
      await conn.query(
        `INSERT INTO emergency_dispatches
         (id, alertId, recipientName, recipientPhone, contactRole, templateId, category, message, deliveryMethod, status, timestamp, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        disp
      );
    }
  }

  console.log('[Messaging DB] Messaging tables setup & seeding completed!');
  await conn.end();
}

if (process.argv[1]?.includes('setupMessagingDb.js')) {
  setupMessagingTables().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
