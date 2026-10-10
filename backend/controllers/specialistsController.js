import { query } from '../config/db.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  const parts = clean.split(/\s+/);
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const meridiem = (parts[1] || '').toUpperCase();
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export function formatMinutesToTime(totalMinutes) {
  let h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const meridiem = h >= 12 ? 'PM' : 'AM';
  let displayH = h % 12;
  if (displayH === 0) displayH = 12;
  const padM = m.toString().padStart(2, '0');
  return `${displayH.toString().padStart(2, '0')}:${padM} ${meridiem}`;
}

export function generateSlots(startTimeStr, endTimeStr, durationMinutes = 30) {
  const startMin = parseTimeToMinutes(startTimeStr);
  const endMin = parseTimeToMinutes(endTimeStr);
  const slots = [];
  for (let min = startMin; min + durationMinutes <= endMin; min += durationMinutes) {
    slots.push(formatMinutesToTime(min));
  }
  return slots;
}

export function getDayOfWeekName(dateInput) {
  if (!dateInput) return DAYS_OF_WEEK[new Date().getDay()];
  const dateObj = typeof dateInput === 'string' ? new Date(`${dateInput}T12:00:00`) : new Date(dateInput);
  return DAYS_OF_WEEK[dateObj.getDay()];
}

// GET /api/specialists
export async function getSpecialists(req, res) {
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
    console.error('[Specialists Controller] Get specialists error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve specialists.' });
  }
}

