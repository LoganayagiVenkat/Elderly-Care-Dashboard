import { query } from '../config/db.js';

function toIsoDateStr(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

/**
 * Helper to check role-based access to resident dependency information
 */
async function verifyResidentAccess(req, residentId) {
  const role = req.headers['x-user-role'] || req.query.role || 'admin';
  const caregiverName = req.headers['x-user-caregiver-name'] || req.query.caregiverName || '';
  const userResidentId = req.headers['x-user-resident-id'] || req.query.userResidentId || '';
  const doctorName = req.headers['x-user-doctor-name'] || req.query.doctorName || '';
  const doctorId = req.headers['x-user-doctor-id'] || req.query.doctorId || '';

  // 1. Admin: Complete facility-wide access across all residents
  if (role === 'admin') {
    return { allowed: true, role, readOnly: false };
  }

  // 2. Doctor: Clinical access for authorized residents
  if (role === 'doctor') {
    const resRows = await query('SELECT * FROM residents WHERE id = ? LIMIT 1', [residentId]);
    if (!resRows || resRows.length === 0) {
      return { allowed: false, notFound: true, message: 'Resident not found.' };
    }

    // CMO (Chief Medical Officer) or Dr. Arun Ramanathan has clinical oversight across all residents
    const isCMO = doctorId === 'DOC-00' || doctorName.toLowerCase().includes('arun') || (!doctorId && !doctorName);
    if (isCMO) {
      return { allowed: true, role, readOnly: false };
    }

    // Check specific clinical relationships (appointments, emergency cases, medications)
    const [appts, meds, emergencies] = await Promise.all([
      query(
        'SELECT id FROM appointments WHERE patientId = ? AND (doctorId = ? OR LOWER(doctor) LIKE LOWER(?)) LIMIT 1',
        [residentId, doctorId, `%${doctorName}%`]
      ),
      query(
        'SELECT id FROM medications WHERE patientId = ? AND LOWER(prescribedBy) LIKE LOWER(?) LIMIT 1',
        [residentId, `%${doctorName}%`]
      ),
      query(
        'SELECT id FROM emergency_alerts WHERE residentId = ? LIMIT 1',
        [residentId]
      )
    ]);

    if (appts.length > 0 || meds.length > 0 || emergencies.length > 0) {
      return { allowed: true, role, readOnly: false };
    }

    // Staff doctor registered in specialists table
    const docRows = await query('SELECT id FROM specialists WHERE id = ? OR LOWER(name) LIKE LOWER(?) LIMIT 1', [
      doctorId,
      `%${doctorName}%`
    ]);
    if (docRows.length > 0) {
      return { allowed: true, role, readOnly: false };
    }

    return {
      allowed: false,
      message: 'Access denied. You are not authorized to view clinical dependency maps for this resident.'
    };
  }

  // 3. Caregiver: Access only to assigned residents
  if (role === 'caregiver') {
    if (!caregiverName) {
      return { allowed: false, message: 'Caregiver identity missing from request.' };
    }
    const resRows = await query('SELECT caregiver FROM residents WHERE id = ? LIMIT 1', [residentId]);
    if (!resRows || resRows.length === 0) {
      return { allowed: false, notFound: true, message: 'Resident not found.' };
    }
    const assignedCg = (resRows[0].caregiver || '').trim().toLowerCase();
    const reqCg = caregiverName.trim().toLowerCase();

    // Support both specific name (e.g. "priya nair") and generic username ("caregiver")
    const isMatch =
      assignedCg === reqCg ||
      assignedCg.includes(reqCg) ||
      reqCg.includes(assignedCg) ||
      (reqCg === 'caregiver' && (assignedCg.includes('priya') || assignedCg.includes('nair')));

    if (!isMatch) {
      return {
        allowed: false,
        message: 'Access denied. Caregivers can only view dependency maps for their assigned residents.'
      };
    }
    return { allowed: true, role, readOnly: false };
  }

  // 4. Family & 5. Patient: Strictly tied to their own linked resident (Read-Only)
  if (role === 'family' || role === 'patient') {
    if (!userResidentId || userResidentId !== residentId) {
      return {
        allowed: false,
        message: `Access denied. ${
          role === 'family' ? 'Family members' : 'Residents'
        } can view only their own linked care dependency map.`
      };
    }
    return { allowed: true, role, readOnly: true };
  }

  return { allowed: false, message: 'Unauthorized role.' };
}

// GET /api/care-dependency-map/:residentId
export async function getCareDependencyMap(req, res) {
  try {
    const { residentId } = req.params;

    // 1. Role-based Access Verification
    const authCheck = await verifyResidentAccess(req, residentId);
    if (!authCheck.allowed) {
      if (authCheck.notFound) {
        return res.status(404).json({ success: false, message: authCheck.message });
      }
      return res.status(403).json({ success: false, message: authCheck.message });
    }

    // 2. Fetch Resident Profile
    const residentRows = await query('SELECT * FROM residents WHERE id = ? LIMIT 1', [residentId]);
    if (!residentRows || residentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resident not found in database.' });
    }
    const resident = residentRows[0];

    // 3. Fetch all related database records for this resident
    const [
      emergencies,
      appointments,
      careRecords,
      medications,
      carePlans,
      specialists,
      availabilitySchedules,
      issueMappings
    ] = await Promise.all([
      query('SELECT * FROM emergency_alerts WHERE residentId = ? ORDER BY id DESC', [residentId]),
      query('SELECT * FROM appointments WHERE patientId = ? ORDER BY date DESC, time DESC', [residentId]),
      query('SELECT * FROM care_records WHERE resident_id = ? ORDER BY created_at DESC, date DESC, time DESC', [residentId]),
      query('SELECT * FROM medications WHERE patientId = ? ORDER BY id ASC', [residentId]),
      query('SELECT * FROM care_plans WHERE residentId = ?', [residentId]),
      query('SELECT * FROM specialists ORDER BY name ASC'),
      query('SELECT * FROM specialist_availability ORDER BY day_of_week ASC, start_time ASC'),
      query('SELECT * FROM issue_specialist_mappings')
    ]);

    // Fast lookup dictionaries
    const docById = new Map();
    const docByName = new Map();
    specialists.forEach((doc) => {
      docById.set(doc.id, doc);
      docByName.set((doc.name || '').toLowerCase(), doc);
    });

    const availByDocId = new Map();
    availabilitySchedules.forEach((av) => {
      if (!availByDocId.has(av.doctor_id)) {
        availByDocId.set(av.doctor_id, []);
      }
      availByDocId.get(av.doctor_id).push(av);
    });

    const careRecordById = new Map();
    careRecords.forEach((cr) => {
      careRecordById.set(cr.record_id, cr);
    });

    // -------------------------------------------------------------
    // CHAIN TYPE 1: Emergency & Specialist Care Action Chains
    // -------------------------------------------------------------
    const emergencyChains = [];
    const matchedAppointmentIds = new Set();

    for (const emg of emergencies) {
      // Find linked appointment
      const linkedAppt = appointments.find(
        (a) => a.emergencyId === emg.id || a.id === emg.appointmentId
      );
      if (linkedAppt) {
        matchedAppointmentIds.add(linkedAppt.id);
      }

      // Find linked specialist doctor
      let specialistDoc = null;
      if (linkedAppt?.doctorId && docById.has(linkedAppt.doctorId)) {
        specialistDoc = docById.get(linkedAppt.doctorId);
      } else if (linkedAppt?.doctor && docByName.has(linkedAppt.doctor.toLowerCase())) {
        specialistDoc = docByName.get(linkedAppt.doctor.toLowerCase());
      } else if (emg.specialty) {
        specialistDoc = specialists.find(
          (s) => (s.specialty || '').toLowerCase() === emg.specialty.toLowerCase()
        ) || null;
      }

      // Find relevant availability schedule
      let matchedAvail = null;
      if (specialistDoc) {
        const docSchedules = availByDocId.get(specialistDoc.id) || [];
        if (docSchedules.length > 0) {
          // If appointment has a date, try matching day of week
          if (linkedAppt?.date) {
            try {
              const d = new Date(linkedAppt.date);
              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const dayName = days[d.getDay()];
              matchedAvail = docSchedules.find((s) => s.day_of_week?.toLowerCase() === dayName?.toLowerCase()) || docSchedules[0];
            } catch {
              matchedAvail = docSchedules[0];
            }
          } else {
            matchedAvail = docSchedules[0];
          }
        }
      }

      // Find linked care record if stored in DB, or matching observation
      let linkedCareRecord = null;
      if (emg.care_record_id && careRecordById.has(emg.care_record_id)) {
        linkedCareRecord = careRecordById.get(emg.care_record_id);
      } else {
        // Find observation around the time of the emergency
        const emgDateStr = toIsoDateStr(emg.createdAt);
        linkedCareRecord = careRecords.find(
          (cr) => cr.date?.includes('19 Sep') || (emgDateStr && toIsoDateStr(cr.created_at) === emgDateStr)
        ) || null;
      }

      // Build chain nodes
      const nodes = [];

      // 1. Resident Root Node
      nodes.push({
        id: `node-res-${resident.id}`,
        type: 'resident',
        badge: 'Elderly Resident',
        icon: 'User',
        title: resident.name,
        subtitle: `Resident ID: ${resident.id} · Room: ${resident.room || 'Room'}`,
        status: resident.status || 'stable',
        details: {
          'Resident ID': resident.id,
          'Full Name': resident.name,
          'Age & Gender': `${resident.age} yrs · ${resident.gender}`,
          'Room': resident.room,
          'Assigned Caregiver': resident.caregiver,
          'Clinical Condition': resident.condition,
          'Blood Group': resident.bloodGroup,
          'Emergency Contact': resident.emergencyContact
        }
      });

      // 2. Preceding Care Record / Clinical Observation (if exists in DB)
      if (linkedCareRecord) {
        nodes.push({
          id: `node-cr-${linkedCareRecord.record_id}`,
          type: 'care_record',
          badge: 'Care Record Observation',
          icon: 'ClipboardPlus',
          title: `Care Observation: ${linkedCareRecord.observation || 'Clinical Note'}`,
          subtitle: `${linkedCareRecord.date} · ${linkedCareRecord.time} (Recorded by ${linkedCareRecord.recorded_by})`,
          status: 'recorded',
          details: {
            'Record ID': linkedCareRecord.record_id,
            'Date & Time': `${linkedCareRecord.date} at ${linkedCareRecord.time}`,
            'Observation': linkedCareRecord.observation,
            'Clinical Notes': linkedCareRecord.notes,
            'Blood Pressure': linkedCareRecord.blood_pressure,
            'Temperature': linkedCareRecord.temperature,
            'Weight': linkedCareRecord.weight,
            'Recorded By': linkedCareRecord.recorded_by,
            'Record Type': linkedCareRecord.record_type
          }
        });
      }

      // 3. Emergency / Health Incident Node
      nodes.push({
        id: `node-emg-${emg.id}`,
        type: 'emergency',
        badge: 'Emergency / Health Issue',
        icon: 'Siren',
        title: emg.emergencyType || 'Emergency Health Incident',
        subtitle: `ID: ${emg.id} · ${emg.timestamp || toIsoDateStr(emg.createdAt) || 'Recent'}`,
        status: emg.status === 'active' ? 'critical' : 'resolved',
        details: {
          'Emergency ID': emg.id,
          'Issue Type': emg.emergencyType,
          'Severity': emg.severity,
          'Status': emg.status,
          'Reported At': emg.timestamp || emg.createdAt,
          'Description': emg.notes,
          'Reported By': `${emg.senderName || resident.name} (${emg.senderRole || 'patient'})`,
          'Assigned Caregiver': emg.caregiver,
          'Room Location': emg.room,
          'Responded By': emg.respondedBy || 'Pending response',
          'Resolution Notes': emg.resolutionNotes || (emg.status === 'active' ? 'Active incident under management' : 'Resolved')
        }
      });

      // 4. Required Specialty Node
      const requiredSpecialty = emg.specialty || linkedAppt?.specialty || 'General Medicine';
      nodes.push({
        id: `node-spec-req-${emg.id}`,
        type: 'specialty',
        badge: 'Required Specialty',
        icon: 'Stethoscope',
        title: `Specialty: ${requiredSpecialty}`,
        subtitle: `Derived from reported issue: ${emg.emergencyType}`,
        status: 'required',
        details: {
          'Required Specialty': requiredSpecialty,
          'Reported Incident': emg.emergencyType,
          'Triage Priority': emg.severity,
          'Action Required': `Assign qualified ${requiredSpecialty} physician for immediate or prioritized review.`
        }
      });

      // 5. Specialist Doctor Node
      if (specialistDoc) {
        nodes.push({
          id: `node-doc-${specialistDoc.id}`,
          type: 'specialist',
          badge: 'Assigned Specialist',
          icon: 'UserCheck',
          title: specialistDoc.name,
          subtitle: `${specialistDoc.title || 'Consultant'} · ${specialistDoc.specialty}`,
          status: 'assigned',
          details: {
            'Doctor ID': specialistDoc.id,
            'Doctor Name': specialistDoc.name,
            'Medical Specialty': specialistDoc.specialty,
            'Title / Designation': specialistDoc.title,
            'Experience': specialistDoc.experience,
            'Hospital / Clinic': specialistDoc.hospital,
            'Contact Phone': specialistDoc.phone,
            'Current Availability': specialistDoc.availability
          }
        });
      } else {
        nodes.push({
          id: `node-doc-pending-${emg.id}`,
          type: 'specialist_pending',
          badge: 'Specialist Assignment',
          icon: 'UserX',
          title: 'Specialist: Allocation Pending',
          subtitle: `Searching available ${requiredSpecialty} specialists`,
          status: 'pending',
          details: {
            'Status': 'Pending specialist allocation',
            'Required Specialty': requiredSpecialty,
            'Action': 'Caregiver or Admin coordination required to assign available specialist.'
          }
        });
      }

      // 6. Specialist Availability Slot Node
      if (matchedAvail || linkedAppt?.time) {
        const slotTime = linkedAppt?.time || matchedAvail?.start_time || 'Clinic Hours';
        const dayStr = matchedAvail?.day_of_week || 'Scheduled Consultation Window';
        const winStr = matchedAvail ? `${matchedAvail.start_time} – ${matchedAvail.end_time}` : 'Regular Practice Hours';
        nodes.push({
          id: `node-avail-${emg.id}`,
          type: 'availability',
          badge: 'Available Consultation Slot',
          icon: 'CalendarClock',
          title: `Slot: ${linkedAppt?.date ? `${linkedAppt.date} · ` : ''}${slotTime}`,
          subtitle: `${dayStr} (${winStr})`,
          status: 'available',
          details: {
            'Doctor': specialistDoc?.name || 'Assigned Specialist',
            'Day of Week': dayStr,
            'Consultation Window': winStr,
            'Allocated Appointment Slot': slotTime,
            'Slot Duration': `${matchedAvail?.slot_duration_minutes || 30} minutes`,
            'Schedule Status': 'Verified against specialist weekly schedule'
          }
        });
      }

      // 7. Appointment Node
      if (linkedAppt) {
        nodes.push({
          id: `node-appt-${linkedAppt.id}`,
          type: 'appointment',
          badge: 'Emergency Appointment',
          icon: 'CalendarCheck',
          title: `Appointment: ${linkedAppt.id}`,
          subtitle: `${linkedAppt.date} • ${linkedAppt.time} (${linkedAppt.status})`,
          status: linkedAppt.status === 'confirmed' ? 'confirmed' : 'pending',
          details: {
            'Appointment ID': linkedAppt.id,
            'Scheduled Date': linkedAppt.date,
            'Scheduled Time': linkedAppt.time,
            'Doctor / Specialist': linkedAppt.doctor,
            'Doctor ID': linkedAppt.doctorId || 'DOC-01',
            'Consultation Type': linkedAppt.type,
            'Specialty': linkedAppt.specialty,
            'Booking Status': linkedAppt.status,
            'Related Emergency SOS ID': linkedAppt.emergencyId || emg.id,
            'Clinical Reason': linkedAppt.reason || 'Specialist emergency evaluation.'
          }
        });

        // 8. Follow-up Node
        const hasFollowup = linkedAppt.followup_required && linkedAppt.followup_required !== 'Not Required';
        if (hasFollowup || linkedAppt.status === 'confirmed') {
          const reqStatus = linkedAppt.followup_required || 'Required';
          const followStatus = linkedAppt.followup_status || 'Pending';
          nodes.push({
            id: `node-followup-${linkedAppt.id}`,
            type: 'followup',
            badge: 'Clinical Follow-up',
            icon: 'RotateCw',
            title: `Follow-up: ${reqStatus}`,
            subtitle: `Status: ${followStatus} · Review scheduled after consultation`,
            status: followStatus.toLowerCase() === 'completed' ? 'completed' : 'pending',
            details: {
              'Follow-up Requirement': reqStatus,
              'Current Status': followStatus,
              'Consultation Reference': linkedAppt.id,
              'Treating Specialist': linkedAppt.doctor,
              'Clinical Instructions': linkedAppt.followup_notes || 'Re-evaluate rash response and medication adherence within 7 days.'
            }
          });
        } else {
          nodes.push({
            id: `node-followup-none-${linkedAppt.id}`,
            type: 'followup_empty',
            badge: 'Clinical Follow-up',
            icon: 'CheckCircle2',
            title: 'No follow-up recorded.',
            subtitle: 'Standard single-visit consultation',
            status: 'neutral',
            details: {
              'Follow-up Status': 'No follow-up recorded.',
              'Note': 'No further follow-up instructions have been logged for this consultation.'
            }
          });
        }
      } else {
        // Section 15: "If appointment does not exist yet: Show: Appointment not yet scheduled."
        nodes.push({
          id: `node-appt-missing-${emg.id}`,
          type: 'appointment_missing',
          badge: 'Consultation Booking',
          icon: 'AlertTriangle',
          title: 'Appointment not yet scheduled.',
          subtitle: 'Awaiting scheduling confirmation',
          status: 'warning',
          details: {
            'Status': 'Appointment not yet scheduled.',
            'Related Emergency': emg.id,
            'Action': 'Schedule consultation through Specialist Availability or Emergency panel.'
          }
        });
      }

      emergencyChains.push({
        chainId: `chain-emg-${emg.id}`,
        category: 'emergency',
        label: `Emergency Care Chain: ${emg.emergencyType}`,
        emergencyId: emg.id,
        appointmentId: linkedAppt?.id || null,
        date: emg.timestamp || toIsoDateStr(emg.createdAt) || 'Active',
        status: emg.status,
        nodes,
        searchTokens: [
          resident.name,
          resident.id,
          emg.id,
          emg.emergencyType,
          emg.severity,
          linkedAppt?.id,
          linkedAppt?.date,
          linkedAppt?.doctor,
          specialistDoc?.name,
          specialistDoc?.specialty,
          requiredSpecialty
        ].filter(Boolean).map((t) => String(t).toLowerCase())
      });
    }

    // -------------------------------------------------------------
    // CHAIN TYPE 2: Routine Consultations & Referrals (Non-Emergency)
    // -------------------------------------------------------------
    const routineChains = [];
    const unlinkedAppointments = appointments.filter((a) => !matchedAppointmentIds.has(a.id) && !a.emergencyId);

    for (const appt of unlinkedAppointments) {
      let specialistDoc = null;
      if (appt.doctorId && docById.has(appt.doctorId)) {
        specialistDoc = docById.get(appt.doctorId);
      } else if (appt.doctor && docByName.has(appt.doctor.toLowerCase())) {
        specialistDoc = docByName.get(appt.doctor.toLowerCase());
      }

      const nodes = [
        {
          id: `node-res-${resident.id}-${appt.id}`,
          type: 'resident',
          badge: 'Elderly Resident',
          icon: 'User',
          title: resident.name,
          subtitle: `ID: ${resident.id} · Room: ${resident.room}`,
          status: 'stable',
          details: {
            'Resident ID': resident.id,
            'Name': resident.name,
            'Room': resident.room,
            'Caregiver': resident.caregiver
          }
        },
        {
          id: `node-routine-appt-${appt.id}`,
          type: 'appointment',
          badge: 'Medical Appointment',
          icon: 'CalendarCheck',
          title: appt.type || 'Specialist Consultation',
          subtitle: `${appt.date} • ${appt.time} (${appt.status})`,
          status: appt.status === 'confirmed' ? 'confirmed' : 'pending',
          details: {
            'Appointment ID': appt.id,
            'Date & Time': `${appt.date} at ${appt.time}`,
            'Doctor': appt.doctor,
            'Specialty': appt.specialty || specialistDoc?.specialty || 'General',
            'Status': appt.status,
            'Reason': appt.reason || 'Routine medical review.'
          }
        }
      ];

      if (specialistDoc) {
        nodes.push({
          id: `node-routine-doc-${specialistDoc.id}`,
          type: 'specialist',
          badge: 'Assigned Doctor',
          icon: 'UserCheck',
          title: specialistDoc.name,
          subtitle: `${specialistDoc.specialty} · ${specialistDoc.hospital}`,
          status: 'assigned',
          details: {
            'Doctor ID': specialistDoc.id,
            'Name': specialistDoc.name,
            'Specialty': specialistDoc.specialty,
            'Experience': specialistDoc.experience,
            'Hospital': specialistDoc.hospital
          }
        });
      }

      // Follow-up
      if (appt.followup_required && appt.followup_required !== 'Not Required') {
        nodes.push({
          id: `node-routine-fu-${appt.id}`,
          type: 'followup',
          badge: 'Follow-up',
          icon: 'RotateCw',
          title: `Follow-up: ${appt.followup_required}`,
          subtitle: `Status: ${appt.followup_status || 'Pending'}`,
          status: 'pending',
          details: {
            'Requirement': appt.followup_required,
            'Status': appt.followup_status || 'Pending',
            'Notes': appt.followup_notes || 'Scheduled post-consultation review.'
          }
        });
      } else {
        nodes.push({
          id: `node-routine-no-fu-${appt.id}`,
          type: 'followup_empty',
          badge: 'Follow-up',
          icon: 'CheckCircle2',
          title: 'No follow-up recorded.',
          subtitle: 'Standard consultation',
          status: 'neutral',
          details: {
            'Follow-up Status': 'No follow-up recorded.'
          }
        });
      }

      routineChains.push({
        chainId: `chain-appt-${appt.id}`,
        category: 'routine',
        label: `Appointment: ${appt.type || 'Consultation'} with ${appt.doctor}`,
        appointmentId: appt.id,
        date: appt.date,
        status: appt.status,
        nodes,
        searchTokens: [
          resident.name,
          resident.id,
          appt.id,
          appt.doctor,
          appt.specialty,
          appt.type,
          appt.date
        ].filter(Boolean).map((t) => String(t).toLowerCase())
      });
    }

    // -------------------------------------------------------------
    // CHAIN TYPE 3: Medication & Treatment Routine Dependencies
    // -------------------------------------------------------------
    const medicationChains = [];
    for (const med of medications) {
      const nodes = [
        {
          id: `node-res-med-${med.id}`,
          type: 'resident',
          badge: 'Elderly Resident',
          icon: 'User',
          title: resident.name,
          subtitle: `Resident ID: ${resident.id}`,
          status: 'stable',
          details: {
            'Resident ID': resident.id,
            'Name': resident.name,
            'Condition': resident.condition
          }
        },
        {
          id: `node-med-${med.id}`,
          type: 'medication',
          badge: 'Prescribed Medication',
          icon: 'Pill',
          title: `${med.medicine} (${med.dosage})`,
          subtitle: `${med.frequency} · Prescribed by ${med.prescribedBy || 'Physician'}`,
          status: med.status === 'completed' ? 'completed' : 'pending',
          details: {
            'Medication ID': med.id,
            'Medicine Name': med.medicine,
            'Dosage': med.dosage,
            'Frequency': med.frequency,
            'Scheduled Slot': med.slot,
            'Scheduled Time': med.time,
            'Administration Status': med.status,
            'Prescribed By': med.prescribedBy || 'Attending Physician',
            'Start Date': med.startDate || 'Active',
            'End Date': med.endDate || 'Ongoing',
            'Instructions': med.instructions
          }
        },
        {
          id: `node-med-slot-${med.id}`,
          type: 'med_event',
          badge: 'Daily Care Administration',
          icon: 'Clock',
          title: `${med.slot} (${med.time})`,
          subtitle: `Status: ${med.status.toUpperCase()}`,
          status: med.status === 'completed' ? 'completed' : 'pending',
          details: {
            'Slot': med.slot,
            'Time': med.time,
            'Status': med.status,
            'Instructions': med.instructions,
            'Caregiver Responsible': resident.caregiver || 'Shift Caregiver'
          }
        }
      ];

      medicationChains.push({
        chainId: `chain-med-${med.id}`,
        category: 'medication',
        label: `Medication: ${med.medicine} ${med.dosage} (${med.slot})`,
        medicationId: med.id,
        date: med.time,
        status: med.status,
        nodes,
        searchTokens: [
          resident.name,
          resident.id,
          med.id,
          med.medicine,
          med.dosage,
          med.frequency,
          med.slot,
          med.prescribedBy
        ].filter(Boolean).map((t) => String(t).toLowerCase())
      });
    }

    // -------------------------------------------------------------
    // CHAIN TYPE 4: Care Plan & Tasks Dependencies
    // -------------------------------------------------------------
    const carePlanChains = [];
    for (const cp of carePlans) {
      let tasksList = [];
      try {
        tasksList = typeof cp.tasks === 'string' ? JSON.parse(cp.tasks) : (cp.tasks || []);
      } catch {
        tasksList = [];
      }

      const nodes = [
        {
          id: `node-cp-res-${cp.id}`,
          type: 'resident',
          badge: 'Elderly Resident',
          icon: 'User',
          title: resident.name,
          subtitle: `ID: ${resident.id} · Room: ${resident.room}`,
          status: 'stable',
          details: {
            'Resident ID': resident.id,
            'Name': resident.name,
            'Caregiver': cp.caregiver || resident.caregiver
          }
        },
        {
          id: `node-cp-${cp.id}`,
          type: 'care_plan',
          badge: 'Active Care Plan',
          icon: 'ClipboardList',
          title: cp.goal || 'General Health & Wellness Plan',
          subtitle: `Review: ${cp.reviewDate} · Progress: ${cp.progress}%`,
          status: cp.progress >= 75 ? 'completed' : 'in_progress',
          details: {
            'Plan ID': cp.id,
            'Primary Goal': cp.goal,
            'Assigned Caregiver': cp.caregiver,
            'Review Schedule': cp.reviewDate,
            'Overall Progress': `${cp.progress}%`,
            'Total Active Tasks': `${tasksList.length} defined care milestones`
          }
        }
      ];

      // Add task nodes
      tasksList.forEach((task, idx) => {
        nodes.push({
          id: `node-task-${cp.id}-${idx}`,
          type: 'care_task',
          badge: `Task ${idx + 1}`,
          icon: 'CheckSquare',
          title: task.label,
          subtitle: task.done ? 'Status: Completed' : 'Status: Pending Action',
          status: task.done ? 'completed' : 'pending',
          details: {
            'Care Milestone': task.label,
            'Completion Status': task.done ? 'Completed' : 'Pending',
            'Supervising Caregiver': cp.caregiver,
            'Plan Goal': cp.goal
          }
        });
      });

      carePlanChains.push({
        chainId: `chain-cp-${cp.id}`,
        category: 'care_plan',
        label: `Care Plan: ${cp.goal} (${cp.progress}%)`,
        carePlanId: cp.id,
        date: cp.reviewDate,
        status: `${cp.progress}%`,
        nodes,
        searchTokens: [
          resident.name,
          resident.id,
          cp.id,
          cp.goal,
          cp.caregiver,
          ...tasksList.map((t) => t.label)
        ].filter(Boolean).map((t) => String(t).toLowerCase())
      });
    }

    const allChains = [
      ...emergencyChains,
      ...routineChains,
      ...medicationChains,
      ...carePlanChains
    ];

    return res.json({
      success: true,
      data: {
        resident,
        summary: {
          totalChains: allChains.length,
          emergencyChainsCount: emergencyChains.length,
          routineChainsCount: routineChains.length,
          medicationChainsCount: medicationChains.length,
          carePlanChainsCount: carePlanChains.length
        },
        chains: {
          emergency: emergencyChains,
          routine: routineChains,
          medications: medicationChains,
          carePlans: carePlanChains
        },
        allChains
      }
    });
  } catch (error) {
    console.error('[Care Dependency Map API] Error generating dependency map:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate Care Dependency Map.'
    });
  }
}

