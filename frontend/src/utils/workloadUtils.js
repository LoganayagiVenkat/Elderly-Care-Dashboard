// ============================================================
// ElderCare — Caregiver Workload Balancer Utility Functions
// Centralized, transparent operational workload calculation engine.
// Strictly analyzes administrative & operational care load.
// No sensors, IoT, or fake random numbers.
// ============================================================

import { toISODate } from './dateUtils.js';

export const WORKLOAD_LEVELS = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
};

// Centralized score thresholds
export const WORKLOAD_THRESHOLDS = {
  LOW_MAX: 10.0,
  MODERATE_MAX: 18.0,
  MAX_SCALE: 25.0, // Used for normalizing progress percentage (0 - 100%)
};

// Healthcare theme status color mappings
export const WORKLOAD_THEME = {
  LOW: {
    bg: '#E8F1EE',       // Soft Green
    fg: '#245548',       // Deep Green
    border: '#6F9F91',   // Muted Green
    bar: '#2F6F5E',      // Primary Green
    label: 'Low Workload',
    shortLabel: 'LOW',
    tagClass: 'workload-badge-low',
  },
  MODERATE: {
    bg: '#FEF3C7',       // Soft Amber
    fg: '#92400E',       // Warm Ochre
    border: '#FCD34D',   // Amber Border
    bar: '#D97706',      // Amber Fill
    label: 'Moderate Workload',
    shortLabel: 'MODERATE',
    tagClass: 'workload-badge-moderate',
  },
  HIGH: {
    bg: '#FEE2E2',       // Soft Coral/Red
    fg: '#991B1B',       // Deep Crimson
    border: '#FCA5A5',   // Coral Border
    bar: '#DC2626',      // Alert Red Fill
    label: 'High Workload',
    shortLabel: 'HIGH',
    tagClass: 'workload-badge-high',
  },
};

// Transparent scoring weights
export const WORKLOAD_WEIGHTS = {
  ASSIGNED_RESIDENT: 2.0,   // Ongoing primary resident care oversight
  PENDING_TASK: 1.5,        // Active operational care task
  OVERDUE_TASK: 2.5,        // Delayed task requiring urgent catch-up
  TODAY_APPOINTMENT: 1.5,   // Clinical review or escort duty today
  PENDING_MEDICATION: 1.0,  // Scheduled medication round pending
  FACILITATED_ACTIVITY: 1.0,// Scheduled activity facilitation
  ACTIVE_EMERGENCY: 3.0,    // Critical active emergency dispatch
};

/**
 * Parses time strings such as "08:30 AM" or "02:00 PM" into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr = '') {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(' ');
  if (parts.length < 2) return 0;
  const [time, meridian] = parts;
  const [hoursStr, minsStr] = time.split(':');
  let hours = parseInt(hoursStr, 10) || 0;
  const mins = parseInt(minsStr, 10) || 0;
  const isPM = (meridian || '').toUpperCase() === 'PM';
  const isAM = (meridian || '').toUpperCase() === 'AM';

  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + mins;
}

/**
 * Determines whether a care task is overdue based on completion status,
 * due date, and due time against current clock.
 */
export function isTaskOverdue(task, now = new Date()) {
  if (!task || task.status === 'completed' || task.done === true) {
    return false;
  }
  if (task.status === 'overdue' || task.isOverdue === true) {
    return true;
  }

  const todayStr = toISODate(now);
  const taskDate = task.dueDate || task.date || todayStr;

  // Past calendar day
  if (taskDate < todayStr) {
    return true;
  }

  // Same day check by time
  if (taskDate === todayStr && task.dueTime) {
    const taskMinutes = parseTimeToMinutes(task.dueTime);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // Allow a 15-minute grace window before flagging overdue
    if (currentMinutes > taskMinutes + 15) {
      return true;
    }
  }

  return false;
}

/**
 * Dynamically calculates the operational workload for a given caregiver.
 * Centralized reusable calculation function.
 */
