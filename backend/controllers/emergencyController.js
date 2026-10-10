import { query } from '../config/db.js';
import { generateSlots, parseTimeToMinutes, getDayOfWeekName } from './specialistsController.js';

// Helper function to resolve medical specialty from issue
export async function resolveSpecialtyForIssue(issueText = '') {
  const cleanIssue = issueText.trim().toLowerCase();
  
  try {
    const directRows = await query('SELECT * FROM issue_specialist_mappings WHERE LOWER(issue_type) = ? LIMIT 1', [cleanIssue]);
    if (directRows && directRows.length > 0) {
      return directRows[0].specialty;
    }
    const likeRows = await query('SELECT * FROM issue_specialist_mappings WHERE LOWER(issue_type) LIKE ? OR ? LIKE CONCAT("%", LOWER(issue_type), "%") LIMIT 1', [`%${cleanIssue}%`, cleanIssue]);
    if (likeRows && likeRows.length > 0) {
      return likeRows[0].specialty;
    }
  } catch (err) {
    console.warn('[Emergency Controller] DB mapping query fallback:', err.message);
  }

  if (/skin|rash|dermat|itch|eczema|allergy|lesion|burn/i.test(cleanIssue)) return 'Dermatology';
  if (/heart|chest|cardiac|arrhythmia|palpitation|hypertens/i.test(cleanIssue)) return 'Cardiology';
  if (/breath|asthma|lung|pulmon|chok|wheez|respir/i.test(cleanIssue)) return 'Pulmonology';
  if (/fracture|bone|joint|fall|sprain|ortho|hip|knee|trauma/i.test(cleanIssue)) return 'Orthopedics';
  if (/confus|stroke|neuro|head|dizz|paralysis|seizure|faint|unconscious/i.test(cleanIssue)) return 'Neurology';
  if (/eye|vision|blind|cornea|ophthal/i.test(cleanIssue)) return 'Ophthalmology';
  if (/stomach|digest|vomit|abdom|gastro|nausea|bowel/i.test(cleanIssue)) return 'Gastroenterology';
  
  return 'General Medicine';
}

// Find earliest genuinely available, unbooked slot for a specialty across the upcoming week
export async function findAvailableSlotForSpecialty(specialty, searchDays = 7) {
  let specs = await query(
    'SELECT * FROM specialists WHERE LOWER(specialty) = LOWER(?) ORDER BY name ASC',
    [specialty]
  );
  if (!specs || specs.length === 0) {
    specs = await query('SELECT * FROM specialists WHERE specialty = "General Medicine" LIMIT 1');
  }
  if (!specs || specs.length === 0) {
    specs = await query('SELECT * FROM specialists LIMIT 1');
  }
  if (!specs || specs.length === 0) {
    return null;
  }

  const today = new Date();

  for (let dayOffset = 0; dayOffset <= searchDays; dayOffset++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayOfWeek = getDayOfWeekName(dateStr);

    for (const doc of specs) {
      const rules = await query(
        'SELECT * FROM specialist_availability WHERE doctor_id = ? AND LOWER(day_of_week) = LOWER(?) AND status = "available"',
        [doc.id, dayOfWeek]
      );
      if (!rules || rules.length === 0) continue;

      const bookedAppts = await query(
        'SELECT time FROM appointments WHERE (doctorId = ? OR doctor = ?) AND date = ? AND status != "cancelled"',
        [doc.id, doc.name, dateStr]
      );
      const bookedMinutes = new Set(bookedAppts.map((b) => parseTimeToMinutes(b.time)));

      for (const rule of rules) {
        const candidateSlots = generateSlots(rule.start_time, rule.end_time, rule.slot_duration_minutes || 30);
        for (const slotTime of candidateSlots) {
          const slotMin = parseTimeToMinutes(slotTime);
          if (dayOffset === 0) {
            const nowMin = today.getHours() * 60 + today.getMinutes();
            if (slotMin <= nowMin + 15) continue;
          }

          if (!bookedMinutes.has(slotMin)) {
            return {
              doctor: doc,
              date: dateStr,
              dayOfWeek,
              time: slotTime,
              specialty: doc.specialty,
              noSlotAvailable: false
            };
          }
        }
      }
    }
  }

  return {
    fallbackDoctor: specs[0] || null,
    noSlotAvailable: true
  };
}

