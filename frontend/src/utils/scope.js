// ============================================================
// Role-based data scoping utilities.
//
// This is the single place that decides what a logged-in user is
// allowed to see. Every page imports these helpers instead of the
// raw dummy-data arrays directly, so privacy rules (especially the
// Family role's "only my resident" rule) are enforced consistently
// everywhere: dashboards, directories, search, notifications, the
// chatbot, and the Care Assistant.
// ============================================================

import { elderlyResidents } from '../data/dummyData';

/** Resident records the current user is allowed to see. */
export function getScopedResidents(user, allResidents = elderlyResidents) {
  const list = allResidents || elderlyResidents;
  if (!user) return [];
  switch (user.role) {
    case 'admin':
    case 'doctor':
      return list;
    case 'caregiver':
      return list.filter((r) => r.caregiver === user.caregiverName || r.caregiver === user.name);
    case 'family':
    case 'patient':
      return list.filter((r) => r.id === user.residentId);
    default:
      return [];
  }
}

/** The single resident a Family or Patient account is tied to (or null). */
export function getPrimaryResident(user, allResidents = elderlyResidents) {
  const list = allResidents || elderlyResidents;
  if (!user || (user.role !== 'family' && user.role !== 'patient')) return null;
  return list.find((r) => r.id === user.residentId) || null;
}

/** Set of resident IDs visible to the current user — fast membership checks. */
export function getScopedResidentIds(user, allResidents = elderlyResidents) {
  return new Set(getScopedResidents(user, allResidents).map((r) => r.id));
}

/**
 * Filters any list of records down to the ones tied to a resident the
 * user can see. `idKey` is the field on each record that holds the
 * resident id (e.g. 'patientId' on medications/appointments, 'residentId'
 * on documents/carePlans/notifications).
 */
export function scopeByResident(user, list, idKey = 'patientId') {
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'doctor') return list;
  const ids = getScopedResidentIds(user);
  return list.filter((item) => ids.has(item[idKey]));
}

/** Caregivers visible to the current user (admin sees all; others see none/self). */
export function getScopedCaregivers(user, caregivers) {
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'doctor') return caregivers;
  if (user.role === 'caregiver') return caregivers.filter((c) => c.name === user.caregiverName);
  return [];
}

/**
 * Target roles for medication reminder based on sender role:
 * 1. Admin sends -> Patient, Patient's Family, assigned Caregiver (Admin NEVER receives it).
 * 2. Caregiver sends -> Patient only.
 * 3. Family sends -> Patient only.
 * 4. Patient sends -> Patient only.
 */
export function getReminderTargetRoles(senderRole) {
  switch (senderRole) {
    case 'admin':
      return ['patient', 'family', 'caregiver'];
    case 'caregiver':
      return ['patient'];
    case 'family':
      return ['patient'];
    case 'patient':
      return ['patient'];
    default:
      return ['patient'];
  }
}

/**
 * Determines whether a given medication reminder is visible to the currentUser.
 */
export function isReminderForUser(reminder, currentUser, residentList = []) {
  if (!currentUser || !reminder) return false;

  // Rule: Admin NEVER receives medication reminder popups / notifications ("adminke vara koodathu")
  if (currentUser.role === 'admin') {
    return false;
  }

  const senderRole = reminder.senderRole || 'admin';
  const targetRoles = reminder.targetRoles || getReminderTargetRoles(senderRole);

  if (!targetRoles.includes(currentUser.role)) {
    return false;
  }

  const patientId = reminder.patientId || reminder.residentId;
  const patientName = reminder.patient;

  // Patient: Only if this reminder is for this patient
  if (currentUser.role === 'patient') {
    if (patientId && currentUser.residentId) {
      return patientId === currentUser.residentId;
    }
    if (patientName && currentUser.name) {
      return patientName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
    }
    return true;
  }

  // Family: Only if Admin sent it AND this reminder is for this family's resident
  if (currentUser.role === 'family') {
    if (senderRole !== 'admin') return false;
    if (patientId && currentUser.residentId) {
      return patientId === currentUser.residentId;
    }
    return false;
  }

  // Caregiver: Only if Admin sent it AND this caregiver is assigned to this resident
  if (currentUser.role === 'caregiver') {
    if (senderRole !== 'admin') return false;
    const cgName = (currentUser.caregiverName || currentUser.name || '').trim().toLowerCase();
    if (reminder.caregiver) {
      return reminder.caregiver.trim().toLowerCase() === cgName;
    }
    const resident = residentList.find((r) => r.id === patientId);
    if (resident && resident.caregiver) {
      return resident.caregiver.trim().toLowerCase() === cgName;
    }
    return true;
  }

  return false;
}

/**
 * Notifications are scoped by resident, except facility-wide / caregiver
 * shift notices which only admins and caregivers should see.
 */
export function scopeNotifications(user, notifications, allResidents = []) {
  if (!user) return [];

  return notifications.filter((n) => {
    // Special routing rules for medication reminders:
    if (n.type === 'medication' || n.type === 'medication_reminder') {
      // Admin NEVER receives medication reminder notifications ("adminke vara koodathu")
      if (user.role === 'admin') {
        return false;
      }
      return isReminderForUser(n, user, allResidents);
    }

    // Special routing rules for emergency notifications:
    if (n.type === 'emergency') {
      // 1. Patient role must NEVER receive incoming emergency notifications
      if (user.role === 'patient') {
        return false;
      }

      // 2. Admin always receives all emergency notifications
      if (user.role === 'admin') {
        return true;
      }

      // 3. Caregiver receives emergency alerts ONLY for assigned elderly persons
      if (user.role === 'caregiver') {
        const ids = getScopedResidentIds(user, allResidents);
        return !n.residentId || ids.has(n.residentId);
      }

      // 4. Family receives emergency alerts only for their assigned resident
      if (user.role === 'family') {
        const ids = getScopedResidentIds(user, allResidents);
        return n.residentId && ids.has(n.residentId);
      }

      return false;
    }

    // Standard non-emergency notifications scoping:
    if (user.role === 'admin') return true;
    if (user.role === 'caregiver') {
      const ids = getScopedResidentIds(user, allResidents);
      return !n.residentId || ids.has(n.residentId) || n.forStaff;
    }
    // family & patient: resident-tagged notifications for their own resident only
    const ids = getScopedResidentIds(user, allResidents);
    return n.residentId && ids.has(n.residentId);
  });
}

/**
 * A permission-aware global text search across residents, medications,
 * appointments, activities and documents. Family accounts can never
 * discover another resident's data through search, because every
 * source array has already been scoped before filter()/includes() run.
 */
export function scopedSearch(user, query, data) {
  const q = query.trim().toLowerCase();
  if (!q) return { residents: [], medications: [], appointments: [], documents: [] };

  const residents = getScopedResidents(user).filter(
    (r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
  );
  const medications = scopeByResident(user, data.medications, 'patientId').filter(
    (m) => m.medicine.toLowerCase().includes(q) || m.patient.toLowerCase().includes(q)
  );
  const appointments = scopeByResident(user, data.appointments, 'patientId').filter(
    (a) => a.type.toLowerCase().includes(q) || a.patient.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q)
  );
  const documents = scopeByResident(user, data.documents, 'residentId').filter(
    (d) => d.name.toLowerCase().includes(q) || d.patient.toLowerCase().includes(q)
  );

  return { residents, medications, appointments, documents };
}