export function calculateCaregiverWorkload(caregiver, {
  residents = [],
  careTasks = [],
  carePlans = [],
  appointments = [],
  medications = [],
  activities = [],
  emergencyAlerts = [],
  now = new Date(),
} = {}) {
  if (!caregiver) return null;

  const cgName = (caregiver.name || '').trim().toLowerCase();
  const todayISO = toISODate(now);

  // 1. Assigned Residents
  const assignedResidents = residents.filter(
    (r) => (r.caregiver || '').trim().toLowerCase() === cgName
  );
  const assignedResidentIds = new Set(assignedResidents.map((r) => r.id));
  const assignedResidentNames = new Set(assignedResidents.map((r) => (r.name || '').trim().toLowerCase()));

  // 2. Care Tasks assigned to caregiver or their primary residents
  const cgTasks = careTasks.filter((t) => {
    const directMatch = (t.caregiver || '').trim().toLowerCase() === cgName;
    const residentMatch = t.residentId && assignedResidentIds.has(t.residentId);
    return directMatch || (!t.caregiver && residentMatch);
  });

  const completedTasks = cgTasks.filter((t) => t.status === 'completed' || t.done === true);
  const overdueTasks = cgTasks.filter((t) => isTaskOverdue(t, now));
  const pendingTasks = cgTasks.filter((t) => {
    const isCompleted = t.status === 'completed' || t.done === true;
    const isOverdueTask = overdueTasks.some((o) => o.id === t.id);
    return !isCompleted && !isOverdueTask;
  });

  // 3. Care Plan Tasks (from carePlans state)
  const relevantCarePlans = carePlans.filter((cp) => {
    const planCaregiver = (cp.caregiver || '').trim().toLowerCase();
    return planCaregiver === cgName || (cp.residentId && assignedResidentIds.has(cp.residentId));
  });

  // 4. Today's Appointments requiring caregiver involvement
  const todayAppointments = appointments.filter((a) => {
    const isToday = a.date === todayISO;
    if (!isToday) return false;
    const directCg = (a.caregiver || '').trim().toLowerCase() === cgName;
    const ptName = (a.patient || '').trim().toLowerCase();
    const ptId = a.patientId;
    const residentMatch = (ptId && assignedResidentIds.has(ptId)) || assignedResidentNames.has(ptName);
    return directCg || residentMatch;
  });

  // 5. Medication tasks pending for caregiver's residents today
  const pendingMedications = medications.filter((m) => {
    const ptName = (m.patient || '').trim().toLowerCase();
    const ptId = m.patientId;
    const residentMatch = (ptId && assignedResidentIds.has(ptId)) || assignedResidentNames.has(ptName);
    const isPendingOrMissed = m.status === 'pending' || m.status === 'missed';
    return residentMatch && isPendingOrMissed;
  });

  // 6. Activities facilitated by this caregiver today
  const facilitatedActivities = activities.filter((act) => {
    const fac = (act.facilitator || '').trim().toLowerCase();
    return fac === cgName && act.status !== 'completed';
  });

  // 7. Active emergencies involving this caregiver or their residents
  const activeEmergencies = emergencyAlerts.filter((emg) => {
    const isActive = emg.status === 'active' || emg.status === 'in_progress';
    if (!isActive) return false;
    const emgCg = (emg.caregiver || emg.respondedBy || '').trim().toLowerCase();
    const emgResId = emg.residentId;
    return emgCg === cgName || (emgResId && assignedResidentIds.has(emgResId));
  });

  // Transparent scoring breakdown
  const residentPoints = assignedResidents.length * WORKLOAD_WEIGHTS.ASSIGNED_RESIDENT;
  const pendingTaskPoints = pendingTasks.length * WORKLOAD_WEIGHTS.PENDING_TASK;
  const overdueTaskPoints = overdueTasks.length * WORKLOAD_WEIGHTS.OVERDUE_TASK;
  const apptPoints = todayAppointments.length * WORKLOAD_WEIGHTS.TODAY_APPOINTMENT;
  const medPoints = pendingMedications.length * WORKLOAD_WEIGHTS.PENDING_MEDICATION;
  const actPoints = facilitatedActivities.length * WORKLOAD_WEIGHTS.FACILITATED_ACTIVITY;
  const emgPoints = activeEmergencies.length * WORKLOAD_WEIGHTS.ACTIVE_EMERGENCY;

  const rawScore = residentPoints + pendingTaskPoints + overdueTaskPoints + apptPoints + medPoints + actPoints + emgPoints;
  const score = Math.round(rawScore * 10) / 10;

  // Determine Level based on strict transparent thresholds
  let level = WORKLOAD_LEVELS.LOW;
  if (score > WORKLOAD_THRESHOLDS.MODERATE_MAX) {
    level = WORKLOAD_LEVELS.HIGH;
  } else if (score >= WORKLOAD_THRESHOLDS.LOW_MAX) {
    level = WORKLOAD_LEVELS.MODERATE;
  }

  // Normalized capacity percentage (0 - 100%)
  const capacityPct = Math.min(100, Math.round((score / WORKLOAD_THRESHOLDS.MAX_SCALE) * 100));

  const totalAllTasks = completedTasks.length + pendingTasks.length + overdueTasks.length;

  return {
    caregiverId: caregiver.id,
    caregiverName: caregiver.name,
    initials: caregiver.initials || (caregiver.name || 'CG').slice(0, 2).toUpperCase(),
    role: caregiver.role || 'Care Assistant',
    shift: caregiver.shift || 'Morning Shift',
    availability: caregiver.availability || 'On Duty',
    status: caregiver.status || 'active',
    phone: caregiver.phone || '',
    experience: caregiver.experience || '1 year',

    // Calculated metrics
    score,
    level,
    capacityPct,
    theme: WORKLOAD_THEME[level],

    // Item counts
    assignedResidentCount: assignedResidents.length,
    pendingTaskCount: pendingTasks.length,
    completedTaskCount: completedTasks.length,
    overdueTaskCount: overdueTasks.length,
    totalTaskCount: totalAllTasks,
    appointmentCount: todayAppointments.length,
    medicationCount: pendingMedications.length,
    activityCount: facilitatedActivities.length,
    emergencyCount: activeEmergencies.length,

    // Lists for drilldown breakdown
    assignedResidents,
    pendingTasks,
    completedTasks,
    overdueTasks,
    allTasks: cgTasks,
    todayAppointments,
    pendingMedications,
    facilitatedActivities,
    activeEmergencies,
    relevantCarePlans,

    // Mathematical formula breakdown for UI transparency
    breakdown: [
      {
        factor: 'Assigned Residents',
        count: assignedResidents.length,
        weight: WORKLOAD_WEIGHTS.ASSIGNED_RESIDENT,
        points: residentPoints,
        unit: 'residents',
      },
      {
        factor: 'Pending Care Tasks',
        count: pendingTasks.length,
        weight: WORKLOAD_WEIGHTS.PENDING_TASK,
        points: pendingTaskPoints,
        unit: 'tasks',
      },
      {
        factor: 'Overdue Care Tasks',
        count: overdueTasks.length,
        weight: WORKLOAD_WEIGHTS.OVERDUE_TASK,
        points: overdueTaskPoints,
        unit: 'overdue',
        urgent: overdueTasks.length > 0,
      },
      {
        factor: "Today's Appointments",
        count: todayAppointments.length,
        weight: WORKLOAD_WEIGHTS.TODAY_APPOINTMENT,
        points: apptPoints,
        unit: 'appts',
      },
      {
        factor: 'Medication Rounds Pending',
        count: pendingMedications.length,
        weight: WORKLOAD_WEIGHTS.PENDING_MEDICATION,
        points: medPoints,
        unit: 'doses',
      },
      {
        factor: 'Scheduled Activities',
        count: facilitatedActivities.length,
        weight: WORKLOAD_WEIGHTS.FACILITATED_ACTIVITY,
        points: actPoints,
        unit: 'sessions',
      },
      {
        factor: 'Active Emergency Alerts',
        count: activeEmergencies.length,
        weight: WORKLOAD_WEIGHTS.ACTIVE_EMERGENCY,
        points: emgPoints,
        unit: 'alerts',
        urgent: activeEmergencies.length > 0,
      },
    ],
  };
}