// GET /api/emergency
export async function getEmergencyAlerts(req, res) {
  try {
    const rows = await query('SELECT * FROM emergency_alerts ORDER BY id DESC');
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Emergency Controller] Get alerts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve emergency alerts.' });
  }
}

// GET /api/emergency/mappings
export async function getEmergencyMappings(req, res) {
  try {
    const rows = await query('SELECT * FROM issue_specialist_mappings ORDER BY id ASC');
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Emergency Controller] Get mappings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve issue mappings.' });
  }
}

// GET /api/emergency/specialists
export async function getEmergencySpecialists(req, res) {
  try {
    const { specialty } = req.query;
    let sql = 'SELECT * FROM specialists ORDER BY specialty ASC, name ASC';
    let params = [];
    if (specialty) {
      sql = 'SELECT * FROM specialists WHERE LOWER(specialty) = LOWER(?) ORDER BY name ASC';
      params = [specialty];
    }
    const rows = await query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Emergency Controller] Get specialists error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve specialists.' });
  }
}

// POST /api/emergency/trigger & POST /api/emergency/report
export async function triggerEmergency(req, res) {
  try {
    const details = req.body;
    const residentId = details.residentId || details.patientId || 'EC-001';
    
    let residentName = details.residentName || details.patient || 'Resident';
    let room = details.room || 'Willow Room 1';
    let condition = details.condition || 'General';
    let bloodGroup = details.bloodGroup || 'O+';
    let caregiver = details.caregiver || 'Priya Nair';
    let emergencyContact = details.emergencyContact || 'Family Contact';

    try {
      const resRows = await query('SELECT * FROM residents WHERE id = ? LIMIT 1', [residentId]);
      if (resRows && resRows.length > 0) {
        const r = resRows[0];
        residentName = r.name || residentName;
        room = r.room || room;
        condition = r.condition || condition;
        bloodGroup = r.bloodGroup || bloodGroup;
        caregiver = r.caregiver || caregiver;
        emergencyContact = r.emergencyContact || emergencyContact;
      }
    } catch (err) {
      console.warn('[Emergency Controller] Resident lookup fallback:', err.message);
    }

    const emergencyType = details.emergencyType || details.issueType || 'Emergency Health Incident';
    const notes = details.notes || details.description || 'Urgent medical assistance requested.';
    const severity = details.severity || 'CRITICAL';
    const senderRole = details.senderRole || 'patient';
    const senderName = details.senderName || residentName;

    const explicitEmergencyId = (details.emergencyId || details.alertId || details.id || '').trim();

    if (explicitEmergencyId) {
      const existingApptByEmgId = await query('SELECT * FROM appointments WHERE emergencyId = ? LIMIT 1', [explicitEmergencyId]);
      if (existingApptByEmgId && existingApptByEmgId.length > 0) {
        const existingAlert = await query('SELECT * FROM emergency_alerts WHERE id = ? LIMIT 1', [explicitEmergencyId]);
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'Appointment already exists for this emergency event.',
          data: {
            alert: existingAlert[0] || null,
            appointment: existingApptByEmgId[0],
            specialist: null,
            specialty: existingApptByEmgId[0].specialty,
            appointmentId: existingApptByEmgId[0].id,
            assignedCaregiver: caregiver
          }
        });
      }
    }

    const activeAlerts = await query(
      `SELECT * FROM emergency_alerts 
       WHERE residentId = ? 
         AND status = 'active' 
         AND (LOWER(emergencyType) = LOWER(?) OR LOWER(emergencyType) LIKE ? OR ? LIKE CONCAT('%', LOWER(emergencyType), '%'))
       ORDER BY id DESC LIMIT 1`,
      [residentId, emergencyType, `%${emergencyType.toLowerCase()}%`, emergencyType.toLowerCase()]
    );

    if (activeAlerts && activeAlerts.length > 0) {
      const activeAlert = activeAlerts[0];
      const existingAppt = await query(
        'SELECT * FROM appointments WHERE emergencyId = ? OR id = ? LIMIT 1',
        [activeAlert.id, activeAlert.appointmentId]
      );
      if (existingAppt && existingAppt.length > 0) {
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'Reusing existing appointment for active emergency event.',
          data: {
            alert: activeAlert,
            appointment: existingAppt[0],
            specialist: null,
            specialty: existingAppt[0].specialty,
            appointmentId: existingAppt[0].id,
            assignedCaregiver: caregiver
          }
        });
      }
    }

    const alertId = explicitEmergencyId || `SOS-${Date.now()}`;
    const appointmentId = `AP-EMG-${Date.now().toString().slice(-4)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = new Date().toISOString().split('T')[0];
    const createdAt = new Date().toISOString();

    const specialty = details.specialty || await resolveSpecialtyForIssue(`${emergencyType} ${notes}`);
    const slotResult = await findAvailableSlotForSpecialty(specialty);

    let doctorName = 'Pending Specialist Assignment';
    let doctorId = null;
    let appointmentDate = todayStr;
    let appointmentTime = 'Pending Allocation';
    let appointmentStatus = 'pending';
    let reasonText = '';
    let isAutoScheduled = false;

    if (slotResult && !slotResult.noSlotAvailable) {
      doctorName = slotResult.doctor.name;
      doctorId = slotResult.doctor.id;
      appointmentDate = slotResult.date;
      appointmentTime = slotResult.time;
      appointmentStatus = 'confirmed';
      isAutoScheduled = true;
      reasonText = `Auto-scheduled with ${doctorName} (${specialty}) for ${slotResult.dayOfWeek}, ${slotResult.date} at ${slotResult.time} based on weekly availability schedule. Emergency SOS #${alertId}: ${emergencyType}.`;
    } else {
      const fallbackDoc = slotResult?.fallbackDoctor;
      doctorName = fallbackDoc ? fallbackDoc.name : 'Pending Specialist Assignment';
      doctorId = fallbackDoc ? fallbackDoc.id : null;
      appointmentDate = todayStr;
      appointmentTime = 'Pending Allocation';
      appointmentStatus = 'pending';
      isAutoScheduled = false;
      reasonText = `No available specialist slot found this week for ${specialty}. Manual scheduling required by Admin/Caregiver. Emergency SOS #${alertId}: ${emergencyType}.`;
    }

    const voiceMailAudio = details.voiceMailAudio || details.voiceNoteUrl || null;
    const voiceDuration = Number(details.voiceDuration) || 0;

    try {
      await query(
        'INSERT INTO emergency_alerts (id, residentId, residentName, room, `condition`, bloodGroup, caregiver, emergencyContact, emergencyType, notes, severity, status, timestamp, createdAt, senderRole, senderName, specialty, appointmentId, voiceMailAudio, voiceDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          alertId,
          residentId,
          residentName,
          room,
          condition,
          bloodGroup,
          caregiver,
          emergencyContact,
          emergencyType,
          notes,
          severity,
          'active',
          timeStr,
          createdAt,
          senderRole,
          senderName,
          specialty,
          appointmentId,
          voiceMailAudio,
          voiceDuration
        ]
      );
    } catch (insertErr) {
      await query(
        'INSERT INTO emergency_alerts (id, residentId, residentName, room, `condition`, bloodGroup, caregiver, emergencyContact, emergencyType, notes, severity, status, timestamp, createdAt, senderRole, senderName, specialty, appointmentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          alertId,
          residentId,
          residentName,
          room,
          condition,
          bloodGroup,
          caregiver,
          emergencyContact,
          emergencyType,
          notes,
          severity,
          'active',
          timeStr,
          createdAt,
          senderRole,
          senderName,
          specialty,
          appointmentId
        ]
      );
    }

    if (voiceMailAudio) {
      try {
        await query(
          'INSERT INTO voicemails (id, residentId, residentName, senderName, senderRole, recipientName, recipientRole, category, subject, duration, audioUrl, notes, emergencyId, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            `VM-SOS-${Date.now()}`,
            residentId,
            residentName,
            senderName,
            senderRole,
            'Emergency Response Team',
            'caregiver',
            'emergency_sos',
            `🚨 Emergency SOS Voice Note: ${emergencyType}`,
            voiceDuration,
            voiceMailAudio,
            notes,
            alertId,
            0,
            createdAt
          ]
        );
      } catch (vmErr) {
        console.warn('[Emergency Controller] Failed to mirror voice note to voicemails table:', vmErr.message);
      }
    }

    await query(
      'INSERT INTO appointments (id, date, time, patient, patientId, doctor, doctorId, type, specialty, reason, emergencyId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        appointmentId,
        appointmentDate,
        appointmentTime,
        residentName,
        residentId,
        doctorName,
        doctorId,
        `Emergency Consultation (${specialty})`,
        specialty,
        reasonText,
        alertId,
        appointmentStatus
      ]
    );

    const existingNotifs = await query('SELECT id FROM notifications WHERE emergencyId = ? LIMIT 1', [alertId]);
    if (!existingNotifs || existingNotifs.length === 0) {
      const notifId = `NT-SOS-${Date.now()}`;
      const notifTitle = `EMERGENCY SOS: ${residentName}`;
      const notifDetail = isAutoScheduled
        ? `${emergencyType} · Ref: ${doctorName} (${specialty})`
        : `${emergencyType} · Manual Scheduling Required (${specialty})`;
      const notifDesc = isAutoScheduled
        ? `Emergency reported for ${residentName} in ${room}. Automatically scheduled consultation with specialist ${doctorName} (${specialty}) on ${appointmentDate} at ${appointmentTime}. Assigned Caregiver: ${caregiver}.`
        : `Emergency reported for ${residentName} in ${room}. No open ${specialty} slots this week. Action required: Admin/Caregiver must manually coordinate specialist consultation.`;

      await query(
        'INSERT INTO notifications (id, type, title, time, patient, residentId, detail, `desc`, group_name, is_read, actionable, senderRole, emergencyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          notifId,
          'emergency',
          notifTitle,
          'Just now',
          residentName,
          residentId,
          notifDetail,
          notifDesc,
          'today',
          0,
          1,
          senderRole,
          alertId
        ]
      );
    }

    const createdAlert = await query('SELECT * FROM emergency_alerts WHERE id = ? LIMIT 1', [alertId]);
    const createdAppt = await query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [appointmentId]);

    return res.status(201).json({
      success: true,
      data: {
        alert: createdAlert[0],
        appointment: createdAppt[0],
        specialist: slotResult?.doctor || slotResult?.fallbackDoctor || null,
        specialty,
        appointmentId,
        isAutoScheduled,
        appointmentStatus,
        assignedCaregiver: caregiver
      }
    });
  } catch (error) {
    console.error('[Emergency Controller] Trigger alert error:', error);
    return res.status(500).json({ success: false, message: 'Failed to trigger emergency alert.' });
  }
}

// POST /api/emergency/:id/respond
export async function respondToEmergency(req, res) {
  try {
    const { id } = req.params;
    const { responderName } = req.body;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    await query(
      'UPDATE emergency_alerts SET status = "in_progress", respondedBy = ?, respondedAt = ? WHERE id = ?',
      [responderName || 'Caregiver', timeStr, id]
    );

    const updated = await query('SELECT * FROM emergency_alerts WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[Emergency Controller] Respond alert error:', error);
    return res.status(500).json({ success: false, message: 'Failed to respond to emergency alert.' });
  }
}

// POST /api/emergency/:id/resolve
export async function resolveEmergency(req, res) {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    await query(
      'UPDATE emergency_alerts SET status = "resolved", resolvedAt = ?, resolutionNotes = ? WHERE id = ?',
      [timeStr, resolutionNotes || 'Assistance provided and resident verified safe.', id]
    );

    const updated = await query('SELECT * FROM emergency_alerts WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[Emergency Controller] Resolve alert error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resolve emergency alert.' });
  }
}

// DELETE /api/emergency/:id
export async function deleteEmergency(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM emergency_alerts WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Alert removed.' });
  } catch (error) {
    console.error('[Emergency Controller] Delete alert error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove alert.' });
  }
}
