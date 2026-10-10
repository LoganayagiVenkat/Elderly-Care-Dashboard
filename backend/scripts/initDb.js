import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { getDatabaseConfig } from '../config/db.js';
import { setupMessagingTables } from './setupMessagingDb.js';

dotenv.config();

export async function initDatabase() {
  const config = getDatabaseConfig();
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

  if (isProduction && !config.hasRemoteHost) {
    console.log('[DB Init] Skipping schema init: No remote MySQL database configured on Render.');
    return;
  }

  console.log(`[DB Init] Initializing schema for database \`${config.database}\` on ${config.host}:${config.port}...`);
  let conn = null;

  try {
    // 1. Direct connection to target database (works cleanly with cloud MySQL providers)
    conn = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      ssl: config.ssl,
      connectTimeout: 8000
    });
  } catch (directErr) {
    // If target database doesn't exist yet, attempt to create it
    if (directErr.code === 'ER_BAD_DB_ERROR') {
      try {
        console.log(`[DB Init] Database \`${config.database}\` does not exist. Creating...`);
        const rootConn = await mysql.createConnection({
          host: config.host,
          user: config.user,
          password: config.password,
          port: config.port,
          ssl: config.ssl,
          connectTimeout: 8000
        });
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await rootConn.end();

        conn = await mysql.createConnection({
          host: config.host,
          user: config.user,
          password: config.password,
          database: config.database,
          port: config.port,
          ssl: config.ssl,
          connectTimeout: 8000
        });
      } catch (rootErr) {
        throw new Error(`Failed to create or access database \`${config.database}\`: ${rootErr.message}`);
      }
    } else {
      throw directErr;
    }
  }

  console.log(`[DB Init] Connected. Ensuring tables in \`${config.database}\`...`);

  // 1. users
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150),
      role VARCHAR(50) NOT NULL,
      initials VARCHAR(10),
      title VARCHAR(100),
      caregiverName VARCHAR(150),
      familyId VARCHAR(50),
      residentId VARCHAR(50),
      relation VARCHAR(100),
      google_id VARCHAR(100),
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  try { await conn.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(100)"); } catch {}
  try { await conn.query("ALTER TABLE users ADD COLUMN avatar TEXT"); } catch {}

  // 2. residents
  await conn.query(`
    CREATE TABLE IF NOT EXISTS residents (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      initials VARCHAR(10),
      age INT,
      gender VARCHAR(20),
      status VARCHAR(50),
      room VARCHAR(100),
      caregiver VARCHAR(150),
      lastAssessment VARCHAR(100),
      \`condition\` TEXT,
      bloodGroup VARCHAR(10),
      admitted VARCHAR(100),
      emergencyContact TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. caregivers
  await conn.query(`
    CREATE TABLE IF NOT EXISTS caregivers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      initials VARCHAR(10),
      role VARCHAR(100),
      experience VARCHAR(50),
      assigned INT DEFAULT 0,
      availability VARCHAR(50),
      status VARCHAR(50),
      shift VARCHAR(100),
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4. medications
  await conn.query(`
    CREATE TABLE IF NOT EXISTS medications (
      id VARCHAR(50) PRIMARY KEY,
      time VARCHAR(50),
      slot VARCHAR(100),
      patient VARCHAR(150),
      patientId VARCHAR(50),
      initials VARCHAR(10),
      medicine VARCHAR(150),
      dosage VARCHAR(100),
      frequency VARCHAR(100) DEFAULT 'Once Daily',
      instructions TEXT,
      prescribedBy VARCHAR(150),
      startDate VARCHAR(50),
      endDate VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  try { await conn.query("ALTER TABLE medications ADD COLUMN frequency VARCHAR(100) DEFAULT 'Once Daily'"); } catch {}
  try { await conn.query("ALTER TABLE medications ADD COLUMN prescribedBy VARCHAR(150)"); } catch {}
  try { await conn.query("ALTER TABLE medications ADD COLUMN startDate VARCHAR(50)"); } catch {}
  try { await conn.query("ALTER TABLE medications ADD COLUMN endDate VARCHAR(50)"); } catch {}

  // 5. appointments
  await conn.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(50) PRIMARY KEY,
      date VARCHAR(50),
      time VARCHAR(50),
      patient VARCHAR(150),
      patientId VARCHAR(50),
      doctor VARCHAR(150),
      doctorId VARCHAR(50),
      type VARCHAR(150),
      specialty VARCHAR(100),
      reason TEXT,
      emergencyId VARCHAR(50),
      status VARCHAR(50) DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  try { await conn.query("ALTER TABLE appointments ADD COLUMN doctorId VARCHAR(50)"); } catch {}
  try { await conn.query("ALTER TABLE appointments ADD COLUMN specialty VARCHAR(100)"); } catch {}
  try { await conn.query("ALTER TABLE appointments ADD COLUMN reason TEXT"); } catch {}
  try { await conn.query("ALTER TABLE appointments ADD COLUMN emergencyId VARCHAR(50)"); } catch {}
  try { await conn.query("ALTER TABLE appointments ADD UNIQUE KEY uq_appt_emergencyId (emergencyId)"); } catch {}
  try { await conn.query("ALTER TABLE appointments ADD COLUMN followup_required VARCHAR(50) DEFAULT 'Not Required'"); } catch {}
  try { await conn.query("ALTER TABLE appointments ADD COLUMN followup_status VARCHAR(50) DEFAULT 'None'"); } catch {}
  try { await conn.query("ALTER TABLE appointments ADD COLUMN followup_notes TEXT"); } catch {}

  // 6. care_plans
  await conn.query(`
    CREATE TABLE IF NOT EXISTS care_plans (
      id VARCHAR(50) PRIMARY KEY,
      patient VARCHAR(150),
      residentId VARCHAR(50),
      initials VARCHAR(10),
      goal TEXT,
      caregiver VARCHAR(150),
      reviewDate VARCHAR(50),
      progress INT DEFAULT 0,
      tasks LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 7. emergency_alerts
  await conn.query(`
    CREATE TABLE IF NOT EXISTS emergency_alerts (
      id VARCHAR(50) PRIMARY KEY,
      residentId VARCHAR(50),
      residentName VARCHAR(150),
      room VARCHAR(100),
      \`condition\` TEXT,
      bloodGroup VARCHAR(10),
      caregiver VARCHAR(150),
      emergencyContact TEXT,
      emergencyType VARCHAR(150),
      notes TEXT,
      severity VARCHAR(50) DEFAULT 'CRITICAL',
      status VARCHAR(50) DEFAULT 'active',
      timestamp VARCHAR(100),
      createdAt VARCHAR(100),
      senderRole VARCHAR(50),
      senderName VARCHAR(150),
      respondedBy VARCHAR(150),
      respondedAt VARCHAR(100),
      resolvedAt VARCHAR(100),
      specialty VARCHAR(100),
      appointmentId VARCHAR(50),
      care_record_id VARCHAR(50),
      voiceMailAudio LONGTEXT,
      voiceDuration INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  try { await conn.query("ALTER TABLE emergency_alerts ADD COLUMN specialty VARCHAR(100)"); } catch {}
  try { await conn.query("ALTER TABLE emergency_alerts ADD COLUMN appointmentId VARCHAR(50)"); } catch {}
  try { await conn.query("ALTER TABLE emergency_alerts ADD COLUMN care_record_id VARCHAR(50)"); } catch {}
  try { await conn.query("ALTER TABLE emergency_alerts ADD COLUMN voiceMailAudio LONGTEXT"); } catch {}
  try { await conn.query("ALTER TABLE emergency_alerts ADD COLUMN voiceDuration INT DEFAULT 0"); } catch {}

  // 8. health_vitals
  await conn.query(`
    CREATE TABLE IF NOT EXISTS health_vitals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      residentId VARCHAR(50) NOT NULL,
      heartRate INT,
      systolic INT,
      diastolic INT,
      spO2 INT,
      glucose INT,
      status VARCHAR(50) DEFAULT 'Normal',
      recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 9. activities
  await conn.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      icon VARCHAR(100),
      type VARCHAR(100),
      schedule VARCHAR(100),
      duration VARCHAR(50),
      facilitator VARCHAR(150),
      participants INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 10. documents
  await conn.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      patient VARCHAR(150),
      residentId VARCHAR(50),
      date VARCHAR(100),
      status VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 11. notifications
  await conn.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(50) PRIMARY KEY,
      type VARCHAR(50),
      title VARCHAR(255),
      time VARCHAR(100),
      patient VARCHAR(150),
      residentId VARCHAR(50),
      detail TEXT,
      \`desc\` TEXT,
      group_name VARCHAR(50) DEFAULT 'today',
      is_read TINYINT(1) DEFAULT 0,
      actionable TINYINT(1) DEFAULT 0,
      senderRole VARCHAR(50),
      emergencyId VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 12. user_settings
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      userId VARCHAR(50) PRIMARY KEY,
      language VARCHAR(20) DEFAULT 'en',
      theme VARCHAR(20) DEFAULT 'light',
      colorTheme VARCHAR(50) DEFAULT 'oceanic',
      toggles LONGTEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 13. care_records (Complete chronological history per resident)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS care_records (
      record_id VARCHAR(50) PRIMARY KEY,
      resident_id VARCHAR(50) NOT NULL,
      date VARCHAR(50) NOT NULL,
      time VARCHAR(50) NOT NULL,
      blood_pressure VARCHAR(50) NOT NULL,
      temperature VARCHAR(50) NOT NULL,
      weight VARCHAR(50) NOT NULL,
      observation VARCHAR(100) NOT NULL,
      notes TEXT NOT NULL,
      recorded_by VARCHAR(150) NOT NULL,
      record_type VARCHAR(100) DEFAULT 'Routine Round',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_resident_created (resident_id, created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 14. specialists (Registered medical doctors/specialists directory)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS specialists (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      specialty VARCHAR(100) NOT NULL,
      title VARCHAR(100),
      experience VARCHAR(50),
      availability VARCHAR(50) DEFAULT 'Available',
      available_slots TEXT,
      phone VARCHAR(50),
      hospital VARCHAR(150),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 15. issue_specialist_mappings (Configurable mapping from reported issue to medical specialty)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS issue_specialist_mappings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      issue_type VARCHAR(100) UNIQUE NOT NULL,
      specialty VARCHAR(100) NOT NULL,
      specialist_title VARCHAR(100) NOT NULL,
      default_severity VARCHAR(50) DEFAULT 'HIGH'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 16. specialist_availability (Weekly recurring availability schedule per doctor)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS specialist_availability (
      id VARCHAR(50) PRIMARY KEY,
      doctor_id VARCHAR(50) NOT NULL,
      doctor_name VARCHAR(150) NOT NULL,
      specialty VARCHAR(100) NOT NULL,
      day_of_week VARCHAR(20) NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      slot_duration_minutes INT DEFAULT 30,
      status VARCHAR(20) DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_doc_day (doctor_id, day_of_week)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 17. voicemails
  await conn.query(`
    CREATE TABLE IF NOT EXISTS voicemails (
      id VARCHAR(50) PRIMARY KEY,
      residentId VARCHAR(50),
      residentName VARCHAR(150),
      senderName VARCHAR(150) NOT NULL,
      senderRole VARCHAR(50) NOT NULL,
      recipientName VARCHAR(150),
      recipientRole VARCHAR(50),
      category VARCHAR(50) DEFAULT 'general',
      subject VARCHAR(200),
      duration INT DEFAULT 0,
      audioUrl LONGTEXT,
      notes TEXT,
      emergencyId VARCHAR(50),
      isRead TINYINT(1) DEFAULT 0,
      createdAt VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 18. messages (Chat messaging & WhatsApp history)
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

  // 19. emergency_dispatches (Emergency alert messages history)
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

  console.log('[DB Init] All tables created successfully.');

  // Check and Seed Initial Data
  await seedInitialData(conn);

  await conn.end();
  console.log('[DB Init] Database initialization complete!');
}

async function seedInitialData(conn) {
  // Seed Users (Ensure all 6 verified role accounts exist)
  console.log('[DB Init] Verifying 6 system user accounts...');
  const seedUsers = [
    ['USR-ADMIN-01', 'admin', 'admin', 'Meera Krishnan', 'admin@eldercare.demo', 'admin', 'MK', 'System Administrator', null, null, null, null],
    ['USR-CG-01', 'caregiver', 'caregiver', 'Priya Nair', 'caregiver@eldercare.demo', 'caregiver', 'PN', 'Senior Caregiver', 'Priya Nair', null, null, null],
    ['USR-CG-02', 'anand', 'anand', 'Anand Raj', 'anand.raj@eldercare.demo', 'caregiver', 'AR', 'Physiotherapy & Mobility Caregiver', 'Anand Raj', null, null, null],
    ['USR-FAM-01', 'family', 'family', 'Ramesh Devi', 'family@eldercare.demo', 'family', 'RD', 'Family Member', null, 'FAM-001', 'EC-001', 'Son'],
    ['USR-PAT-01', 'patient', 'patient', 'Lakshmi Devi', 'patient@eldercare.demo', 'patient', 'LD', 'Resident', null, null, 'EC-001', null],
    ['USR-DOC-01', 'doctor', 'doctor', 'Dr. Arun Ramanathan', 'dr.arun@eldercare.demo', 'doctor', 'AR', 'Chief Medical Officer & Cardiologist', null, null, null, null]
  ];
  for (const u of seedUsers) {
    const [existing] = await conn.query('SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1', [u[1]]);
    if (!existing || existing.length === 0) {
      await conn.query(
        'INSERT INTO users (id, username, password, name, email, role, initials, title, caregiverName, familyId, residentId, relation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        u
      );
    }
  }

  // Seed Residents
  const [resCount] = await conn.query('SELECT COUNT(*) as count FROM residents');
  if (resCount[0].count === 0) {
    console.log('[DB Init] Seeding residents...');
    const residents = [
      ['EC-001', 'Lakshmi Devi', 'LD', 78, 'Female', 'stable', 'Willow Room 4', 'Priya Nair', 'Yesterday, 10:30 AM', 'Hypertension, Mild Arthritis', 'B+', '12 Jan 2024', 'Ramesh Devi · Son · +91 98410 22311', 'Prefers morning walks. Follows a low-sodium diet plan.'],
      ['EC-002', 'Meenakshi Raman', 'MR', 82, 'Female', 'attention', 'Sage Room 2', 'Anand Raj', '2 days ago', 'Vitamin D Deficiency, Osteoporosis', 'O+', '03 Mar 2023', 'Kavitha Raman · Daughter · +91 90031 55210', 'Requires assistance with mobility. Uses a walking frame.'],
      ['EC-003', 'Raghavan Kumar', 'RK', 75, 'Male', 'stable', 'Willow Room 1', 'Deepa Suresh', 'Today, 09:00 AM', 'Type 2 Diabetes', 'A+', '22 Jul 2022', 'Suresh Kumar · Son · +91 99400 11876', 'Monitors blood sugar twice daily. Enjoys gardening activities.'],
      ['EC-004', 'Subramaniam Iyer', 'SI', 80, 'Male', 'critical', 'Sage Room 5', 'Anand Raj', 'Today, 07:15 AM', 'Cardiac Arrhythmia, High Cholesterol', 'AB+', '09 Sep 2021', 'Lakshmi Iyer · Wife · +91 94440 76321', 'Under close cardiac monitoring. On statin therapy.'],
      ['EC-005', 'Anitha Sundaram', 'AS', 71, 'Female', 'stable', 'Willow Room 6', 'Deepa Suresh', '3 days ago', 'Mild Cognitive Decline', 'B-', '14 Nov 2024', 'Arjun Sundaram · Son · +91 98940 22011', 'Participates actively in memory-care activities and music therapy.'],
      ['EC-006', 'Govind Pillai', 'GP', 84, 'Male', 'attention', 'Sage Room 1', 'Priya Nair', 'Yesterday, 04:00 PM', 'Chronic Kidney Disease Stage 2', 'O-', '30 May 2023', 'Radha Pillai · Daughter · +91 97890 44532', 'Fluid intake closely monitored. Weekly nephrology review.']
    ];
    for (const r of residents) {
      await conn.query(
        'INSERT INTO residents (id, name, initials, age, gender, status, room, caregiver, lastAssessment, `condition`, bloodGroup, admitted, emergencyContact, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        r
      );
    }
  }

  // Seed Caregivers
  const [cgCount] = await conn.query('SELECT COUNT(*) as count FROM caregivers');
  if (cgCount[0].count === 0) {
    console.log('[DB Init] Seeding caregivers...');
    const caregivers = [
      ['CG-01', 'Priya Nair', 'PN', 'Senior Caregiver', '9 years', 2, 'On Duty', 'active', 'Morning · 7:00 AM – 3:00 PM', '+91 98400 11223'],
      ['CG-02', 'Anand Raj', 'AR', 'Care Assistant', '4 years', 2, 'On Duty', 'active', 'Morning · 7:00 AM – 3:00 PM', '+91 90441 88732'],
      ['CG-03', 'Deepa Suresh', 'DS', 'Care Assistant', '6 years', 2, 'On Duty', 'active', 'Afternoon · 3:00 PM – 11:00 PM', '+91 93450 22187'],
      ['CG-04', 'Vikram Menon', 'VM', 'Registered Nurse', '11 years', 6, 'On Call', 'active', 'Night · 11:00 PM – 7:00 AM', '+91 99870 65410'],
      ['CG-05', 'Kavitha Reddy', 'KR', 'Physiotherapist', '7 years', 4, 'Off Duty', 'inactive', 'Visits · Tue, Thu, Sat', '+91 91234 55678'],
      ['CG-06', 'Suresh Babu', 'SB', 'Care Coordinator', '13 years', 6, 'On Duty', 'active', 'Morning · 8:00 AM – 4:00 PM', '+91 96780 34521']
    ];
    for (const c of caregivers) {
      await conn.query(
        'INSERT INTO caregivers (id, name, initials, role, experience, assigned, availability, status, shift, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        c
      );
    }
  }

  // Seed Medications (Comprehensive medication profiles for ALL residents)
  const [medCount] = await conn.query('SELECT COUNT(*) as count FROM medications');
  const [hasMetformin] = await conn.query("SELECT COUNT(*) as count FROM medications WHERE medicine = 'Metformin' AND patientId = 'EC-005'");
  if (medCount[0].count < 60 || hasMetformin[0].count === 0) {
    console.log('[DB Init] Seeding comprehensive medications (10 per resident) for ALL residents...');
    // Clear old sparse rows to seed full multi-slot schedules
    await conn.query('DELETE FROM medications');
    const meds = [
      // EC-001 (Lakshmi Devi) - 10 Medications
      ['MED-LD-01', '07:00 AM', 'Morning Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Pantoprazole', '40 mg', 'Once Daily (Fasting)', 'Take 30 minutes before breakfast to prevent gastric acidity.', 'Dr. Preeti Deshmukh', '2026-01-10', '2026-12-31', 'completed'],
      ['MED-LD-02', '08:00 AM', 'Morning Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Amlodipine', '5 mg', 'Once Daily', 'Take with water after breakfast to control blood pressure.', 'Dr. Kavya Menon', '2026-01-10', '2026-12-31', 'completed'],
      ['MED-LD-03', '08:30 AM', 'Morning Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Telmisartan', '40 mg', 'Once Daily', 'Take after breakfast for 24-hour BP stabilization.', 'Dr. Kavya Menon', '2026-01-10', '2026-12-31', 'completed'],
      ['MED-LD-04', '09:00 AM', 'Morning Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Hydrochlorothiazide', '12.5 mg', 'Once Daily', 'Diuretic for synergistic blood pressure regulation.', 'Dr. Kavya Menon', '2026-02-01', '2026-12-31', 'completed'],
      ['MED-LD-05', '01:30 PM', 'Afternoon Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Paracetamol', '650 mg', 'As Needed', 'Take after lunch for joint and knee pain relief.', 'Dr. Sunita Bhatt', '2026-02-01', '2026-06-30', 'pending'],
      ['MED-LD-06', '02:00 PM', 'Afternoon Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Glucosamine Chondroitin', '500 mg', 'Once Daily', 'Joint cartilage support. Take with plenty of water.', 'Dr. Rajesh Sharma', '2026-01-15', '2026-12-31', 'pending'],
      ['MED-LD-07', '03:30 PM', 'Afternoon Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Diclofenac Gel', '1% w/w', 'Twice Daily (Topical)', 'Apply gently on both knee joints. Do not massage vigorously.', 'Dr. Rajesh Sharma', '2026-02-15', '2026-12-31', 'completed'],
      ['MED-LD-08', '08:30 PM', 'Evening Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Atorvastatin', '10 mg', 'Once Daily', 'Take after dinner for cholesterol control and vascular protection.', 'Dr. Kavya Menon', '2026-01-10', '2026-12-31', 'upcoming'],
      ['MED-LD-09', '09:30 PM', 'Night Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Calcium + Vitamin D3', '500 mg', 'Once Daily', 'Take with warm milk before bed for bone strength.', 'Dr. Sunita Bhatt', '2026-01-10', '2026-12-31', 'upcoming'],
      ['MED-LD-10', '10:00 PM', 'Night Medication', 'Lakshmi Devi', 'EC-001', 'LD', 'Methylcobalamin (B12)', '1500 mcg', 'Once Daily', 'Nerve health and peripheral neuropathy support before sleep.', 'Dr. Sunita Bhatt', '2026-01-10', '2026-12-31', 'upcoming'],

      // EC-002 (Meenakshi Raman) - 10 Medications
      ['MED-MR-01', '07:30 AM', 'Morning Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Alendronate Sodium', '70 mg', 'Once Weekly', 'Take fasting with full glass of water. Do not lie down for 30 mins.', 'Dr. Sunita Bhatt', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-MR-02', '08:30 AM', 'Morning Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Calcium Carbonate', '600 mg', 'Twice Daily', 'Take with morning breakfast for bone density recovery.', 'Dr. Sunita Bhatt', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-MR-03', '09:15 AM', 'Morning Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Teriparatide Subcutaneous', '20 mcg', 'Once Daily', 'Subcutaneous injection for advanced osteoporosis bone building.', 'Dr. Rajesh Sharma', '2026-02-01', '2026-12-31', 'completed'],
      ['MED-MR-04', '10:00 AM', 'Morning Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Collagen Peptides', '10 g', 'Once Daily', 'Dissolve in water/juice for tendon and joint structural support.', 'Dr. Rajesh Sharma', '2026-01-15', '2026-12-31', 'completed'],
      ['MED-MR-05', '01:00 PM', 'Afternoon Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Vitamin D3 (Cholecalciferol)', '60,000 IU', 'Once Weekly', 'Take with lunch for severe vitamin D deficiency replenishment.', 'Dr. Sunita Bhatt', '2026-01-01', '2026-12-31', 'pending'],
      ['MED-MR-06', '02:00 PM', 'Afternoon Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Calcitriol', '0.25 mcg', 'Once Daily', 'Promotes active intestinal calcium absorption and bone mineral uptake.', 'Dr. Arvind Rao', '2026-01-15', '2026-12-31', 'pending'],
      ['MED-MR-07', '03:00 PM', 'Afternoon Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Paracetamol', '500 mg', 'As Needed', 'Mild analgesic for physiotherapy aches and walking mobility comfort.', 'Dr. Sunita Bhatt', '2026-02-01', '2026-06-30', 'pending'],
      ['MED-MR-08', '07:30 PM', 'Evening Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Calcium Carbonate', '600 mg', 'Twice Daily', 'Evening dose. Take with dinner for continuous calcium absorption.', 'Dr. Sunita Bhatt', '2026-01-01', '2026-12-31', 'upcoming'],
      ['MED-MR-09', '09:00 PM', 'Night Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Methylcobalamin (B12)', '1500 mcg', 'Once Daily', 'Take at bedtime for nerve strength, balance, and fall prevention.', 'Dr. Sunita Bhatt', '2026-01-01', '2026-12-31', 'upcoming'],
      ['MED-MR-10', '09:30 PM', 'Night Medication', 'Meenakshi Raman', 'EC-002', 'MR', 'Magnesium Glycinate', '250 mg', 'Once Daily', 'Supports bone matrix mineralization and eases nocturnal muscle cramps.', 'Dr. Rajesh Sharma', '2026-01-10', '2026-12-31', 'upcoming'],

      // EC-003 (Raghavan Kumar) - 10 Medications
      ['MED-RK-01', '07:45 AM', 'Morning Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Glimepiride', '1 mg', 'Once Daily', 'Take 15 mins before breakfast for fasting glycemic control.', 'Dr. Arvind Rao', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-RK-02', '08:00 AM', 'Morning Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Dapagliflozin', '10 mg', 'Once Daily', 'SGLT2 inhibitor for glucose excretion and cardio-renal benefit.', 'Dr. Arvind Rao', '2026-01-10', '2026-12-31', 'completed'],
      ['MED-RK-03', '08:30 AM', 'Morning Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Metformin (SR)', '500 mg', 'Twice Daily', 'Take with breakfast. Do not chew or crush sustained-release tablet.', 'Dr. Arvind Rao', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-RK-04', '09:00 AM', 'Morning Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Telmisartan', '20 mg', 'Once Daily', 'Renal-protective BP agent to prevent diabetic microalbuminuria.', 'Dr. Kavya Menon', '2026-01-10', '2026-12-31', 'completed'],
      ['MED-RK-05', '01:00 PM', 'Afternoon Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Vildagliptin', '50 mg', 'Once Daily', 'Post-lunch glycemic control. Check blood glucose if dizzy.', 'Dr. Arvind Rao', '2026-01-01', '2026-12-31', 'pending'],
      ['MED-RK-06', '02:30 PM', 'Afternoon Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Carboxymethylcellulose Eye Drops', '0.5% w/v', 'Three times daily', '1 drop in both eyes for diabetic dry eye relief.', 'Dr. Meenakshi Iyer', '2026-02-01', '2026-12-31', 'pending'],
      ['MED-RK-07', '08:00 PM', 'Evening Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Metformin (SR)', '500 mg', 'Twice Daily', 'Second dose. Take with dinner for nocturnal glucose control.', 'Dr. Arvind Rao', '2026-01-01', '2026-12-31', 'upcoming'],
      ['MED-RK-08', '09:15 PM', 'Night Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Fenofibrate', '160 mg', 'Once Daily', 'For lipid and triglyceride balance in diabetic profile.', 'Dr. Kavya Menon', '2026-01-10', '2026-12-31', 'upcoming'],
      ['MED-RK-09', '09:45 PM', 'Night Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Alpha Lipoic Acid', '100 mg', 'Once Daily', 'Diabetic neuropathy support and antioxidant cellular protection.', 'Dr. Arvind Rao', '2026-01-10', '2026-12-31', 'upcoming'],
      ['MED-RK-10', '10:00 PM', 'Night Medication', 'Raghavan Kumar', 'EC-003', 'RK', 'Pregabalin', '75 mg', 'Once Daily', 'Take at bedtime for diabetic neuropathic foot burning/tingling.', 'Dr. Sunita Bhatt', '2026-01-15', '2026-12-31', 'upcoming'],

      // EC-004 (Subramaniam Iyer) - 10 Medications
      ['MED-SI-01', '07:30 AM', 'Morning Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Furosemide', '20 mg', 'Once Daily', 'Take early morning to prevent fluid overload and heart strain.', 'Dr. Kavya Menon', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-SI-02', '08:00 AM', 'Morning Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Metoprolol Succinate', '25 mg', 'Once Daily', 'Take with breakfast to control heart rate and prevent arrhythmia.', 'Dr. Kavya Menon', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-SI-03', '08:30 AM', 'Morning Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Clopidogrel', '75 mg', 'Once Daily', 'Dual antiplatelet coverage for coronary artery patency.', 'Dr. Kavya Menon', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-SI-04', '08:45 AM', 'Morning Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Ecosprin (Aspirin)', '75 mg', 'Once Daily', 'Cardioprotective antiplatelet. Take strictly after meal.', 'Dr. Kavya Menon', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-SI-05', '01:00 PM', 'Afternoon Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Potassium Chloride (Potklor)', '10 ml', 'Once Daily', 'Dilute in water after lunch to replenish diuretic potassium loss.', 'Dr. Kavya Menon', '2026-01-15', '2026-12-31', 'pending'],
      ['MED-SI-06', '02:00 PM', 'Afternoon Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Digoxin', '0.125 mg', 'Once Daily', 'Cardiac rhythm maintenance. Caregiver must check pulse before administering.', 'Dr. Kavya Menon', '2026-01-15', '2026-12-31', 'pending'],
      ['MED-SI-07', '04:00 PM', 'Afternoon Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Sorbitrate (Isosorbide Dinitrate)', '5 mg', 'As Needed (Sublingual)', 'Keep by bedside. Dissolve under tongue if chest tightness occurs.', 'Dr. Kavya Menon', '2026-01-01', '2026-12-31', 'pending'],
      ['MED-SI-08', '07:30 PM', 'Evening Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Ramipril', '2.5 mg', 'Once Daily', 'Cardiovascular ACE-inhibitor for ventricular remodeling and BP.', 'Dr. Kavya Menon', '2026-01-01', '2026-12-31', 'upcoming'],
      ['MED-SI-09', '09:00 PM', 'Night Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Atorvastatin', '20 mg', 'Once Daily', 'Take at bedtime for plaque stabilization and cholesterol control.', 'Dr. Kavya Menon', '2026-01-01', '2026-12-31', 'upcoming'],
      ['MED-SI-10', '09:30 PM', 'Night Medication', 'Subramaniam Iyer', 'EC-004', 'SI', 'Omega-3 Marine Triglycerides', '1000 mg', 'Once Daily', 'Arterial compliance and anti-inflammatory cardiac lipid support.', 'Dr. Kavya Menon', '2026-01-15', '2026-12-31', 'upcoming'],

      // EC-005 (Anitha Sundaram) - 10 Medications
      ['MED-AS-01', '08:00 AM', 'Morning Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Donepezil', '5 mg', 'Once Daily', 'Take with morning breakfast for cognitive support and memory function.', 'Dr. M. Verma', '2026-01-15', '2026-12-31', 'completed'],
      ['MED-AS-02', '08:30 AM', 'Morning Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Amlodipine', '5 mg', 'Once Daily', 'Take with water after breakfast to control BP.', 'Dr. K. Ramesh', '2026-01-01', '2026-12-31', 'completed'],
      ['MED-AS-03', '08:45 AM', 'Morning Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Coenzyme Q10 (Ubiquinol)', '100 mg', 'Once Daily', 'Mitochondrial antioxidant booster for neuro-cellular energy.', 'Dr. K. Ramesh', '2026-01-15', '2026-12-31', 'completed'],
      ['MED-AS-04', '09:00 AM', 'Morning Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Memantine', '5 mg', 'Once Daily', 'NMDA receptor antagonist for memory retention and cognitive focus.', 'Dr. M. Verma', '2026-02-01', '2026-12-31', 'completed'],
      ['MED-AS-05', '01:00 PM', 'Afternoon Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Metformin', '500 mg', 'Twice Daily', 'Take with lunch for blood glucose stabilization.', 'Dr. S. Priya', '2026-01-01', '2026-12-31', 'pending'],
      ['MED-AS-06', '02:00 PM', 'Afternoon Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Ginkgo Biloba', '120 mg', 'Once Daily', 'Cerebral microvascular circulation and oxygenation support.', 'Dr. Sunita Bhatt', '2026-02-01', '2026-12-31', 'pending'],
      ['MED-AS-07', '03:00 PM', 'Afternoon Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Citicoline', '500 mg', 'Once Daily', 'Neuroprotective agent for brain phospholipid synthesis and recall.', 'Dr. Sunita Bhatt', '2026-02-15', '2026-12-31', 'pending'],
      ['MED-AS-08', '07:30 PM', 'Evening Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Vitamin D', '1000 IU', 'Once Daily', 'Take after dinner for neuro-endocrine wellness.', 'Dr. K. Ramesh', '2026-02-01', '2026-12-31', 'upcoming'],
      ['MED-AS-09', '08:30 PM', 'Evening Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Ashwagandha Extract', '300 mg', 'Once Daily', 'Natural botanical adaptogen for evening calm and anxiety ease.', 'Dr. M. Verma', '2026-02-01', '2026-12-31', 'upcoming'],
      ['MED-AS-10', '09:30 PM', 'Night Medication', 'Anitha Sundaram', 'EC-005', 'AS', 'Melatonin', '3 mg', 'Once Daily', 'Take 30 mins before bedtime for healthy circadian rhythm.', 'Dr. M. Verma', '2026-01-10', '2026-12-31', 'upcoming'],

      // EC-006 (Govind Pillai) - 10 Medications
      ['MED-GP-01', '08:00 AM', 'Morning Medication', 'Govind Pillai', 'EC-006', 'GP', 'Sodium Bicarbonate', '500 mg', 'Twice Daily', 'Alkalinizing agent for metabolic acid balance. Take with morning water.', 'Dr. Arvind Rao', '2026-02-01', '2026-12-31', 'completed'],
      ['MED-GP-02', '08:30 AM', 'Morning Medication', 'Govind Pillai', 'EC-006', 'GP', 'Torsemide', '10 mg', 'Once Daily', 'Diuretic for renal fluid management and peripheral edema control.', 'Dr. Arvind Rao', '2026-02-01', '2026-12-31', 'completed'],
      ['MED-GP-03', '09:00 AM', 'Morning Medication', 'Govind Pillai', 'EC-006', 'GP', 'Folic Acid', '5 mg', 'Once Daily', 'Supports erythropoiesis and repairs renal nutritional deficiency.', 'Dr. Arvind Rao', '2026-02-01', '2026-12-31', 'completed'],
      ['MED-GP-04', '10:00 AM', 'Morning Medication', 'Govind Pillai', 'EC-006', 'GP', 'Erythropoietin (EPO)', '4000 IU', 'Once Weekly', 'Subcutaneous injection for CKD normocytic anemia management.', 'Dr. Arvind Rao', '2026-01-15', '2026-12-31', 'completed'],
      ['MED-GP-05', '01:00 PM', 'Afternoon Medication', 'Govind Pillai', 'EC-006', 'GP', 'Sevelamer Carbonate', '800 mg', 'Twice Daily', 'Phosphate binder. Must be swallowed whole with lunch.', 'Dr. Arvind Rao', '2026-02-01', '2026-12-31', 'pending'],
      ['MED-GP-06', '01:30 PM', 'Afternoon Medication', 'Govind Pillai', 'EC-006', 'GP', 'Ketoanalogs of Amino Acids', '600 mg', 'Three times daily', 'Protects residual nephron capacity during low-protein renal diet.', 'Dr. Arvind Rao', '2026-02-15', '2026-12-31', 'pending'],
      ['MED-GP-07', '02:30 PM', 'Afternoon Medication', 'Govind Pillai', 'EC-006', 'GP', 'Iron Supplement (Ferrous Ascorbate)', '100 mg', 'Once Daily', 'Take 2 hours after food with water. Avoid dairy products.', 'Dr. Arvind Rao', '2026-02-01', '2026-12-31', 'pending'],
      ['MED-GP-08', '08:00 PM', 'Evening Medication', 'Govind Pillai', 'EC-006', 'GP', 'Sevelamer Carbonate', '800 mg', 'Twice Daily', 'Second dose. Phosphate binder with evening dinner.', 'Dr. Arvind Rao', '2026-02-01', '2026-12-31', 'upcoming'],
      ['MED-GP-09', '09:00 PM', 'Night Medication', 'Govind Pillai', 'EC-006', 'GP', 'Febuxostat', '40 mg', 'Once Daily', 'Serum uric acid reduction for nephroprotection and gout prevention.', 'Dr. Arvind Rao', '2026-02-01', '2026-12-31', 'upcoming'],
      ['MED-GP-10', '09:30 PM', 'Night Medication', 'Govind Pillai', 'EC-006', 'GP', 'Sodium Bicarbonate', '500 mg', 'Twice Daily', 'Night dose with water for overnight metabolic acid balance.', 'Dr. Arvind Rao', '2026-02-01', '2026-12-31', 'upcoming']
    ];
    for (const m of meds) {
      await conn.query(
        'INSERT INTO medications (id, time, slot, patient, patientId, initials, medicine, dosage, frequency, instructions, prescribedBy, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        m
      );
    }
  }

  // Seed Appointments
  const [apptCount] = await conn.query('SELECT COUNT(*) as count FROM appointments');
  if (apptCount[0].count === 0) {
    console.log('[DB Init] Seeding appointments...');
    const todayStr = new Date().toISOString().split('T')[0];
    const appts = [
      ['AP-01', todayStr, '09:30 AM', 'Lakshmi Devi', 'EC-001', 'Dr. Kavya Menon', 'Cardiology Review', 'confirmed'],
      ['AP-02', todayStr, '11:00 AM', 'Govind Pillai', 'EC-006', 'Dr. Arvind Rao', 'Nephrology Checkup', 'confirmed'],
      ['AP-03', todayStr, '02:30 PM', 'Subramaniam Iyer', 'EC-004', 'Dr. Kavya Menon', 'Cardiac Monitoring', 'pending'],
      ['AP-04', todayStr, '10:00 AM', 'Meenakshi Raman', 'EC-002', 'Dr. Sunita Bhatt', 'Bone Density Scan', 'confirmed'],
      ['AP-05', todayStr, '03:00 PM', 'Raghavan Kumar', 'EC-003', 'Dr. Arvind Rao', 'Diabetes Follow-up', 'confirmed'],
      ['AP-06', todayStr, '09:00 AM', 'Anitha Sundaram', 'EC-005', 'Dr. Sunita Bhatt', 'Cognitive Assessment', 'pending']
    ];
    for (const a of appts) {
      await conn.query(
        'INSERT INTO appointments (id, date, time, patient, patientId, doctor, type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        a
      );
    }
  }

  // Seed Care Plans
  const [cpCount] = await conn.query('SELECT COUNT(*) as count FROM care_plans');
  if (cpCount[0].count === 0) {
    console.log('[DB Init] Seeding care plans...');
    const plans = [
      [
        'CP-01',
        'Lakshmi Devi',
        'EC-001',
        'LD',
        'Blood pressure stabilization',
        'Priya Nair',
        'In 7 days',
        78,
        JSON.stringify([
          { label: 'Daily BP monitoring', done: true },
          { label: 'Low-sodium meal plan', done: true },
          { label: 'Morning mobility walk', done: false },
          { label: 'Weekly cardiology review', done: false }
        ])
      ],
      [
        'CP-02',
        'Meenakshi Raman',
        'EC-002',
        'MR',
        'Improve bone density & mobility',
        'Anand Raj',
        'In 4 days',
        54,
        JSON.stringify([
          { label: 'Vitamin D supplementation', done: true },
          { label: 'Assisted mobility sessions', done: true },
          { label: 'Fall-risk home assessment', done: false }
        ])
      ],
      [
        'CP-03',
        'Raghavan Kumar',
        'EC-003',
        'RK',
        'Blood sugar management',
        'Deepa Suresh',
        'In 10 days',
        88,
        JSON.stringify([
          { label: 'Twice-daily glucose checks', done: true },
          { label: 'Diet plan adherence', done: true },
          { label: 'Gardening activity (low exertion)', done: true },
          { label: 'Monthly HbA1c test', done: false }
        ])
      ],
      [
        'CP-04',
        'Subramaniam Iyer',
        'EC-004',
        'SI',
        'Cardiac rhythm stabilization',
        'Anand Raj',
        'In 2 days',
        41,
        JSON.stringify([
          { label: 'Daily manual vitals check', done: true },
          { label: 'Statin therapy compliance', done: false },
          { label: 'Reduced sodium & caffeine intake', done: false },
          { label: 'Weekly cardiologist visit', done: false }
        ])
      ],
      [
        'CP-05',
        'Anitha Sundaram',
        'EC-005',
        'AS',
        'Cognitive retention & memory wellness',
        'Deepa Suresh',
        'In 5 days',
        70,
        JSON.stringify([
          { label: 'Daily memory-care puzzle session', done: true },
          { label: 'Afternoon music therapy interaction', done: true },
          { label: 'Evening gentle mobility stroll', done: false },
          { label: 'Weekly cognitive evaluation review', done: false }
        ])
      ],
      [
        'CP-06',
        'Govind Pillai',
        'EC-006',
        'GP',
        'Fluid intake regulation & renal protection',
        'Priya Nair',
        'In 3 days',
        65,
        JSON.stringify([
          { label: 'Strict fluid intake logging', done: true },
          { label: 'Low-potassium renal meal plan', done: true },
          { label: 'Daily edema check', done: false }
        ])
      ]
    ];
    for (const p of plans) {
      await conn.query(
        'INSERT INTO care_plans (id, patient, residentId, initials, goal, caregiver, reviewDate, progress, tasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
  }

  const [hasCp5] = await conn.query("SELECT COUNT(*) as count FROM care_plans WHERE residentId = 'EC-005'");
  if (hasCp5[0].count === 0) {
    await conn.query(
      'INSERT INTO care_plans (id, patient, residentId, initials, goal, caregiver, reviewDate, progress, tasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'CP-05',
        'Anitha Sundaram',
        'EC-005',
        'AS',
        'Cognitive retention & memory wellness',
        'Deepa Suresh',
        'In 5 days',
        70,
        JSON.stringify([
          { label: 'Daily memory-care puzzle session', done: true },
          { label: 'Afternoon music therapy interaction', done: true },
          { label: 'Evening gentle mobility stroll', done: false },
          { label: 'Weekly cognitive evaluation review', done: false }
        ])
      ]
    );
  }

  // Seed Emergency Alerts
  const [sosCount] = await conn.query('SELECT COUNT(*) as count FROM emergency_alerts');
  if (sosCount[0].count === 0) {
    console.log('[DB Init] Seeding emergency alerts...');
    const alerts = [
      [
        'SOS-SEED-01',
        'EC-003',
        'Raghavan Kumar',
        'Willow Room 1',
        'Type 2 Diabetes',
        'A+',
        'Deepa Suresh',
        'Deepak Kumar · Son · +91 94441 88900',
        'Dizziness & Low Blood Sugar',
        'Resident experienced sudden dizziness after morning activity. Glucose administered and stabilized.',
        'HIGH',
        'resolved',
        'Yesterday, 04:15 PM',
        new Date(Date.now() - 86400000).toISOString(),
        'patient',
        'Raghavan Kumar',
        'Deepa Suresh (Caregiver)',
        '04:18 PM',
        'Vitals stabilized. Blood glucose returned to 110 mg/dL.',
        '04:35 PM'
      ]
    ];
    for (const a of alerts) {
      await conn.query(
        'INSERT INTO emergency_alerts (id, residentId, residentName, room, `condition`, bloodGroup, caregiver, emergencyContact, emergencyType, notes, severity, status, timestamp, createdAt, senderRole, senderName, respondedBy, respondedAt, resolutionNotes, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        a
      );
    }
  }

  // Seed Health Vitals
  const [vitCount] = await conn.query('SELECT COUNT(*) as count FROM health_vitals');
  if (vitCount[0].count === 0) {
    console.log('[DB Init] Seeding health vitals...');
    const vitals = [
      ['EC-001', 72, 120, 80, 98, 95, 'Normal'],
      ['EC-002', 78, 125, 82, 97, 105, 'Normal'],
      ['EC-003', 84, 130, 85, 96, 142, 'Attention'],
      ['EC-004', 92, 145, 92, 95, 110, 'Critical'],
      ['EC-005', 70, 118, 78, 99, 90, 'Normal'],
      ['EC-006', 76, 135, 88, 96, 115, 'Attention']
    ];
    for (const v of vitals) {
      await conn.query(
        'INSERT INTO health_vitals (residentId, heartRate, systolic, diastolic, spO2, glucose, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        v
      );
    }
  }

  // Seed Activities
  const [actCount] = await conn.query('SELECT COUNT(*) as count FROM activities');
  if (actCount[0].count === 0) {
    console.log('[DB Init] Seeding activities...');
    const acts = [
      ['ACT-01', 'Morning Mobility', 'PersonStanding', 'Physical', 'Daily · 07:45 AM', '30 min', 'Kavitha Reddy', 12, 'active'],
      ['ACT-02', 'Meditation', 'Flower2', 'Wellness', 'Daily · 06:30 AM', '20 min', 'Priya Nair', 9, 'active'],
      ['ACT-03', 'Music Therapy', 'Music2', 'Recreational', 'Mon, Wed, Fri · 05:00 PM', '45 min', 'Anand Raj', 14, 'active'],
      ['ACT-04', 'Gardening', 'Leaf', 'Recreational', 'Tue, Thu · 04:00 PM', '40 min', 'Deepa Suresh', 7, 'active'],
      ['ACT-05', 'Reading Circle', 'BookOpen', 'Cognitive', 'Daily · 05:30 PM', '30 min', 'Suresh Babu', 6, 'active'],
      ['ACT-06', 'Group Activities', 'Users', 'Social', 'Sat, Sun · 04:30 PM', '60 min', 'Vikram Menon', 18, 'paused']
    ];
    for (const a of acts) {
      await conn.query(
        'INSERT INTO activities (id, name, icon, type, schedule, duration, facilitator, participants, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        a
      );
    }
  }

  // Seed Documents
  const [docCount] = await conn.query('SELECT COUNT(*) as count FROM documents');
  if (docCount[0].count === 0) {
    console.log('[DB Init] Seeding documents...');
    const docs = [
      ['DOC-01', 'Lakshmi Devi — Cardiology Report', 'Medical Report', 'Lakshmi Devi', 'EC-001', '3 days ago', 'reviewed'],
      ['DOC-02', 'Meenakshi Raman — Prescription', 'Prescription', 'Meenakshi Raman', 'EC-002', '4 days ago', 'active'],
      ['DOC-03', 'Raghavan Kumar — Lab Results (HbA1c)', 'Lab Result', 'Raghavan Kumar', 'EC-003', '6 days ago', 'reviewed'],
      ['DOC-04', 'Subramaniam Iyer — Care Plan Update', 'Care Plan', 'Subramaniam Iyer', 'EC-004', 'Today', 'pending review'],
      ['DOC-05', 'Anitha Sundaram — Cognitive Assessment', 'Assessment', 'Anitha Sundaram', 'EC-005', '8 days ago', 'reviewed'],
      ['DOC-06', 'Govind Pillai — Nephrology Report', 'Medical Report', 'Govind Pillai', 'EC-006', 'Yesterday', 'pending review'],
      ['DOC-07', 'Lakshmi Devi — Prescription Renewal', 'Prescription', 'Lakshmi Devi', 'EC-001', '14 days ago', 'active']
    ];
    for (const d of docs) {
      await conn.query(
        'INSERT INTO documents (id, name, type, patient, residentId, date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        d
      );
    }
  }

  // Seed Notifications
  const [notifCount] = await conn.query('SELECT COUNT(*) as count FROM notifications');
  if (notifCount[0].count === 0) {
    console.log('[DB Init] Seeding notifications...');
    const notifs = [
      ['NT-01', 'medication', 'Medication Reminder', '08:00 AM', 'Lakshmi Devi', 'EC-001', 'Amlodipine · 5 mg', 'It is time to take the scheduled medication.', 'today', 0, 1, null, null],
      ['NT-02', 'appointment', 'Upcoming Appointment', '09:30 AM', 'Lakshmi Devi', 'EC-001', 'Cardiology Review · Dr. Kavya Menon', 'Appointment scheduled in 45 minutes.', 'today', 0, 0, null, null],
      ['NT-03', 'health', 'Health Alert', '07:15 AM', 'Subramaniam Iyer', 'EC-004', 'Heart rate above normal range', 'Vitals flagged during morning wellness round.', 'today', 1, 0, null, null],
      ['NT-04', 'caregiver', 'Shift Update', '07:00 AM', 'Deepa Suresh', null, 'Afternoon shift confirmed', 'Caregiver has checked in for the afternoon shift.', 'today', 1, 0, null, null],
      ['NT-05', 'medication', 'Medication Reminder', '09:00 PM', 'Subramaniam Iyer', 'EC-004', 'Atorvastatin · 10 mg', 'Night medication was marked as taken.', 'yesterday', 1, 0, null, null],
      ['NT-06', 'emergency', 'Emergency Drill Completed', '04:20 PM', 'Facility Wide', null, 'Monthly emergency response drill', 'All caregivers completed the scheduled safety drill.', 'yesterday', 1, 0, null, null]
    ];
    for (const n of notifs) {
      await conn.query(
        'INSERT INTO notifications (id, type, title, time, patient, residentId, detail, `desc`, group_name, is_read, actionable, senderRole, emergencyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        n
      );
    }
  }

  // Seed Care Records (Complete historical care logs)
  const [crCount] = await conn.query('SELECT COUNT(*) as count FROM care_records');
  if (crCount[0].count === 0) {
    console.log('[DB Init] Seeding care records (complete history)...');
    const careRecords = [
      // EC-005 (Anitha Sundaram) - Professor requirement demonstration
      ['REC-AS-01', 'EC-005', '04 Sep 2026', '09:30 AM', '120/78', '98.2°F', '60 kg', 'Normal', 'Comfortable and responsive during morning round. Vitals stable.', 'Deepa Suresh', 'Routine Round', '2026-09-04 09:30:00'],
      ['REC-AS-02', 'EC-005', '03 Sep 2026', '10:15 AM', '122/80', '98.4°F', '60.2 kg', 'Good', 'Participated actively in music therapy and group interaction.', 'Kavya', 'Wellness Round', '2026-09-03 10:15:00'],
      ['REC-AS-03', 'EC-005', '01 Sep 2026', '08:45 AM', '118/76', '98.1°F', '60 kg', 'Stable', 'Memory-care exercises completed with good focus and high engagement.', 'Deepa Suresh', 'Morning Vitals', '2026-09-01 08:45:00'],
      ['REC-AS-04', 'EC-005', '28 Aug 2026', '09:00 AM', '120/79', '98.3°F', '60.1 kg', 'Normal', 'Cheerful and oriented during breakfast round.', 'Deepa Suresh', 'Routine Round', '2026-08-28 09:00:00'],
      ['REC-AS-05', 'EC-005', '14 Nov 2024', '10:00 AM', '124/80', '98.5°F', '60.5 kg', 'Stable', 'Initial intake assessment recorded for Anitha Sundaram. Baseline vitals and cognitive evaluation noted.', 'Deepa Suresh', 'Intake Assessment', '2024-11-14 10:00:00'],

      // EC-001 (Lakshmi Devi)
      ['REC-LD-01', 'EC-001', '18 Sep 2026', '10:30 AM', '128/82', '98.4°F', '58 kg', 'Normal', 'Comfortable and alert during morning round. Blood pressure within target range.', 'Priya Nair', 'Routine Round', '2026-09-18 10:30:00'],
      ['REC-LD-02', 'EC-001', '15 Sep 2026', '09:15 AM', '126/80', '98.6°F', '58.2 kg', 'Stable', 'Morning mobility walk completed comfortably. Fluid intake normal.', 'Priya Nair', 'Morning Vitals', '2026-09-15 09:15:00'],
      ['REC-LD-03', 'EC-001', '12 Sep 2026', '08:30 AM', '130/84', '98.3°F', '58 kg', 'Normal', 'Appetite good. Complied with low-sodium meal plan.', 'Priya Nair', 'Routine Round', '2026-09-12 08:30:00'],
      ['REC-LD-04', 'EC-001', '08 Sep 2026', '10:00 AM', '125/82', '98.5°F', '57.8 kg', 'Good', 'Joined morning gentle stretching. Alert and pleasant throughout.', 'Deepa Suresh', 'Wellness Round', '2026-09-08 10:00:00'],
      ['REC-LD-05', 'EC-001', '12 Jan 2024', '11:00 AM', '132/85', '98.6°F', '59 kg', 'Stable', 'Initial intake assessment recorded for Lakshmi Devi. Baseline clinical profile documented.', 'Priya Nair', 'Intake Assessment', '2024-01-12 11:00:00'],

      // EC-002 (Meenakshi Raman)
      ['REC-MR-01', 'EC-002', '17 Sep 2026', '11:00 AM', '132/85', '98.1°F', '54 kg', 'Attention', 'Requested assistance with mobility. Walking frame used for all transfers.', 'Anand Raj', 'Routine Round', '2026-09-17 11:00:00'],
      ['REC-MR-02', 'EC-002', '14 Sep 2026', '09:30 AM', '128/82', '98.3°F', '54.2 kg', 'Normal', 'Vitamin D administered after breakfast. Alert during physiotherapy review.', 'Anand Raj', 'Morning Vitals', '2026-09-14 09:30:00'],
      ['REC-MR-03', 'EC-002', '03 Mar 2023', '10:00 AM', '135/88', '98.4°F', '55 kg', 'Stable', 'Initial admission intake assessment for Meenakshi Raman.', 'Anand Raj', 'Intake Assessment', '2023-03-03 10:00:00'],

      // EC-003 (Raghavan Kumar)
      ['REC-RK-01', 'EC-003', '19 Sep 2026', '09:00 AM', '124/80', '98.6°F', '71 kg', 'Normal', 'Fasting glucose within range. Enjoyed gardening activity this morning.', 'Deepa Suresh', 'Routine Round', '2026-09-19 09:00:00'],
      ['REC-RK-02', 'EC-003', '16 Sep 2026', '08:45 AM', '130/85', '98.4°F', '71.2 kg', 'Attention', 'Post-meal glucose slightly elevated. Dietary counseling provided.', 'Deepa Suresh', 'Morning Vitals', '2026-09-16 08:45:00'],
      ['REC-RK-03', 'EC-003', '22 Jul 2022', '10:30 AM', '128/82', '98.6°F', '72 kg', 'Stable', 'Initial intake assessment for Raghavan Kumar.', 'Deepa Suresh', 'Intake Assessment', '2022-07-22 10:30:00'],

      // EC-004 (Subramaniam Iyer)
      ['REC-SI-01', 'EC-004', '19 Sep 2026', '07:15 AM', '138/88', '98.9°F', '76 kg', 'Attention', 'Under close cardiac review. Statin therapy continued as prescribed.', 'Anand Raj', 'Routine Round', '2026-09-19 07:15:00'],
      ['REC-SI-02', 'EC-004', '17 Sep 2026', '08:00 AM', '142/90', '98.8°F', '76.3 kg', 'Attention', 'Blood pressure slightly elevated. Resting vitals logged.', 'Anand Raj', 'Morning Vitals', '2026-09-17 08:00:00'],
      ['REC-SI-03', 'EC-004', '09 Sep 2021', '09:00 AM', '140/90', '98.6°F', '77 kg', 'Attention', 'Initial cardiac intake evaluation for Subramaniam Iyer.', 'Anand Raj', 'Intake Assessment', '2021-09-09 09:00:00'],

      // EC-006 (Govind Pillai)
      ['REC-GP-01', 'EC-006', '18 Sep 2026', '04:00 PM', '130/84', '98.5°F', '68 kg', 'Attention', 'Fluid intake logged and within recommended daily limit.', 'Priya Nair', 'Routine Round', '2026-09-18 16:00:00'],
      ['REC-GP-02', 'EC-006', '15 Sep 2026', '09:30 AM', '135/88', '98.6°F', '68.4 kg', 'Attention', 'Weekly nephrology review noted stable electrolyte panel.', 'Priya Nair', 'Morning Vitals', '2026-09-15 09:30:00'],
      ['REC-GP-03', 'EC-006', '30 May 2023', '11:15 AM', '132/86', '98.4°F', '69 kg', 'Stable', 'Initial admission intake assessment for Govind Pillai.', 'Priya Nair', 'Intake Assessment', '2023-05-30 11:15:00']
      // Note: EC-007 (Sangeetha) deliberately has 0 records to test and verify the empty state!
    ];

    for (const cr of careRecords) {
      await conn.query(
        'INSERT INTO care_records (record_id, resident_id, date, time, blood_pressure, temperature, weight, observation, notes, recorded_by, record_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        cr
      );
    }
  }

  // Seed Specialists Directory
  const [specCount] = await conn.query('SELECT COUNT(*) as count FROM specialists');
  if (specCount[0].count === 0) {
    console.log('[DB Init] Seeding specialists directory...');
    const specialists = [
      ['DOC-01', 'Dr. Suresh Rao', 'Dermatology', 'Consultant Dermatologist', '14 years', 'Available', JSON.stringify(['Today · 03:30 PM', 'Today · 05:00 PM', 'Tomorrow · 10:00 AM']), '+91 98401 22334', 'Apollo City Hospital & Dermatology Clinic'],
      ['DOC-02', 'Dr. Kavya Menon', 'Cardiology', 'Chief Interventional Cardiologist', '16 years', 'Available', JSON.stringify(['Today · 04:00 PM', 'Tomorrow · 11:30 AM']), '+91 98402 33445', 'Fortis Heart Center'],
      ['DOC-03', 'Dr. Arvind Rao', 'Pulmonology', 'Consultant Pulmonologist', '12 years', 'Available', JSON.stringify(['Today · 04:30 PM', 'Tomorrow · 09:00 AM']), '+91 98403 44556', 'Chest & Lung Specialty Institute'],
      ['DOC-04', 'Dr. Sunita Bhatt', 'Neurology', 'Senior Neurologist', '15 years', 'Available', JSON.stringify(['Today · 05:00 PM', 'Tomorrow · 02:00 PM']), '+91 98404 55667', 'Neuro Care Medical Center'],
      ['DOC-05', 'Dr. Rajesh Sharma', 'Orthopedics', 'Senior Orthopedic Surgeon', '18 years', 'Available', JSON.stringify(['Today · 03:00 PM', 'Tomorrow · 10:30 AM']), '+91 98405 66778', 'Bone & Joint Clinic'],
      ['DOC-06', 'Dr. Meenakshi Iyer', 'Ophthalmology', 'Consultant Eye Surgeon', '10 years', 'Available', JSON.stringify(['Today · 04:00 PM', 'Tomorrow · 03:00 PM']), '+91 98406 77889', 'Aravind Eye Center'],
      ['DOC-07', 'Dr. Preeti Deshmukh', 'Gastroenterology', 'Consultant Gastroenterologist', '11 years', 'Available', JSON.stringify(['Today · 05:30 PM', 'Tomorrow · 01:00 PM']), '+91 98407 88990', 'Digestive Health Institute'],
      ['DOC-08', 'Dr. Vivek Murthy', 'General Medicine', 'Emergency Physician', '13 years', 'Available', JSON.stringify(['Immediate On-Call', 'Today · 02:00 PM', 'Today · 04:00 PM']), '+91 98408 99001', 'ElderCare Emergency Medical Wing']
    ];
    for (const s of specialists) {
      await conn.query(
        'INSERT INTO specialists (id, name, specialty, title, experience, availability, available_slots, phone, hospital) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        s
      );
    }
  }

  // Seed Issue -> Specialist Mappings
  const [mapCount] = await conn.query('SELECT COUNT(*) as count FROM issue_specialist_mappings');
  if (mapCount[0].count === 0) {
    console.log('[DB Init] Seeding issue-to-specialist mappings...');
    const mappings = [
      ['Skin disease', 'Dermatology', 'Dermatologist', 'HIGH'],
      ['Skin problem / Rash / Allergic reaction', 'Dermatology', 'Dermatologist', 'HIGH'],
      ['Chest pain / Heart palpitations', 'Cardiology', 'Cardiologist', 'CRITICAL'],
      ['Breathing difficulty / Asthma / Wheezing', 'Pulmonology', 'Pulmonologist', 'CRITICAL'],
      ['Fracture / Fall injury / Severe joint pain', 'Orthopedics', 'Orthopedic Surgeon', 'HIGH'],
      ['Fall / Suspected fracture', 'Orthopedics', 'Orthopedic Surgeon', 'HIGH'],
      ['Sudden confusion / Dizziness / Stroke symptoms', 'Neurology', 'Neurologist', 'CRITICAL'],
      ['Severe eye pain / Sudden vision loss', 'Ophthalmology', 'Ophthalmologist', 'HIGH'],
      ['Severe abdominal pain / Vomiting', 'Gastroenterology', 'Gastroenterologist', 'HIGH'],
      ['High fever / Acute illness / Unresponsive', 'General Medicine', 'Emergency Physician', 'CRITICAL']
    ];
    for (const m of mappings) {
      await conn.query(
        'INSERT INTO issue_specialist_mappings (issue_type, specialty, specialist_title, default_severity) VALUES (?, ?, ?, ?)',
        m
      );
    }
  }

  // Seed Specialist Availability Schedules
  const [availCount] = await conn.query('SELECT COUNT(*) as count FROM specialist_availability');
  if (availCount[0].count === 0) {
    console.log('[DB Init] Seeding specialist availability schedules...');
    const schedules = [
      // Dr. Suresh Rao (Dermatology)
      // Monday 10:00 AM - 1:00 PM, Wednesday 2:00 PM - 5:00 PM, Friday 10:00 AM - 12:00 PM
      ['AVL-SR-MON', 'DOC-01', 'Dr. Suresh Rao', 'Dermatology', 'Monday', '10:00 AM', '01:00 PM', 30, 'available'],
      ['AVL-SR-WED', 'DOC-01', 'Dr. Suresh Rao', 'Dermatology', 'Wednesday', '02:00 PM', '05:00 PM', 30, 'available'],
      ['AVL-SR-FRI', 'DOC-01', 'Dr. Suresh Rao', 'Dermatology', 'Friday', '10:00 AM', '12:00 PM', 30, 'available'],

      // Dr. Kavya Menon (Cardiology)
      // Tuesday 9:00 AM - 12:00 PM, Friday 3:00 PM - 6:00 PM
      ['AVL-KM-TUE', 'DOC-02', 'Dr. Kavya Menon', 'Cardiology', 'Tuesday', '09:00 AM', '12:00 PM', 30, 'available'],
      ['AVL-KM-FRI', 'DOC-02', 'Dr. Kavya Menon', 'Cardiology', 'Friday', '03:00 PM', '06:00 PM', 30, 'available'],

      // Dr. Arvind Rao (Pulmonology)
      // Monday 2:00 PM - 5:00 PM, Thursday 10:00 AM - 1:00 PM
      ['AVL-AR-MON', 'DOC-03', 'Dr. Arvind Rao', 'Pulmonology', 'Monday', '02:00 PM', '05:00 PM', 30, 'available'],
      ['AVL-AR-THU', 'DOC-03', 'Dr. Arvind Rao', 'Pulmonology', 'Thursday', '10:00 AM', '01:00 PM', 30, 'available'],

      // Dr. Sunita Bhatt (Neurology)
      // Tuesday 2:00 PM - 5:00 PM, Thursday 2:00 PM - 5:00 PM
      ['AVL-SB-TUE', 'DOC-04', 'Dr. Sunita Bhatt', 'Neurology', 'Tuesday', '02:00 PM', '05:00 PM', 30, 'available'],
      ['AVL-SB-THU', 'DOC-04', 'Dr. Sunita Bhatt', 'Neurology', 'Thursday', '02:00 PM', '05:00 PM', 30, 'available'],

      // Dr. Rajesh Sharma (Orthopedics)
      // Monday 9:00 AM - 12:00 PM, Wednesday 10:00 AM - 1:00 PM
      ['AVL-RS-MON', 'DOC-05', 'Dr. Rajesh Sharma', 'Orthopedics', 'Monday', '09:00 AM', '12:00 PM', 30, 'available'],
      ['AVL-RS-WED', 'DOC-05', 'Dr. Rajesh Sharma', 'Orthopedics', 'Wednesday', '10:00 AM', '01:00 PM', 30, 'available'],

      // Dr. Meenakshi Iyer (Ophthalmology)
      // Wednesday 9:00 AM - 12:00 PM, Friday 2:00 PM - 5:00 PM
      ['AVL-MI-WED', 'DOC-06', 'Dr. Meenakshi Iyer', 'Ophthalmology', 'Wednesday', '09:00 AM', '12:00 PM', 30, 'available'],
      ['AVL-MI-FRI', 'DOC-06', 'Dr. Meenakshi Iyer', 'Ophthalmology', 'Friday', '02:00 PM', '05:00 PM', 30, 'available'],

      // Dr. Preeti Deshmukh (Gastroenterology)
      // Tuesday 11:00 AM - 2:00 PM, Thursday 9:00 AM - 12:00 PM
      ['AVL-PD-TUE', 'DOC-07', 'Dr. Preeti Deshmukh', 'Gastroenterology', 'Tuesday', '11:00 AM', '02:00 PM', 30, 'available'],
      ['AVL-PD-THU', 'DOC-07', 'Dr. Preeti Deshmukh', 'Gastroenterology', 'Thursday', '09:00 AM', '12:00 PM', 30, 'available'],

      // Dr. Vivek Murthy (General Medicine & Urgent Care)
      // Monday through Friday 8:00 AM - 6:00 PM
      ['AVL-VM-MON', 'DOC-08', 'Dr. Vivek Murthy', 'General Medicine', 'Monday', '08:00 AM', '06:00 PM', 30, 'available'],
      ['AVL-VM-TUE', 'DOC-08', 'Dr. Vivek Murthy', 'General Medicine', 'Tuesday', '08:00 AM', '06:00 PM', 30, 'available'],
      ['AVL-VM-WED', 'DOC-08', 'Dr. Vivek Murthy', 'General Medicine', 'Wednesday', '08:00 AM', '06:00 PM', 30, 'available'],
      ['AVL-VM-THU', 'DOC-08', 'Dr. Vivek Murthy', 'General Medicine', 'Thursday', '08:00 AM', '06:00 PM', 30, 'available'],
      ['AVL-VM-FRI', 'DOC-08', 'Dr. Vivek Murthy', 'General Medicine', 'Friday', '08:00 AM', '06:00 PM', 30, 'available']
    ];

    for (const av of schedules) {
      await conn.query(
        'INSERT INTO specialist_availability (id, doctor_id, doctor_name, specialty, day_of_week, start_time, end_time, slot_duration_minutes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        av
      );
    }
  }

  // Seed Voicemails
  const [vmRows] = await conn.query('SELECT COUNT(*) as count FROM voicemails');
  if (vmRows[0].count === 0) {
    console.log('[DB Init] Seeding initial voicemails...');
    const seedVoicemails = [
      ['VM-SEED-01', 'EC-001', 'Lakshmi Devi', 'Lakshmi Devi', 'patient', 'Priya Nair', 'caregiver', 'care_instruction', 'Morning Knee Mobility Note', 22, '', 'Vanakkam Priya, I am feeling a slight stiffness in my right knee after getting out of bed. Could you bring the knee pain gel before our morning mobility walk? Thank you.', null, 0, new Date().toISOString()],
      ['VM-SEED-02', 'EC-003', 'Raghavan Kumar', 'Raghavan Kumar', 'patient', 'Deepa Suresh', 'caregiver', 'emergency_sos', '⚠️ SOS Voice Distress — Dizziness Episode', 18, '', 'Deepa, I felt very dizzy suddenly while standing up. My blood sugar might be dropping. Please come to Willow Room 1 with the glucose drink quickly.', 'SOS-SEED-01', 1, new Date(Date.now() - 3600000).toISOString()],
      ['VM-SEED-03', 'EC-001', 'Lakshmi Devi', 'Ramesh Devi (Son)', 'family', 'Lakshmi Devi', 'patient', 'family_checkin', '🌸 Weekend Family Visit Check-in', 35, '', 'Amma, hope you had a good morning! The kids and I will visit this Sunday at 4 PM. Priya said your BP was completely normal today. Take your medicines on time and take care!', null, 0, new Date(Date.now() - 7200000).toISOString()],
      ['VM-SEED-04', 'EC-004', 'Subramaniam Iyer', 'Dr. Kavya Menon', 'doctor', 'Anand Raj', 'caregiver', 'care_instruction', 'Statin Compliance & Pulse Check Protocol', 29, '', 'Anand, for Subramaniam Iyer, please ensure his pulse is checked prior to administering Digoxin at 2 PM. His ECG shows good stabilization.', null, 1, new Date(Date.now() - 86400000).toISOString()]
    ];
    for (const vm of seedVoicemails) {
      await conn.query(
        'INSERT INTO voicemails (id, residentId, residentName, senderName, senderRole, recipientName, recipientRole, category, subject, duration, audioUrl, notes, emergencyId, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        vm
      );
    }
  }

  // Ensure messaging and emergency dispatch tables
  try {
    await setupMessagingTables();
  } catch (msgErr) {
    console.warn('[DB Init] Messaging tables setup notice:', msgErr.message);
  }
}

// Allow direct execution: node server/scripts/initDb.js
if (process.argv[1]?.includes('initDb.js')) {
  initDatabase()
    .then(() => {
      console.log('Database script completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}