/**
 * Calculates workloads for all caregivers in the system.
 */
export function calculateAllCaregiverWorkloads(caregivers = [], data = {}) {
  if (!Array.isArray(caregivers)) return [];
  return caregivers.map((cg) => calculateCaregiverWorkload(cg, data)).filter(Boolean);
}

/**
 * Detects whether there is a workload imbalance across the staff.
 * Flags when at least one caregiver has HIGH workload while another on-duty caregiver has LOW/MODERATE.
 */
export function detectWorkloadImbalance(workloadList = []) {
  if (!Array.isArray(workloadList) || workloadList.length < 2) {
    return { hasImbalance: false, overloadedCaregivers: [], underloadedCaregivers: [] };
  }

  // Only consider active/on-duty caregivers for practical operational rebalancing
  const onDutyList = workloadList.filter(
    (w) => w.availability === 'On Duty' || w.status === 'active'
  );

  const overloadedCaregivers = onDutyList.filter((w) => w.level === WORKLOAD_LEVELS.HIGH);
  const underloadedCaregivers = onDutyList.filter((w) => w.level === WORKLOAD_LEVELS.LOW);
  const moderateCaregivers = onDutyList.filter((w) => w.level === WORKLOAD_LEVELS.MODERATE);

  const hasImbalance = overloadedCaregivers.length > 0 && (underloadedCaregivers.length > 0 || moderateCaregivers.length > 0);

  let recommendation = null;
  if (hasImbalance) {
    const highest = overloadedCaregivers.slice().sort((a, b) => b.score - a.score)[0];
    const lowest = underloadedCaregivers.slice().sort((a, b) => a.score - b.score)[0] || moderateCaregivers[0];

    const diffPending = Math.max(0, highest.pendingTaskCount - lowest.pendingTaskCount);
    recommendation = {
      source: highest,
      target: lowest,
      diffPending,
      summaryText: `${highest.caregiverName} (${highest.level}) currently has ${highest.pendingTaskCount} pending tasks and ${highest.overdueTaskCount} overdue, while ${lowest.caregiverName} (${lowest.level}) has ${lowest.pendingTaskCount} pending tasks.`,
    };
  }

  return {
    hasImbalance,
    overloadedCaregivers,
    underloadedCaregivers,
    moderateCaregivers,
    recommendation,
  };
}