// GET /api/specialists/week-view
export async function getWeekView(req, res) {
  try {
    const { specialty, doctorId } = req.query;
    let sql = `
      SELECT a.*, s.name as doc_name, s.hospital 
      FROM specialist_availability a
      LEFT JOIN specialists s ON a.doctor_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (specialty) {
      sql += ' AND LOWER(a.specialty) = LOWER(?)';
      params.push(specialty);
    }
    if (doctorId) {
      sql += ' AND a.doctor_id = ?';
      params.push(doctorId);
    }
    sql += ' ORDER BY FIELD(a.day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), a.start_time ASC';

    const rules = await query(sql, params);

    const weekOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekMap = {};
    weekOrder.forEach((day) => {
      weekMap[day] = [];
    });

    rules.forEach((r) => {
      if (weekMap[r.day_of_week]) {
        weekMap[r.day_of_week].push(r);
      }
    });

    return res.json({
      success: true,
      data: {
        filterSpecialty: specialty || 'All Specialties',
        week: weekOrder.map((day) => ({
          day,
          hasAvailability: weekMap[day].length > 0,
          schedules: weekMap[day],
          summary: weekMap[day].length > 0
            ? weekMap[day].map((s) => `${s.doctor_name} (${s.start_time} - ${s.end_time})`).join(', ')
            : `No ${specialty || 'specialist'} availability`
        }))
      }
    });
  } catch (error) {
    console.error('[Specialists Controller] Week-view error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve weekly overview.' });
  }
}

// GET /api/specialists/availability
export async function getAvailability(req, res) {
  try {
    const { doctorId, specialty, dayOfWeek } = req.query;
    let sql = 'SELECT * FROM specialist_availability WHERE 1=1';
    const params = [];
    if (doctorId) {
      sql += ' AND doctor_id = ?';
      params.push(doctorId);
    }
    if (specialty) {
      sql += ' AND LOWER(specialty) = LOWER(?)';
      params.push(specialty);
    }
    if (dayOfWeek) {
      sql += ' AND LOWER(day_of_week) = LOWER(?)';
      params.push(dayOfWeek);
    }
    sql += ' ORDER BY FIELD(day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), start_time ASC';

    const rows = await query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Specialists Controller] Get availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve availability.' });
  }
}

// GET /api/specialists/:id/availability
export async function getDoctorAvailability(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      'SELECT * FROM specialist_availability WHERE doctor_id = ? ORDER BY FIELD(day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), start_time ASC',
      [id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[Specialists Controller] Get doctor availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve doctor availability.' });
  }
}

// GET /api/specialists/:id/slots?date=YYYY-MM-DD
export async function getSpecialistSlots(req, res) {
  try {
    const { id } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const dayOfWeek = getDayOfWeekName(date);

    const docRows = await query('SELECT * FROM specialists WHERE id = ? LIMIT 1', [id]);
    if (!docRows || docRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Specialist not found.' });
    }
    const doctor = docRows[0];

    const availRules = await query(
      'SELECT * FROM specialist_availability WHERE doctor_id = ? AND LOWER(day_of_week) = LOWER(?) AND status = "available"',
      [id, dayOfWeek]
    );

    if (!availRules || availRules.length === 0) {
      return res.json({
        success: true,
        data: {
          doctor: doctor.name,
          doctorId: doctor.id,
          specialty: doctor.specialty,
          date,
          dayOfWeek,
          isWorkingDay: false,
          message: `${doctor.name} has no scheduled availability on ${dayOfWeek}s.`,
          slots: []
        }
      });
    }

    const bookedAppts = await query(
      'SELECT id, patient, patientId, time, emergencyId, status FROM appointments WHERE (doctorId = ? OR doctor = ?) AND date = ? AND status != "cancelled"',
      [id, doctor.name, date]
    );

    const bookedMinutesMap = new Map();
    bookedAppts.forEach((b) => {
      const bMin = parseTimeToMinutes(b.time);
      bookedMinutesMap.set(bMin, b);
    });

    const allSlots = [];
    const seenTimes = new Set();

    for (const rule of availRules) {
      const windowSlots = generateSlots(rule.start_time, rule.end_time, rule.slot_duration_minutes || 30);
      for (const slotTime of windowSlots) {
        if (seenTimes.has(slotTime)) continue;
        seenTimes.add(slotTime);

        const slotMin = parseTimeToMinutes(slotTime);
        const isBooked = bookedMinutesMap.has(slotMin);
        const bookedInfo = bookedMinutesMap.get(slotMin);

        allSlots.push({
          time: slotTime,
          startTime: slotTime,
          duration: rule.slot_duration_minutes || 30,
          isBooked,
          status: isBooked ? 'booked' : 'available',
          label: isBooked ? `${slotTime} — BOOKED` : slotTime,
          bookedAppointmentId: bookedInfo ? bookedInfo.id : null,
          bookedPatient: bookedInfo ? bookedInfo.patient : null,
        });
      }
    }

    return res.json({
      success: true,
      data: {
        doctor: doctor.name,
        doctorId: doctor.id,
        specialty: doctor.specialty,
        date,
        dayOfWeek,
        isWorkingDay: true,
        totalSlots: allSlots.length,
        availableSlotsCount: allSlots.filter((s) => !s.isBooked).length,
        slots: allSlots
      }
    });
  } catch (error) {
    console.error('[Specialists Controller] Generate slots error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate appointment slots.' });
  }
}

// POST /api/specialists/availability
export async function createAvailability(req, res) {
  try {
    const { doctor_id, day_of_week, start_time, end_time, slot_duration_minutes = 30, status = 'available' } = req.body;

    if (!doctor_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Doctor, Day of Week, Start Time, and End Time are required.' });
    }

    const docRows = await query('SELECT * FROM specialists WHERE id = ? LIMIT 1', [doctor_id]);
    if (!docRows || docRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Specified specialist does not exist.' });
    }
    const doc = docRows[0];

    const id = `AVL-${Date.now().toString().slice(-6)}`;

    await query(
      'INSERT INTO specialist_availability (id, doctor_id, doctor_name, specialty, day_of_week, start_time, end_time, slot_duration_minutes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, doctor_id, doc.name, doc.specialty, day_of_week, start_time, end_time, slot_duration_minutes, status]
    );

    const created = await query('SELECT * FROM specialist_availability WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json({ success: true, message: 'Availability schedule created successfully.', data: created[0] });
  } catch (error) {
    console.error('[Specialists Controller] Create availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save availability schedule.' });
  }
}

// PATCH /api/specialists/availability/:id
export async function updateAvailability(req, res) {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time, status } = req.body;

    const existing = await query('SELECT * FROM specialist_availability WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Availability record not found.' });
    }

    const current = existing[0];
    const newDay = day_of_week || current.day_of_week;
    const newStart = start_time || current.start_time;
    const newEnd = end_time || current.end_time;
    const newStatus = status || current.status;

    await query(
      'UPDATE specialist_availability SET day_of_week = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?',
      [newDay, newStart, newEnd, newStatus, id]
    );

    const updated = await query('SELECT * FROM specialist_availability WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, message: 'Availability updated successfully.', data: updated[0] });
  } catch (error) {
    console.error('[Specialists Controller] Update availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update availability schedule.' });
  }
}

// DELETE /api/specialists/availability/:id
export async function deleteAvailability(req, res) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM specialist_availability WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Availability record not found.' });
    }

    await query('DELETE FROM specialist_availability WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Availability schedule deleted successfully.' });
  } catch (error) {
    console.error('[Specialists Controller] Delete availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete availability schedule.' });
  }
}

// GET /api/specialists/doctor-dashboard
export async function getDoctorDashboard(req, res) {
  try {
    const { doctorId, doctorName, specialty } = req.query;

    // 1. Fetch all specialists from MySQL
    const allSpecialists = await query('SELECT * FROM specialists ORDER BY specialty ASC, name ASC');

    // 2. Determine active doctor
    let activeDoc = null;
    if (doctorId && doctorId !== 'all') {
      activeDoc = allSpecialists.find(s => s.id === doctorId);
    }
    if (!activeDoc && doctorName && doctorName !== 'all') {
      const cleanName = doctorName.toLowerCase();
      activeDoc = allSpecialists.find(s => s.name.toLowerCase().includes(cleanName));
    }
    if (!activeDoc && specialty && specialty !== 'all') {
      activeDoc = allSpecialists.find(s => s.specialty.toLowerCase() === specialty.toLowerCase());
    }

    // Default/fallback: Chief Medical Officer & Cardiologist (Dr. Arun Ramanathan)
    if (!activeDoc) {
      activeDoc = {
        id: 'DOC-00',
        name: 'Dr. Arun Ramanathan',
        specialty: 'Cardiology & General Medicine',
        title: 'Chief Medical Officer & Cardiologist',
        experience: '20 years',
        availability: 'Available',
        available_slots: JSON.stringify(['Today · 09:00 AM', 'Today · 11:30 AM', 'Tomorrow · 02:00 PM']),
        phone: '+91 98400 12345',
        hospital: 'ElderCare Central Medical Center & Fortis Heart Center',
        email: 'dr.arun@eldercare.demo'
      };
    }

    const isAll = doctorId === 'all';
    const isCMO = activeDoc.id === 'DOC-00' || activeDoc.name.includes('Arun');

    // 3. Fetch all connected datasets from MySQL
    const residents = await query('SELECT * FROM residents ORDER BY name ASC');
    const appointments = await query('SELECT * FROM appointments ORDER BY date ASC, time ASC');
    const medications = await query('SELECT * FROM medications ORDER BY time ASC');
    const emergencyAlerts = await query('SELECT * FROM emergency_alerts ORDER BY createdAt DESC, timestamp DESC');
    const carePlans = await query('SELECT * FROM care_plans ORDER BY created_at DESC');
    const careRecords = await query('SELECT * FROM care_records ORDER BY created_at DESC, date DESC, time DESC');
    const vitalsList = await query('SELECT * FROM health_vitals ORDER BY recordedAt DESC');
    const availabilityList = await query(`
      SELECT * FROM specialist_availability 
      WHERE doctor_id = ? OR doctor_name = ? 
      ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time ASC
    `, [activeDoc.id, activeDoc.name]);
    const notifications = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20');

    // 4. Map appointments for this doctor / department
    const todayStr = new Date().toISOString().split('T')[0];
    const docAppts = appointments.filter((a) => {
      if (isAll || isCMO) return true;
      const matchId = a.doctorId && a.doctorId === activeDoc.id;
      const matchName = a.doctor && a.doctor.toLowerCase().includes(activeDoc.name.toLowerCase());
      const matchSpecialty = a.specialty && activeDoc.specialty && a.specialty.toLowerCase() === activeDoc.specialty.toLowerCase();
      return matchId || matchName || matchSpecialty;
    });

    const todaysAppointments = docAppts.filter(a => a.date === todayStr);
    const upcomingAppointments = docAppts.filter(a => a.date >= todayStr);
    const pendingFollowups = docAppts.filter(a => 
      a.followup_required === 'Required' || 
      (a.followup_status && a.followup_status.toLowerCase() !== 'completed' && a.followup_status.toLowerCase() !== 'none') ||
      a.status === 'pending'
    );

    // 5. Associated / Assigned Residents
    const docPatientIds = new Set();
    docAppts.forEach(a => { if (a.patientId) docPatientIds.add(a.patientId); });
    medications.forEach(m => {
      if (m.patientId && (isAll || isCMO || (m.prescribedBy && m.prescribedBy.toLowerCase().includes(activeDoc.name.toLowerCase())))) {
        docPatientIds.add(m.patientId);
      }
    });
    emergencyAlerts.forEach(e => {
      if (e.residentId && (isAll || isCMO || (e.specialty && activeDoc.specialty && e.specialty.toLowerCase() === activeDoc.specialty.toLowerCase()))) {
        docPatientIds.add(e.residentId);
      }
    });

    // If CMO or no specific doctor appointments yet, all residents are in clinical scope
    const assignedResidents = (isAll || isCMO || docPatientIds.size === 0)
      ? residents
      : residents.filter(r => docPatientIds.has(r.id));

    // Enrich residents with latest vitals and stats
    const enrichedResidents = assignedResidents.map(r => {
      const resVitals = vitalsList.find(v => v.residentId === r.id) || null;
      const resRecords = careRecords.filter(c => c.resident_id === r.id).slice(0, 5);
      const resMeds = medications.filter(m => m.patientId === r.id);
      const resAppts = docAppts.filter(a => a.patientId === r.id);
      const resPlans = carePlans.filter(p => p.residentId === r.id);
      return {
        ...r,
        latestVitals: resVitals,
        recordsCount: resRecords.length,
        recentRecords: resRecords,
        activeMedsCount: resMeds.length,
        appointmentsCount: resAppts.length,
        carePlansCount: resPlans.length
      };
    });

    // 6. Active Emergency Cases
    const activeEmergencies = emergencyAlerts.filter(e => {
      const isActive = e.status === 'active' || e.severity === 'CRITICAL' || e.severity === 'HIGH';
      if (!isActive) return false;
      if (isAll || isCMO) return true;
      if (e.specialty && activeDoc.specialty && e.specialty.toLowerCase() === activeDoc.specialty.toLowerCase()) return true;
      return docPatientIds.has(e.residentId);
    });

    // 7. Active Care Plans
    const activeCarePlans = carePlans.map(p => {
      let parsedTasks = [];
      try {
        parsedTasks = typeof p.tasks === 'string' ? JSON.parse(p.tasks) : (p.tasks || []);
      } catch {
        parsedTasks = [];
      }
      return { ...p, tasksList: parsedTasks };
    }).filter(p => isAll || isCMO || docPatientIds.has(p.residentId));

    // 8. Recent Health Updates (vitals & observations)
    const assignedIdsSet = new Set(assignedResidents.map(r => r.id));
    const recentHealthUpdates = careRecords
      .filter(cr => isAll || isCMO || assignedIdsSet.has(cr.resident_id))
      .slice(0, 15);

    // 9. Medication Overview
    const medsOverview = medications.filter(m => isAll || isCMO || assignedIdsSet.has(m.patientId));

    // 10. Availability & Slots
    let docAvailability = availabilityList;
    if (docAvailability.length === 0) {
      // Default working schedule if none yet customized
      docAvailability = [
        { id: 'DEF-1', doctor_id: activeDoc.id, doctor_name: activeDoc.name, specialty: activeDoc.specialty, day_of_week: 'Monday', start_time: '09:00 AM', end_time: '01:00 PM', status: 'available' },
        { id: 'DEF-2', doctor_id: activeDoc.id, doctor_name: activeDoc.name, specialty: activeDoc.specialty, day_of_week: 'Wednesday', start_time: '10:00 AM', end_time: '02:00 PM', status: 'available' },
        { id: 'DEF-3', doctor_id: activeDoc.id, doctor_name: activeDoc.name, specialty: activeDoc.specialty, day_of_week: 'Friday', start_time: '02:00 PM', end_time: '06:00 PM', status: 'available' }
      ];
    }

    // 11. Relevant Notifications
    const doctorNotifs = notifications.filter(n => {
      if (isAll || isCMO) return true;
      if (n.type === 'health' || n.type === 'emergency' || n.type === 'appointment') return true;
      return n.residentId && assignedIdsSet.has(n.residentId);
    }).slice(0, 10);

    // 12. Summary Metrics
    const metrics = {
      assignedResidentsCount: assignedResidents.length,
      todaysAppointmentsCount: todaysAppointments.length,
      upcomingAppointmentsCount: upcomingAppointments.length,
      pendingFollowupsCount: pendingFollowups.length,
      emergencyCasesCount: activeEmergencies.length,
      activeCarePlansCount: activeCarePlans.length,
      criticalResidentsCount: assignedResidents.filter(r => r.status === 'critical').length,
      attentionResidentsCount: assignedResidents.filter(r => r.status === 'attention').length,
      activePrescriptionsCount: medsOverview.length,
      availableSlotsCount: docAvailability.length * 6
    };

    return res.json({
      success: true,
      data: {
        doctor: activeDoc,
        allSpecialists: [
          {
            id: 'DOC-00',
            name: 'Dr. Arun Ramanathan',
            specialty: 'Cardiology & General Medicine',
            title: 'Chief Medical Officer & Cardiologist',
            hospital: 'ElderCare Central Medical Center & Fortis Heart Center'
          },
          ...allSpecialists
        ],
        metrics,
        assignedResidents: enrichedResidents,
        todaysAppointments,
        upcomingAppointments,
        pendingFollowups,
        emergencyCases: activeEmergencies,
        activeCarePlans,
        recentHealthUpdates,
        medicationsOverview: medsOverview,
        availability: docAvailability,
        notifications: doctorNotifs
      }
    });
  } catch (error) {
    console.error('[Specialists Controller] Get doctor dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve doctor dashboard data.' });
  }
}