/**
 * Returns the recommended caregiver for new task assignment
 * based SOLELY on current workload calculation (lowest score among available on-duty staff).
 * Does not make clinical decisions.
 */
export function getSuggestedCaregiver(workloadList = [], { excludeCaregiverName = null } = {}) {
  if (!Array.isArray(workloadList) || workloadList.length === 0) return null;

  const candidates = workloadList.filter((w) => {
    const isExcluded = excludeCaregiverName && (w.caregiverName || '').toLowerCase() === excludeCaregiverName.toLowerCase();
    const isAvailable = w.availability === 'On Duty' || w.availability === 'On Call';
    return !isExcluded && isAvailable;
  });

  if (candidates.length === 0) {
    return workloadList[0] || null;
  }

  // Sort by lowest score, then lowest pending tasks, then lowest overdue
  candidates.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.pendingTaskCount !== b.pendingTaskCount) return a.pendingTaskCount - b.pendingTaskCount;
    return a.overdueTaskCount - b.overdueTaskCount;
  });

  return candidates[0];
}

/**
 * Initial seed Care Tasks linked to existing caregivers and residents.
 * Realistically distributes tasks to demonstrate balanced vs overloaded states.
 */
export function getInitialCareTasks(todayISO = toISODate(new Date())) {
  return [
    // Priya Nair (Assigned: Lakshmi Devi, Govind Pillai) - Balanced
    {
      id: 'TSK-101',
      title: 'Morning Vitals & Blood Pressure Check',
      category: 'clinical',
      residentId: 'EC-001',
      residentName: 'Lakshmi Devi',
      room: 'Willow Room 4',
      caregiver: 'Priya Nair',
      dueDate: todayISO,
      dueTime: '08:00 AM',
      priority: 'high',
      status: 'completed',
      completedAt: '07:55 AM',
      notes: 'Check resting systolic BP before morning Amlodipine dosage.',
    },
    {
      id: 'TSK-102',
      title: 'Mobility Walk & Posture Guidance',
      category: 'mobility',
      residentId: 'EC-001',
      residentName: 'Lakshmi Devi',
      room: 'Willow Room 4',
      caregiver: 'Priya Nair',
      dueDate: todayISO,
      dueTime: '04:30 PM',
      priority: 'medium',
      status: 'pending',
      completedAt: null,
      notes: 'Assisted 15-minute garden walk with low-sodium hydration.',
    },
    {
      id: 'TSK-103',
      title: 'Fluid Intake & Renal Log Assessment',
      category: 'clinical',
      residentId: 'EC-006',
      residentName: 'Govind Pillai',
      room: 'Sage Room 1',
      caregiver: 'Priya Nair',
      dueDate: todayISO,
      dueTime: '05:00 PM',
      priority: 'medium',
      status: 'pending',
      completedAt: null,
      notes: 'Record total daily water intake and measure lower extremity edema.',
    },

    // Anand Raj (Assigned: Meenakshi Raman, Subramaniam Iyer) - High Workload & Overdue items
    {
      id: 'TSK-201',
      title: 'Manual Pulse & Cardiac Vitals Round',
      category: 'clinical',
      residentId: 'EC-004',
      residentName: 'Subramaniam Iyer',
      room: 'Sage Room 5',
      caregiver: 'Anand Raj',
      dueDate: todayISO,
      dueTime: '07:30 AM',
      priority: 'high',
      status: 'completed',
      completedAt: '07:35 AM',
      notes: 'Verify regular sinus rhythm and log resting heart rate.',
    },
    {
      id: 'TSK-202',
      title: 'Furosemide & Antiplatelet Administration Check',
      category: 'medication',
      residentId: 'EC-004',
      residentName: 'Subramaniam Iyer',
      room: 'Sage Room 5',
      caregiver: 'Anand Raj',
      dueDate: todayISO,
      dueTime: '08:30 AM',
      priority: 'high',
      status: 'overdue',
      isOverdue: true,
      completedAt: null,
      notes: 'Urgent check: verify morning diuretic was taken with breakfast.',
    },
    {
      id: 'TSK-203',
      title: 'Assisted Transfer & Walker Mobility Session',
      category: 'mobility',
      residentId: 'EC-002',
      residentName: 'Meenakshi Raman',
      room: 'Sage Room 2',
      caregiver: 'Anand Raj',
      dueDate: todayISO,
      dueTime: '09:30 AM',
      priority: 'medium',
      status: 'overdue',
      isOverdue: true,
      completedAt: null,
      notes: 'Physiotherapy assistance with walking frame. Delayed due to emergency drill.',
    },
    {
      id: 'TSK-204',
      title: 'Post-Breakfast Hydration & Fall-Risk Evaluation',
      category: 'hygiene',
      residentId: 'EC-002',
      residentName: 'Meenakshi Raman',
      room: 'Sage Room 2',
      caregiver: 'Anand Raj',
      dueDate: todayISO,
      dueTime: '11:30 AM',
      priority: 'medium',
      status: 'pending',
      completedAt: null,
      notes: 'Clear bedroom floor pathways and replenish water pitcher.',
    },
    {
      id: 'TSK-205',
      title: 'Dietary Intake & Low-Sodium Salt Verification',
      category: 'hygiene',
      residentId: 'EC-004',
      residentName: 'Subramaniam Iyer',
      room: 'Sage Room 5',
      caregiver: 'Anand Raj',
      dueDate: todayISO,
      dueTime: '01:30 PM',
      priority: 'low',
      status: 'pending',
      completedAt: null,
      notes: 'Inspect lunch plate compliance and fluid allowance.',
    },
    {
      id: 'TSK-206',
      title: 'Posture Repositioning & Joint Relief Gel Application',
      category: 'mobility',
      residentId: 'EC-002',
      residentName: 'Meenakshi Raman',
      room: 'Sage Room 2',
      caregiver: 'Anand Raj',
      dueDate: todayISO,
      dueTime: '03:00 PM',
      priority: 'medium',
      status: 'pending',
      completedAt: null,
      notes: 'Reposition recliner and support knee joint alignment.',
    },
    {
      id: 'TSK-207',
      title: 'Evening Cardiac Rhythm & Handover Monitoring',
      category: 'clinical',
      residentId: 'EC-004',
      residentName: 'Subramaniam Iyer',
      room: 'Sage Room 5',
      caregiver: 'Anand Raj',
      dueDate: todayISO,
      dueTime: '06:30 PM',
      priority: 'high',
      status: 'pending',
      completedAt: null,
      notes: 'Measure evening blood pressure and prep night shift handover log.',
    },

    // Deepa Suresh (Assigned: Raghavan Kumar, Anitha Sundaram) - Moderate Workload
    {
      id: 'TSK-301',
      title: 'Fasting Blood Sugar Fingerstick Check',
      category: 'clinical',
      residentId: 'EC-003',
      residentName: 'Raghavan Kumar',
      room: 'Willow Room 1',
      caregiver: 'Deepa Suresh',
      dueDate: todayISO,
      dueTime: '07:45 AM',
      priority: 'high',
      status: 'completed',
      completedAt: '07:42 AM',
      notes: 'Glucose recorded at 108 mg/dL. Fasting target met.',
    },
    {
      id: 'TSK-302',
      title: 'Post-Lunch Glucose & Foot Inspection',
      category: 'clinical',
      residentId: 'EC-003',
      residentName: 'Raghavan Kumar',
      room: 'Willow Room 1',
      caregiver: 'Deepa Suresh',
      dueDate: todayISO,
      dueTime: '02:00 PM',
      priority: 'high',
      status: 'pending',
      completedAt: null,
      notes: 'Perform diabetic foot check for pressure spots or redness.',
    },
    {
      id: 'TSK-303',
      title: 'Memory Orientation & Cognitive Card Session',
      category: 'wellness',
      residentId: 'EC-005',
      residentName: 'Anitha Sundaram',
      room: 'Willow Room 6',
      caregiver: 'Deepa Suresh',
      dueDate: todayISO,
      dueTime: '04:00 PM',
      priority: 'medium',
      status: 'pending',
      completedAt: null,
      notes: 'Memory-care flashcards and music recall session.',
    },
    {
      id: 'TSK-304',
      title: 'Evening Donepezil & BP Medication Supervision',
      category: 'medication',
      residentId: 'EC-005',
      residentName: 'Anitha Sundaram',
      room: 'Willow Room 6',
      caregiver: 'Deepa Suresh',
      dueDate: todayISO,
      dueTime: '07:30 PM',
      priority: 'medium',
      status: 'pending',
      completedAt: null,
      notes: 'Ensure evening doses are swallowed completely with water.',
    },

    // Vikram Menon (Registered Nurse, On Call) - Low Workload
    {
      id: 'TSK-401',
      title: 'Facility Emergency Crash Cart & Oxygen Check',
      category: 'clinical',
      residentId: null,
      residentName: 'Facility General',
      room: 'Nurse Station',
      caregiver: 'Vikram Menon',
      dueDate: todayISO,
      dueTime: '08:00 AM',
      priority: 'high',
      status: 'completed',
      completedAt: '08:10 AM',
      notes: 'Inspect emergency kit seals, defibrillator battery, and O2 tanks.',
    },
    {
      id: 'TSK-402',
      title: 'Night Shift Medication Round Preparation',
      category: 'medication',
      residentId: null,
      residentName: 'Facility General',
      room: 'Pharmacy Prep',
      caregiver: 'Vikram Menon',
      dueDate: todayISO,
      dueTime: '10:30 PM',
      priority: 'medium',
      status: 'pending',
      completedAt: null,
      notes: 'Double-check night blister packs and label scheduled dosages.',
    },

    // Suresh Babu (Care Coordinator) - Low Workload
    {
      id: 'TSK-501',
      title: 'Weekly Multi-Disciplinary Care Plan Review',
      category: 'wellness',
      residentId: null,
      residentName: 'Care Team Meeting',
      room: 'Conference Suite',
      caregiver: 'Suresh Babu',
      dueDate: todayISO,
      dueTime: '03:00 PM',
      priority: 'medium',
      status: 'pending',
      completedAt: null,
      notes: 'Coordinate weekly resident review with visiting consultants.',
    },
  ];
}
