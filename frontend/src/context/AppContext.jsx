import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { notifications as seedNotifications, demoUsers, carePlans as seedCarePlans, appointments as seedAppointments, elderlyResidents as seedElderlyResidents, caregivers as seedCaregivers } from '../data/dummyData';
import { scopeNotifications, getReminderTargetRoles, isReminderForUser } from '../utils/scope';
import { getTranslation } from '../utils/i18n';
import api, { healthApi, authApi, appointmentsApi, carePlansApi, emergencyApi, notificationsApi, settingsApi, residentsApi, caregiversApi, voicemailsApi } from '../services/api';
import { getInitialCareTasks, isTaskOverdue } from '../utils/workloadUtils.js';
import { toISODate } from '../utils/dateUtils.js';

const AppContext = createContext(null);

const SESSION_KEY = 'eldercare_session';
const REGISTERED_USERS_KEY = 'eldercare_registered_users';
const SETTINGS_KEY = 'eldercare_settings';
const DEMO_PASSWORDS_KEY = 'eldercare_demo_passwords';
const DEMO_PROFILES_KEY = 'eldercare_demo_profiles';
const RESIDENTS_KEY = 'eldercare_residents';
const CAREGIVERS_KEY = 'eldercare_caregivers';
const CARE_PLANS_KEY = 'eldercare_care_plans';
const APPOINTMENTS_KEY = 'eldercare_appointments';
const EMERGENCY_ALERTS_KEY = 'eldercare_emergency_alerts';
const NOTIFICATIONS_KEY = 'eldercare_notifications';
const REMINDER_QUEUE_KEY = 'eldercare_reminder_queue';
const SCHEDULED_REMINDERS_KEY = 'eldercare_scheduled_reminders';
const CARE_TASKS_KEY = 'eldercare_care_tasks';
export const GOOGLE_SAVED_ACCOUNTS_KEY = 'eldercare_saved_google_accounts';
export const JWT_TOKEN_KEY = 'eldercare_jwt_token';
export const RECENTLY_ACCESSED_KEY = 'eldercare_recently_accessed';
export const VOICEMAILS_KEY = 'eldercare_voicemails';

const SEED_VOICEMAILS = [
  {
    id: 'VM-SEED-01',
    residentId: 'EC-001',
    residentName: 'Lakshmi Devi',
    senderName: 'Lakshmi Devi',
    senderRole: 'patient',
    recipientName: 'Priya Nair',
    recipientRole: 'caregiver',
    category: 'care_instruction',
    subject: 'Morning Knee Mobility Note',
    duration: 22,
    audioUrl: '',
    notes: 'Vanakkam Priya, I am feeling a slight stiffness in my right knee after getting out of bed. Could you bring the knee pain gel before our morning mobility walk? Thank you.',
    emergencyId: null,
    isRead: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'VM-SEED-02',
    residentId: 'EC-003',
    residentName: 'Raghavan Kumar',
    senderName: 'Raghavan Kumar',
    senderRole: 'patient',
    recipientName: 'Deepa Suresh',
    recipientRole: 'caregiver',
    category: 'emergency_sos',
    subject: '⚠️ SOS Voice Distress — Dizziness Episode',
    duration: 18,
    audioUrl: '',
    notes: 'Deepa, I felt very dizzy suddenly while standing up. My blood sugar might be dropping. Please come to Willow Room 1 with the glucose drink quickly.',
    emergencyId: 'SOS-SEED-01',
    isRead: 1,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'VM-SEED-03',
    residentId: 'EC-001',
    residentName: 'Lakshmi Devi',
    senderName: 'Ramesh Devi (Son)',
    senderRole: 'family',
    recipientName: 'Lakshmi Devi',
    recipientRole: 'patient',
    category: 'family_checkin',
    subject: '🌸 Weekend Family Visit Check-in',
    duration: 35,
    audioUrl: '',
    notes: 'Amma, hope you had a good morning! The kids and I will visit this Sunday at 4 PM. Priya said your BP was completely normal today. Take your medicines on time and take care!',
    emergencyId: null,
    isRead: 0,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'VM-SEED-04',
    residentId: 'EC-004',
    residentName: 'Subramaniam Iyer',
    senderName: 'Dr. Kavya Menon',
    senderRole: 'doctor',
    recipientName: 'Anand Raj',
    recipientRole: 'caregiver',
    category: 'care_instruction',
    subject: 'Statin Compliance & Pulse Check Protocol',
    duration: 29,
    audioUrl: '',
    notes: 'Anand, for Subramaniam Iyer, please ensure his pulse is checked prior to administering Digoxin at 2 PM. His ECG shows good stabilization.',
    emergencyId: null,
    isRead: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

function loadStoredVoicemails() {
  try {
    const raw = localStorage.getItem(VOICEMAILS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleanList = parsed.filter((v) => !String(v.id || '').startsWith('VM-SEED-'));
        localStorage.setItem(VOICEMAILS_KEY, JSON.stringify(cleanList));
        return cleanList;
      }
    }
  } catch {}
  return [];
}

function loadStoredRecentlyAccessed() {
  try {
    const raw = localStorage.getItem(RECENTLY_ACCESSED_KEY);
    return raw ? JSON.parse(raw) : [
      { id: 'EC-001', type: 'resident', title: 'Lakshmi Devi', subtitle: 'Willow Room 4 · Stable', path: '/elderly/EC-001', timestamp: Date.now() - 3600000 },
      { id: 'EC-004', type: 'resident', title: 'Subramaniam Iyer', subtitle: 'Sage Room 5 · Critical', path: '/elderly/EC-004', timestamp: Date.now() - 7200000 },
      { id: 'EC-005', type: 'map', title: 'Dependency Map: Anitha', subtitle: 'Topological Chain Analysis', path: '/care-dependency-map/EC-005', timestamp: Date.now() - 10800000 },
    ];
  } catch {
    return [];
  }
}

export function saveGoogleAccountToHistory(account) {
  try {
    const raw = localStorage.getItem(GOOGLE_SAVED_ACCOUNTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const cleanEmail = (account.email || '').trim().toLowerCase();
    if (!cleanEmail) return;
    const filtered = list.filter((a) => (a.email || '').trim().toLowerCase() !== cleanEmail);
    const item = {
      name: account.name || 'Google User',
      email: cleanEmail,
      role: account.role || 'family',
      initials: account.initials || (account.name || 'U').slice(0, 2).toUpperCase(),
      title: account.title || (account.role === 'admin' ? 'System Administrator' : account.role === 'caregiver' ? 'Senior Caregiver' : account.role === 'patient' ? 'Resident' : 'Family Member'),
      picture: account.avatar || account.picture || null,
      isCustom: true
    };
    localStorage.setItem(GOOGLE_SAVED_ACCOUNTS_KEY, JSON.stringify([item, ...filtered]));
  } catch {}
}

function loadStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const storedMap = new Map();
        parsed.forEach((n) => {
          if (n && n.id) {
            const isRead = Boolean(n.isRead ?? n.read);
            storedMap.set(n.id, {
              ...n,
              read: isRead,
              isRead: isRead,
            });
          }
        });

        const list = Array.from(storedMap.values());

        // Keep seed notifications available if not already in storage
        for (const seed of seedNotifications) {
          if (!storedMap.has(seed.id)) {
            const isRead = Boolean(seed.isRead ?? seed.read);
            const normalized = {
              ...seed,
              read: isRead,
              isRead: isRead,
            };
            list.push(normalized);
            storedMap.set(seed.id, normalized);
          }
        }

        return list;
      }
    }
  } catch (err) {
    console.warn('[AppContext] Failed to load notifications from localStorage:', err);
  }

  const initial = seedNotifications.map((n) => {
    const isRead = Boolean(n.isRead ?? n.read);
    return {
      ...n,
      read: isRead,
      isRead: isRead,
    };
  });

  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initial));
  } catch {}

  return initial;
}

const seedEmergencyAlerts = [
  {
    id: 'SOS-SEED-01',
    residentId: 'EC-003',
    residentName: 'Raghavan Kumar',
    room: 'Willow Room 1',
    condition: 'Type 2 Diabetes',
    bloodGroup: 'A+',
    caregiver: 'Deepa Suresh',
    emergencyContact: 'Deepak Kumar · Son · +91 94441 88900',
    emergencyType: 'Dizziness & Low Blood Sugar',
    notes: 'Resident experienced sudden dizziness after morning activity. Glucose administered and stabilized.',
    severity: 'HIGH',
    status: 'resolved',
    timestamp: 'Yesterday, 04:15 PM',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    senderRole: 'patient',
    senderName: 'Raghavan Kumar',
    respondedBy: 'Deepa Suresh (Caregiver)',
    respondedAt: '04:18 PM',
    resolutionNotes: 'Vitals stabilized. Blood glucose returned to 110 mg/dL.',
    resolvedAt: '04:35 PM',
  },
];

function loadRegisteredUsers() {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

function loadDemoPasswordOverrides() {
  try {
    const raw = localStorage.getItem(DEMO_PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadDemoProfileOverrides() {
  try {
    const raw = localStorage.getItem(DEMO_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDemoProfileOverrides(overrides) {
  try {
    localStorage.setItem(DEMO_PROFILES_KEY, JSON.stringify(overrides));
  } catch {}
}

function getEffectiveDemoUsers() {
  const pwOverrides = loadDemoPasswordOverrides();
  const profileOverrides = loadDemoProfileOverrides();
  return demoUsers.map((u) => {
    const key = u.username.toLowerCase();
    const prof = profileOverrides[key] || {};
    return {
      ...u,
      ...prof,
      email: prof.email || u.email || `${u.username}@eldercare.demo`,
      password: pwOverrides[key] || u.password,
    };
  });
}

function getAllUsers() {
  return [...getEffectiveDemoUsers(), ...loadRegisteredUsers()];
}

function loadSession() {
  try {
    const fromLocal = localStorage.getItem(SESSION_KEY);
    if (fromLocal) return JSON.parse(fromLocal);
    const fromSession = sessionStorage.getItem(SESSION_KEY);
    return fromSession ? JSON.parse(fromSession) : null;
  } catch {
    return null;
  }
}

function deduplicateAppointments(list = []) {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenEmergencyIds = new Set();
  const seenEmergencyEvents = new Set();
  const result = [];

  for (const a of list) {
    if (!a || !a.id || seenIds.has(a.id)) continue;
    seenIds.add(a.id);

    if (a.emergencyId) {
      if (seenEmergencyIds.has(a.emergencyId)) continue;
      seenEmergencyIds.add(a.emergencyId);
    }

    const isEmergency = a.emergencyId || (a.type && a.type.toLowerCase().includes('emergency'));
    if (isEmergency) {
      const emgEventKey = `emg-${a.patientId || a.patient}-${a.specialty || a.type}-${a.date}`;
      if (seenEmergencyEvents.has(emgEventKey)) continue;
      seenEmergencyEvents.add(emgEventKey);
    }

    result.push(a);
  }
  return result;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => loadSession());
  const [dbStatus, setDbStatus] = useState('connected'); // 'connected' | 'connecting' | 'disconnected'
  const [dbDetails, setDbDetails] = useState({ dbName: 'eldercare_db', host: 'localhost:3306' });
  const [jwtToken, setJwtToken] = useState(() => {
    try {
      return localStorage.getItem(JWT_TOKEN_KEY) || sessionStorage.getItem(JWT_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });
  const [recentlyAccessed, setRecentlyAccessed] = useState(loadStoredRecentlyAccessed);

  const trackRecentlyAccessed = useCallback((item) => {
    if (!item || !item.id) return;
    setRecentlyAccessed((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && i.type === item.type));
      const updated = [
        {
          id: item.id,
          type: item.type || 'resident',
          title: item.title || item.name || 'Record',
          subtitle: item.subtitle || item.room || item.condition || '',
          path: item.path || `/elderly/${item.id}`,
          timestamp: Date.now()
        },
        ...filtered
      ].slice(0, 8);
      try {
        localStorage.setItem(RECENTLY_ACCESSED_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearRecentlyAccessed = useCallback(() => {
    setRecentlyAccessed([]);
    try {
      localStorage.removeItem(RECENTLY_ACCESSED_KEY);
    } catch {}
  }, []);

  const [notificationList, setNotificationList] = useState(loadStoredNotifications);
  const [reminderQueue, setReminderQueue] = useState(() => {
    try {
      const raw = localStorage.getItem(REMINDER_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [scheduledReminders, setScheduledReminders] = useState(() => {
    try {
      const raw = localStorage.getItem(SCHEDULED_REMINDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [residentList, setResidentList] = useState(() => {
    try {
      const raw = localStorage.getItem(RESIDENTS_KEY);
      return raw ? JSON.parse(raw) : seedElderlyResidents;
    } catch {
      return seedElderlyResidents;
    }
  });
  const [carePlanList, setCarePlanList] = useState(() => {
    try {
      const raw = localStorage.getItem(CARE_PLANS_KEY);
      return raw ? JSON.parse(raw) : seedCarePlans;
    } catch {
      return seedCarePlans;
    }
  });

  const [appointmentList, setAppointmentList] = useState(() => {
    try {
      const raw = localStorage.getItem(APPOINTMENTS_KEY);
      const parsed = raw ? JSON.parse(raw) : seedAppointments;
      return deduplicateAppointments(parsed);
    } catch {
      return deduplicateAppointments(seedAppointments);
    }
  });

  const [emergencyAlerts, setEmergencyAlerts] = useState(() => {
    try {
      const raw = localStorage.getItem(EMERGENCY_ALERTS_KEY);
      return raw ? JSON.parse(raw) : seedEmergencyAlerts;
    } catch {
      return seedEmergencyAlerts;
    }
  });

  const [caregiverList, setCaregiverList] = useState(() => {
    try {
      const raw = localStorage.getItem(CAREGIVERS_KEY);
      return raw ? JSON.parse(raw) : seedCaregivers;
    } catch {
      return seedCaregivers;
    }
  });

  const [careTasks, setCareTasks] = useState(() => {
    try {
      const raw = localStorage.getItem(CARE_TASKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const initial = getInitialCareTasks();
    try { localStorage.setItem(CARE_TASKS_KEY, JSON.stringify(initial)); } catch {}
    return initial;
  });

  const [voicemailList, setVoicemailList] = useState(loadStoredVoicemails);

  const fetchVoicemails = useCallback(async () => {
    try {
      const res = await voicemailsApi.getAll();
      if (res?.data && Array.isArray(res.data)) {
        const cleanList = res.data.filter((v) => !String(v.id || '').startsWith('VM-SEED-'));
        setVoicemailList(cleanList);
        try { localStorage.setItem(VOICEMAILS_KEY, JSON.stringify(cleanList)); } catch {}
      }
    } catch (err) {
      console.warn('[AppContext] Voicemail fetch fallback to local cache:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchVoicemails();
  }, [fetchVoicemails]);

  const addVoicemail = useCallback(async (vmData) => {
    const tempId = `VM-${Date.now()}`;
    const newVm = {
      id: tempId,
      residentId: vmData.residentId || 'EC-001',
      residentName: vmData.residentName || 'Resident',
      senderName: vmData.senderName || user?.name || 'User',
      senderRole: vmData.senderRole || user?.role || 'patient',
      recipientName: vmData.recipientName || 'All Caregivers',
      recipientRole: vmData.recipientRole || 'caregiver',
      category: vmData.category || 'general',
      subject: vmData.subject || 'Voice Message',
      duration: Number(vmData.duration) || 0,
      audioUrl: vmData.audioUrl || '',
      notes: vmData.notes || '',
      emergencyId: vmData.emergencyId || null,
      isRead: 0,
      createdAt: new Date().toISOString()
    };

    setVoicemailList((prev) => {
      const next = [newVm, ...prev];
      try { localStorage.setItem(VOICEMAILS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      const res = await voicemailsApi.create(newVm);
      if (res?.data) {
        setVoicemailList((prev) => prev.map((v) => (v.id === tempId ? res.data : v)));
      }
    } catch (err) {
      console.warn('[AppContext] Voicemail created locally:', err.message);
    }
    return newVm;
  }, [user]);

  const markVoicemailAsRead = useCallback(async (id) => {
    setVoicemailList((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, isRead: 1 } : v));
      try { localStorage.setItem(VOICEMAILS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await voicemailsApi.markRead(id);
    } catch {}
  }, []);

  const deleteVoicemail = useCallback(async (id) => {
    setVoicemailList((prev) => {
      const next = prev.filter((v) => v.id !== id);
      try { localStorage.setItem(VOICEMAILS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await voicemailsApi.delete(id);
    } catch {}
  }, []);

  const unreadVoicemailCount = useMemo(() => {
    return voicemailList.filter((v) => !v.isRead).length;
  }, [voicemailList]);

  const checkDbAndSync = useCallback(async (manual = false) => {
    if (manual) {
      setDbStatus('connecting');
    }
    let isOnline = false;
    try {
      const res = await healthApi.check();
      const isConnected = res && (
        res.connected === true ||
        res.database === 'connected' ||
        res.status === 'connected' ||
        (res.status === 'ok' && res.database !== 'mock' && res.database !== 'disconnected')
      );
      if (isConnected) {
        setDbStatus('connected');
        setDbDetails({ dbName: res.dbName, host: res.dbHost });
        isOnline = true;
      } else {
        setDbStatus('disconnected');
      }
    } catch {
      setDbStatus('disconnected');
    }

    if (!isOnline) {
      return false;
    }

    // Sync data from backend if reachable
    try {
      const [residentsRes, apptsRes, plansRes, sosRes, notifsRes, caregiversRes] = await Promise.allSettled([
        residentsApi.getAll(),
        appointmentsApi.getAll(),
        carePlansApi.getAll(),
        emergencyApi.getAll(),
        notificationsApi.getAll(),
        caregiversApi.getAll()
      ]);

      if (residentsRes.status === 'fulfilled' && residentsRes.value?.data) {
        setResidentList(residentsRes.value.data);
        try { localStorage.setItem(RESIDENTS_KEY, JSON.stringify(residentsRes.value.data)); } catch {}
      }
      if (caregiversRes.status === 'fulfilled' && caregiversRes.value?.data && caregiversRes.value.data.length > 0) {
        setCaregiverList(caregiversRes.value.data);
        try { localStorage.setItem(CAREGIVERS_KEY, JSON.stringify(caregiversRes.value.data)); } catch {}
      }
      if (apptsRes.status === 'fulfilled' && apptsRes.value?.data) {
        const cleanAppts = deduplicateAppointments(apptsRes.value.data);
        setAppointmentList(cleanAppts);
        try { localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(cleanAppts)); } catch {}
      }
      if (plansRes.status === 'fulfilled' && plansRes.value?.data) {
        setCarePlanList(plansRes.value.data);
        try { localStorage.setItem(CARE_PLANS_KEY, JSON.stringify(plansRes.value.data)); } catch {}
      }
      if (sosRes.status === 'fulfilled' && sosRes.value?.data) {
        setEmergencyAlerts(sosRes.value.data);
        try { localStorage.setItem(EMERGENCY_ALERTS_KEY, JSON.stringify(sosRes.value.data)); } catch {}
      }
      if (notifsRes.status === 'fulfilled' && notifsRes.value?.data) {
        const dbData = notifsRes.value.data;
        setNotificationList((prev) => {
          const localMap = new Map(prev.map((n) => [n.id, n]));
          const merged = dbData.map((dbItem) => {
            const localItem = localMap.get(dbItem.id);
            const isRead = Boolean(localItem?.isRead || localItem?.read || dbItem.is_read || dbItem.read || dbItem.isRead);
            return {
              ...dbItem,
              read: isRead,
              isRead: isRead,
            };
          });

          const dbIds = new Set(dbData.map((d) => d.id));
          for (const localItem of prev) {
            if (!dbIds.has(localItem.id)) {
              merged.push(localItem);
            }
          }

          try {
            localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
      return true;
    } catch (syncErr) {
      console.warn('[Sync] Fallback to local cache:', syncErr);
      return false;
    }
  }, []);

  // Check DB Connection & sync data from MySQL on mount + dynamic retry
  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    const runCheck = async () => {
      const isOnline = await checkDbAndSync();
      if (isMounted) {
        timerId = setTimeout(runCheck, isOnline ? 15000 : 3000);
      }
    };

    runCheck();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [checkDbAndSync]);

  const addResident = useCallback(async (newResident) => {
    let created;
    try {
      const res = await residentsApi.create(newResident);
      if (res && res.success && res.data) {
        created = res.data;
      }
    } catch (apiErr) {
      console.warn('[AddResident] Backend create warning, falling back to local:', apiErr.message);
    }

    if (!created) {
      const id = newResident.id || `EC-${String(Math.floor(Math.random() * 900) + 100)}`;
      const initials = newResident.initials || (newResident.name || 'R')
        .split(' ')
        .filter(Boolean)
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      created = {
        id,
        initials,
        name: newResident.name,
        age: Number(newResident.age) || 75,
        gender: newResident.gender || 'Male',
        room: newResident.room || 'General Suite',
        caregiver: newResident.caregiver || 'Priya Nair',
        status: newResident.status || 'stable',
        condition: newResident.condition || newResident.notes || 'Routine Care',
        bloodGroup: newResident.bloodGroup || 'B+',
        admitted: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        emergencyContact: newResident.emergencyContact || 'Family Contact',
        notes: newResident.notes || '',
        lastAssessment: 'Today',
      };
    }

    // 1. Update residentList state and persistent localStorage
    setResidentList((prev) => {
      const exists = prev.some((r) => r.id === created.id);
      const next = exists ? prev.map((r) => (r.id === created.id ? created : r)) : [...prev, created];
      try { localStorage.setItem(RESIDENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // 2. Automatically generate an initial Care Plan so Care Plans page shows this resident
    const newCarePlan = {
      id: `CP-${Date.now()}`,
      residentId: created.id,
      patient: created.name,
      initials: created.initials,
      room: created.room,
      caregiver: created.caregiver,
      goal: `Maintain comfort, mobility and daily wellness for ${created.name}`,
      progress: 0,
      tasks: [
        { label: 'Morning vitals and blood pressure check', done: false },
        { label: 'Prescribed medication round', done: false },
        { label: 'Dietary intake & hydration check', done: false },
        { label: 'Mobility support & evening check-in', done: false },
      ],
    };

    setCarePlanList((prev) => {
      const exists = prev.some((p) => p.residentId === created.id);
      const next = exists ? prev : [newCarePlan, ...prev];
      try { localStorage.setItem(CARE_PLANS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // 3. Automatically initialize initial intake Care Record in localStorage
    try {
      const rawRecords = localStorage.getItem('eldercare_health_records');
      const healthRecords = rawRecords ? JSON.parse(rawRecords) : {};
      if (!healthRecords[created.id]) {
        healthRecords[created.id] = [
          {
            id: `OBS-${created.id}-INIT`,
            date: created.admitted || 'Today',
            recordedBy: created.caregiver || 'Caregiver',
            bp: '120/80 mmHg',
            temp: '98.6 °F',
            weight: '62 kg',
            note: `Initial intake assessment recorded for ${created.name}. Health condition: ${created.condition || 'Stable'}. Assigned caregiver: ${created.caregiver || 'Staff'}. Room: ${created.room || 'General Room'}.`,
          }
        ];
        localStorage.setItem('eldercare_health_records', JSON.stringify(healthRecords));
      }
    } catch {}

    // 4. Record system notification
    const notifId = `NT-RES-${Date.now()}`;
    const newNotif = {
      id: notifId,
      type: 'resident',
      title: `New Resident Admitted: ${created.name}`,
      time: 'Just now',
      patient: created.name,
      residentId: created.id,
      detail: `${created.room} · Caregiver: ${created.caregiver}`,
      desc: `${created.name} has been enrolled in the facility and assigned to ${created.caregiver}.`,
      group_name: 'today',
      group: 'today',
      isRead: false,
      read: false,
      is_read: 0,
      actionable: false,
      createdAt: new Date().toISOString(),
    };

    setNotificationList((prev) => {
      const next = [newNotif, ...prev];
      try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    return created;
  }, []);

  const refreshResidents = useCallback(async () => {
    try {
      const res = await residentsApi.getAll();
      if (res?.data) {
        setResidentList(res.data);
        try { localStorage.setItem(RESIDENTS_KEY, JSON.stringify(res.data)); } catch {}
        return res.data;
      }
    } catch (err) {
      console.warn('[AppContext] Failed to refresh residents:', err);
    }
  }, []);

  const deleteResident = useCallback(async (id) => {
    let deletedName = '';
    setResidentList((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) deletedName = target.name;
      const next = prev.filter((r) => r.id !== id);
      try { localStorage.setItem(RESIDENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // Clean up care plans associated with this resident
    setCarePlanList((prev) => {
      const next = prev.filter((cp) => cp.residentId !== id && cp.patient !== deletedName);
      try { localStorage.setItem(CARE_PLANS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    const notifId = `NT-DEL-${Date.now()}`;
    const newNotif = {
      id: notifId,
      type: 'resident',
      title: 'Resident Discharged / Removed',
      time: 'Just now',
      patient: deletedName || id,
      detail: `ID: ${id}`,
      desc: `${deletedName || 'Elderly resident'} (${id}) has been removed from the facility registry.`,
      group_name: 'today',
      group: 'today',
      isRead: false,
      read: false,
      is_read: 0,
      actionable: false,
      createdAt: new Date().toISOString(),
    };

    setNotificationList((prev) => {
      const next = [newNotif, ...prev];
      try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await residentsApi.delete(id);
    } catch (err) {
      console.warn('[Residents] API delete error, kept in local state:', err);
    }
  }, []);

  const addCaregiver = useCallback(async (newCaregiver) => {
    const fallbackId = `CG-${String(Math.floor(Math.random() * 90) + 10)}`;
    const initials = newCaregiver.initials || (newCaregiver.name || 'CG')
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const localCreated = {
      id: fallbackId,
      name: newCaregiver.name || '',
      initials,
      role: newCaregiver.role || 'Care Assistant',
      experience: newCaregiver.experience || '1 year',
      assigned: Number(newCaregiver.assigned) || 0,
      availability: newCaregiver.availability || 'On Duty',
      status: newCaregiver.status || 'active',
      shift: newCaregiver.shift || 'Morning · 7:00 AM – 3:00 PM',
      phone: newCaregiver.phone || '+91 90000 00000',
      ...newCaregiver,
    };

    setCaregiverList((prev) => {
      const next = [localCreated, ...prev];
      try { localStorage.setItem(CAREGIVERS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    const notifId = `NT-CG-${Date.now()}`;
    const newNotif = {
      id: notifId,
      type: 'caregiver',
      title: `Caregiver Added: ${localCreated.name}`,
      time: 'Just now',
      patient: localCreated.name,
      detail: `${localCreated.role} · ${localCreated.shift}`,
      desc: `${localCreated.name} has been added to the caregiver staff directory.`,
      group_name: 'today',
      group: 'today',
      isRead: false,
      read: false,
      is_read: 0,
      actionable: false,
      createdAt: new Date().toISOString(),
    };

    setNotificationList((prev) => {
      const next = [newNotif, ...prev];
      try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      const res = await caregiversApi.create(localCreated);
      if (res && res.data) {
        setCaregiverList((prev) => {
          const next = prev.map((c) => (c.id === fallbackId ? res.data : c));
          try { localStorage.setItem(CAREGIVERS_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
        return res.data;
      }
    } catch (err) {
      console.warn('[Caregivers] API error, kept in local state:', err);
    }

    return localCreated;
  }, []);

  const updateCaregiver = useCallback(async (id, updatedData) => {
    setCaregiverList((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c));
      try { localStorage.setItem(CAREGIVERS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await caregiversApi.update(id, updatedData);
    } catch (err) {
      console.warn('[Caregivers] API update error, kept in local state:', err);
    }
  }, []);

  const deleteCaregiver = useCallback(async (id) => {
    setCaregiverList((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try { localStorage.setItem(CAREGIVERS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await caregiversApi.delete(id);
    } catch (err) {
      console.warn('[Caregivers] API delete error, kept in local state:', err);
    }
  }, []);

  const addAppointment = useCallback(async (newAppt) => {
    const fallbackId = `AP-${Date.now()}`;
    const localCreated = {
      id: fallbackId,
      status: 'confirmed',
      ...newAppt,
    };

    setAppointmentList((prev) => {
      const next = [localCreated, ...prev];
      try { localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      const res = await appointmentsApi.create(newAppt);
      if (res && res.data) {
        setAppointmentList((prev) => prev.map((a) => (a.id === fallbackId ? res.data : a)));
        return { success: true, data: res.data };
      }
      return { success: true, data: localCreated };
    } catch (err) {
      console.warn('[Appts] API error, reverting optimistic add:', err.message);
      setAppointmentList((prev) => {
        const next = prev.filter((a) => a.id !== fallbackId);
        try { localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
      throw err;
    }
  }, []);

  const deleteAppointment = useCallback(async (id) => {
    let targetAppt = null;
    setAppointmentList((prev) => {
      targetAppt = prev.find((a) => a.id === id);
      const next = prev.filter((a) => a.id !== id);
      try { localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    if (targetAppt?.emergencyId) {
      setEmergencyAlerts((prev) => {
        const next = prev.filter((a) => a.id !== targetAppt.emergencyId && a.appointmentId !== id);
        try { localStorage.setItem(EMERGENCY_ALERTS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
      setNotificationList((prev) => {
        const next = prev.filter((n) => n.emergencyId !== targetAppt.emergencyId && n.appointmentId !== id);
        try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    }

    try {
      await appointmentsApi.delete(id);
    } catch (err) {
      console.warn('[Appts] API delete error, kept in local state:', err);
    }
  }, []);

  const toggleCarePlanTask = useCallback(async (planId, taskLabel) => {
    setCarePlanList((prev) => {
      const next = prev.map((plan) => {
        if (plan.id !== planId) return plan;
        const updatedTasks = plan.tasks.map((task) => {
          if (task.label !== taskLabel) return task;
          return { ...task, done: !task.done };
        });
        const completedCount = updatedTasks.filter((t) => t.done).length;
        const newProgress = Math.round((completedCount / updatedTasks.length) * 100);
        return {
          ...plan,
          tasks: updatedTasks,
          progress: newProgress,
        };
      });
      try { localStorage.setItem(CARE_PLANS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await carePlansApi.toggleTask(planId, taskLabel);
    } catch (err) {
      console.warn('[CarePlans] API error, kept in local state:', err);
    }
  }, []);

  const addCareTask = useCallback(async (taskData) => {
    const todayISO = toISODate(new Date());
    const id = taskData.id || `TSK-${Date.now().toString().slice(-6)}`;
    const newTask = {
      id,
      title: taskData.title?.trim() || 'Care Activity',
      category: taskData.category || 'clinical',
      residentId: taskData.residentId || null,
      residentName: taskData.residentName || 'General Facility',
      room: taskData.room || '',
      caregiver: taskData.caregiver || 'Priya Nair',
      dueDate: taskData.dueDate || todayISO,
      dueTime: taskData.dueTime || '02:00 PM',
      priority: taskData.priority || 'medium',
      status: 'pending',
      completedAt: null,
      notes: taskData.notes || '',
      createdAt: new Date().toISOString(),
    };

    setCareTasks((prev) => {
      const next = [newTask, ...prev];
      try { localStorage.setItem(CARE_TASKS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // Notify care team
    const notifId = `NT-TSK-${Date.now()}`;
    const newNotif = {
      id: notifId,
      type: 'caregiver',
      title: `New Task Assigned: ${newTask.title}`,
      time: 'Just now',
      patient: newTask.residentName,
      detail: `Assigned to: ${newTask.caregiver} · Due: ${newTask.dueTime}`,
      desc: `${newTask.title} has been assigned to ${newTask.caregiver} for ${newTask.residentName}.`,
      group_name: 'today',
      group: 'today',
      isRead: false,
      read: false,
      is_read: 0,
      actionable: false,
      createdAt: new Date().toISOString(),
    };

    setNotificationList((prev) => {
      const next = [newNotif, ...prev];
      try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    return newTask;
  }, []);

  const updateCareTask = useCallback(async (taskId, updates) => {
    setCareTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      try { localStorage.setItem(CARE_TASKS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleCareTask = useCallback(async (taskId) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    let updatedTask = null;
    setCareTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== taskId) return t;
        const isDone = t.status === 'completed' || t.done === true;
        const nextStatus = isDone ? (isTaskOverdue(t, now) ? 'overdue' : 'pending') : 'completed';
        const nextCompletedAt = isDone ? null : timeStr;
        updatedTask = {
          ...t,
          status: nextStatus,
          done: !isDone,
          completedAt: nextCompletedAt,
        };
        return updatedTask;
      });
      try { localStorage.setItem(CARE_TASKS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // Also sync care plan task if one matches
    if (updatedTask && updatedTask.residentId) {
      setCarePlanList((prev) => {
        const next = prev.map((plan) => {
          if (plan.residentId !== updatedTask.residentId) return plan;
          const matchTask = plan.tasks.find((pt) => pt.label.toLowerCase() === updatedTask.title.toLowerCase());
          if (!matchTask) return plan;
          const updatedPlanTasks = plan.tasks.map((pt) =>
            pt.label.toLowerCase() === updatedTask.title.toLowerCase() ? { ...pt, done: updatedTask.done } : pt
          );
          const completedCount = updatedPlanTasks.filter((pt) => pt.done).length;
          const newProgress = Math.round((completedCount / updatedPlanTasks.length) * 100);
          return { ...plan, tasks: updatedPlanTasks, progress: newProgress };
        });
        try { localStorage.setItem(CARE_PLANS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    }

    return updatedTask;
  }, []);

  const reassignCareTask = useCallback(async (taskId, newCaregiverName, note = '') => {
    let previousCaregiver = '';
    let targetTask = null;

    setCareTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== taskId) return t;
        previousCaregiver = t.caregiver;
        targetTask = {
          ...t,
          caregiver: newCaregiverName,
          reassignedFrom: previousCaregiver,
          reassignedAt: new Date().toISOString(),
          reassignNote: note || t.reassignNote,
        };
        return targetTask;
      });
      try { localStorage.setItem(CARE_TASKS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    if (targetTask) {
      const notifId = `NT-REASSIGN-${Date.now()}`;
      const newNotif = {
        id: notifId,
        type: 'caregiver',
        title: `Care Task Reassigned`,
        time: 'Just now',
        patient: targetTask.residentName,
        detail: `${previousCaregiver} → ${newCaregiverName}`,
        desc: `Task "${targetTask.title}" has been reassigned from ${previousCaregiver} to ${newCaregiverName}.`,
        group_name: 'today',
        group: 'today',
        isRead: false,
        read: false,
        is_read: 0,
        actionable: false,
        createdAt: new Date().toISOString(),
      };

      setNotificationList((prev) => {
        const next = [newNotif, ...prev];
        try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    }

    return targetTask;
  }, []);

  const reassignResident = useCallback(async (residentId, newCaregiverName) => {
    let targetResident = null;
    let oldCaregiver = '';

    setResidentList((prev) => {
      const next = prev.map((r) => {
        if (r.id !== residentId) return r;
        oldCaregiver = r.caregiver;
        targetResident = { ...r, caregiver: newCaregiverName };
        return targetResident;
      });
      try { localStorage.setItem(RESIDENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // Update corresponding care plan caregiver
    setCarePlanList((prev) => {
      const next = prev.map((cp) => (cp.residentId === residentId ? { ...cp, caregiver: newCaregiverName } : cp));
      try { localStorage.setItem(CARE_PLANS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // Update pending care tasks for this resident
    setCareTasks((prev) => {
      const next = prev.map((t) => {
        if (t.residentId === residentId && t.status !== 'completed') {
          return { ...t, caregiver: newCaregiverName, reassignedFrom: oldCaregiver };
        }
        return t;
      });
      try { localStorage.setItem(CARE_TASKS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    if (targetResident) {
      const notifId = `NT-RES-REASSIGN-${Date.now()}`;
      const newNotif = {
        id: notifId,
        type: 'caregiver',
        title: `Resident Reassigned: ${targetResident.name}`,
        time: 'Just now',
        patient: targetResident.name,
        detail: `${oldCaregiver} → ${newCaregiverName}`,
        desc: `${targetResident.name} (${targetResident.room}) is now assigned to caregiver ${newCaregiverName}.`,
        group_name: 'today',
        group: 'today',
        isRead: false,
        read: false,
        is_read: 0,
        actionable: false,
        createdAt: new Date().toISOString(),
      };

      setNotificationList((prev) => {
        const next = [newNotif, ...prev];
        try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }, []);

  const activeEmergencies = useMemo(() => {
    return emergencyAlerts.filter((a) => a.status === 'active' || a.status === 'in_progress');
  }, [emergencyAlerts]);

  const triggerEmergencyAlert = useCallback(async (details) => {
    const alertId = `SOS-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const localAlert = {
      id: alertId,
      residentId: details.residentId || 'EC-001',
      residentName: details.residentName || 'Lakshmi Devi',
      room: details.room || 'Willow Room 4',
      condition: details.condition || 'Hypertension, Mild Arthritis',
      bloodGroup: details.bloodGroup || 'B+',
      caregiver: details.caregiver || 'Priya Nair',
      emergencyContact: details.emergencyContact || 'Ramesh Devi · Son · +91 98410 22311',
      emergencyType: details.emergencyType || 'Urgent Assistance Request',
      notes: details.notes || 'Immediate emergency caregiver assistance requested.',
      severity: details.severity || 'CRITICAL',
      status: 'active',
      timestamp: timeStr,
      createdAt: new Date().toISOString(),
      senderRole: details.senderRole || 'patient',
      senderName: details.senderName || 'Resident',
      respondedBy: null,
      respondedAt: null,
      resolutionNotes: null,
      resolvedAt: null,
      voiceMailAudio: details.voiceMailAudio || details.voiceNoteUrl || null,
      voiceDuration: Number(details.voiceDuration) || 0,
    };

    setEmergencyAlerts((prev) => {
      const next = [localAlert, ...prev];
      try { localStorage.setItem(EMERGENCY_ALERTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    if (details.voiceMailAudio || details.voiceNoteUrl) {
      const sosVm = {
        id: `VM-SOS-${Date.now()}`,
        residentId: localAlert.residentId,
        residentName: localAlert.residentName,
        senderName: localAlert.senderName,
        senderRole: localAlert.senderRole,
        recipientName: 'Emergency Response Team',
        recipientRole: 'caregiver',
        category: 'emergency_sos',
        subject: `🚨 Emergency SOS Voice Note: ${localAlert.emergencyType}`,
        duration: Number(details.voiceDuration) || 0,
        audioUrl: details.voiceMailAudio || details.voiceNoteUrl || '',
        notes: localAlert.notes,
        emergencyId: alertId,
        isRead: 0,
        createdAt: new Date().toISOString()
      };
      setVoicemailList((prev) => {
        const next = [sosVm, ...prev];
        try { localStorage.setItem(VOICEMAILS_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    }

    const notifId = `NT-SOS-${Date.now()}`;
    const newNotif = {
      id: notifId,
      type: 'emergency',
      title: `EMERGENCY SOS: ${localAlert.residentName}`,
      time: 'Just now',
      patient: localAlert.residentName,
      residentId: localAlert.residentId,
      detail: `${localAlert.emergencyType} · ${localAlert.room}`,
      desc: localAlert.senderRole === 'family'
        ? `Urgent emergency assistance requested by Family Member ${localAlert.senderName} for ${localAlert.residentName} (${localAlert.room}). Immediate caregiver dispatch required!`
        : `Urgent emergency assistance broadcast by Resident ${localAlert.senderName} from ${localAlert.room}. Immediate caregiver & medical response required!`,
      group: 'today',
      read: false,
      isRead: false,
      actionable: true,
      senderRole: localAlert.senderRole,
      emergencyId: localAlert.id,
    };
    setNotificationList((prev) => {
      const next = [newNotif, ...prev];
      try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      const res = await emergencyApi.trigger(details);
      if (res?.data) {
        const returnedAlert = res.data.alert || res.data;
        setEmergencyAlerts((prev) => prev.map((a) => (a.id === alertId ? returnedAlert : a)));
        if (res.data.appointment) {
          setAppointmentList((prev) => {
            const isMatch = (ap) =>
              ap.id === res.data.appointment.id ||
              (res.data.appointment.emergencyId && ap.emergencyId === res.data.appointment.emergencyId);

            const exists = prev.some(isMatch);
            if (exists) {
              const updated = prev.map((ap) => (isMatch(ap) ? { ...ap, ...res.data.appointment } : ap));
              try { localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated)); } catch {}
              return updated;
            }
            const next = [res.data.appointment, ...prev];
            try { localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(next)); } catch {}
            return next;
          });
        }

        // Update notification with auto-booked specialist doctor info, preventing duplicate entries
        const specName = res.data.specialist?.name || res.data.appointment?.doctor || 'Specialist';
        const specType = res.data.specialty || res.data.appointment?.specialty || 'Specialist Consultation';
        const specSlot = res.data.appointment?.time || 'Immediate Consultation';
        const effectiveEmgId = res.data.appointment?.emergencyId || alertId;

        setNotificationList((prev) => {
          // If this is a duplicate trigger, remove any duplicate temporary notification
          const seenEmgIds = new Set();
          const next = [];

          for (const n of prev) {
            if (n.id === notifId) {
              const updatedNotif = {
                ...n,
                detail: `${details.emergencyType || localAlert.emergencyType} · Ref: ${specName} (${specType})`,
                desc: `Emergency reported for ${localAlert.residentName} in ${localAlert.room}. Automatically scheduled consultation with specialist ${specName} (${specType}) for ${specSlot}. Assigned Caregiver: ${localAlert.caregiver}.`,
                appointmentId: res.data.appointmentId || res.data.appointment?.id,
                emergencyId: effectiveEmgId,
              };
              if (effectiveEmgId) {
                if (seenEmgIds.has(effectiveEmgId)) continue;
                seenEmgIds.add(effectiveEmgId);
              }
              next.push(updatedNotif);
            } else {
              if (n.emergencyId) {
                if (seenEmgIds.has(n.emergencyId)) continue;
                seenEmgIds.add(n.emergencyId);
              }
              next.push(n);
            }
          }

          try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
        return res.data;
      }
    } catch (err) {
      console.warn('[SOS] API error, kept in local state:', err);
    }

    return localAlert;
  }, []);

  const respondToEmergency = useCallback(async (alertId, responderName) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setEmergencyAlerts((prev) => {
      const next = prev.map((a) => {
        if (a.id !== alertId) return a;
        return {
          ...a,
          status: 'in_progress',
          respondedBy: responderName || (user ? user.name : 'Caregiver'),
          respondedAt: timeStr,
        };
      });
      try { localStorage.setItem(EMERGENCY_ALERTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await emergencyApi.respond(alertId, responderName || (user ? user.name : 'Caregiver'));
    } catch (err) {
      console.warn('[SOS] API error, kept in local state:', err);
    }
  }, [user]);

  const resolveEmergency = useCallback(async (alertId, notes) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setEmergencyAlerts((prev) => {
      const next = prev.map((a) => {
        if (a.id !== alertId) return a;
        return {
          ...a,
          status: 'resolved',
          resolvedAt: timeStr,
          resolutionNotes: notes || 'Assistance provided and resident verified safe.',
        };
      });
      try { localStorage.setItem(EMERGENCY_ALERTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await emergencyApi.resolve(alertId, notes);
    } catch (err) {
      console.warn('[SOS] API error, kept in local state:', err);
    }
  }, []);

  const cancelEmergency = useCallback(async (alertId) => {
    setEmergencyAlerts((prev) => {
      const next = prev.filter((a) => a.id !== alertId);
      try { localStorage.setItem(EMERGENCY_ALERTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await emergencyApi.delete(alertId);
    } catch (err) {
      console.warn('[SOS] API error, kept in local state:', err);
    }
  }, []);

  const isAuthenticated = !!user;

  const login = useCallback(async (username, password, remember = true) => {
    // 1. Try MySQL Backend API first
    try {
      const res = await authApi.login(username, password);
      if (res.success && res.user) {
        setUser(res.user);
        const payload = JSON.stringify(res.user);
        if (remember) {
          localStorage.setItem(SESSION_KEY, payload);
          sessionStorage.removeItem(SESSION_KEY);
          if (res.token) {
            localStorage.setItem(JWT_TOKEN_KEY, res.token);
            sessionStorage.removeItem(JWT_TOKEN_KEY);
          }
        } else {
          sessionStorage.setItem(SESSION_KEY, payload);
          localStorage.removeItem(SESSION_KEY);
          if (res.token) {
            sessionStorage.setItem(JWT_TOKEN_KEY, res.token);
            localStorage.removeItem(JWT_TOKEN_KEY);
          }
        }
        if (res.token) setJwtToken(res.token);
        setDbStatus('connected');
        return { success: true, user: res.user, token: res.token };
      }
    } catch (apiErr) {
      console.warn('[Login] Backend error, attempting local fallback:', apiErr.message);
    }

    // 2. Local fallback if offline
    const allUsers = getAllUsers();
    const match = allUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (!match) {
      return { success: false, message: 'Incorrect username or password. Please try again.' };
    }
    const { password: _pw, ...safeUser } = match;
    setUser(safeUser);
    const payload = JSON.stringify(safeUser);
    if (remember) {
      localStorage.setItem(SESSION_KEY, payload);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, payload);
      localStorage.removeItem(SESSION_KEY);
    }
    return { success: true, user: safeUser };
  }, []);

  const googleLogin = useCallback(async (googleData, remember = true) => {
    try {
      const res = await authApi.googleLogin(googleData);
      if (res && res.success && res.user) {
        setUser(res.user);
        const payload = JSON.stringify(res.user);
        if (remember) {
          localStorage.setItem(SESSION_KEY, payload);
          sessionStorage.removeItem(SESSION_KEY);
          if (res.token) {
            localStorage.setItem(JWT_TOKEN_KEY, res.token);
            sessionStorage.removeItem(JWT_TOKEN_KEY);
          }
        } else {
          sessionStorage.setItem(SESSION_KEY, payload);
          localStorage.removeItem(SESSION_KEY);
          if (res.token) {
            sessionStorage.setItem(JWT_TOKEN_KEY, res.token);
            localStorage.removeItem(JWT_TOKEN_KEY);
          }
        }
        if (res.token) setJwtToken(res.token);
        setDbStatus('connected');
        saveGoogleAccountToHistory(res.user);
        return { success: true, user: res.user, token: res.token, message: res.message };
      }
      return res;
    } catch (apiErr) {
      console.warn('[Google Auth] API error:', apiErr.message);
      const errorObj = new Error(apiErr.message || 'Google authentication failed.');
      errorObj.code = apiErr.code || apiErr.data?.code;
      errorObj.data = apiErr.data;
      throw errorObj;
    }
  }, []);

  const register = useCallback(async (payload) => {
    // 1. Try MySQL Backend API first
    try {
      const res = await authApi.register(payload);
      if (res.success && res.user) {
        setDbStatus('connected');
        return { success: true, user: res.user };
      }
    } catch (apiErr) {
      console.warn('[Register] Backend error, falling back to local:', apiErr.message);
      if (apiErr.message.includes('already taken') || apiErr.message.includes('already exists')) {
        return { success: false, message: apiErr.message };
      }
    }

    // 2. Local fallback
    const allUsers = getAllUsers();
    const usernameTaken = allUsers.some((u) => u.username.toLowerCase() === payload.username.trim().toLowerCase());
    if (usernameTaken) {
      return { success: false, message: 'That username is already taken. Please choose another.' };
    }
    const emailTaken = allUsers.some((u) => u.email && u.email.toLowerCase() === payload.email.trim().toLowerCase());
    if (emailTaken) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    const registered = loadRegisteredUsers();
    const initials = payload.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('');
    const newUser = { id: `USR-${Date.now()}`, initials, ...payload };
    saveRegisteredUsers([...registered, newUser]);
    return { success: true, user: newUser };
  }, []);

  const findUserForReset = useCallback(async (identifier) => {
    if (!identifier || !identifier.trim()) return null;
    const clean = identifier.trim().toLowerCase();

    try {
      const res = await authApi.findUser(clean);
      if (res.success && res.user) {
        return {
          username: res.user.username,
          name: res.user.name,
          role: res.user.role,
          email: res.user.email || `${res.user.username}@eldercare.demo`,
          isDemo: demoUsers.some((d) => d.username.toLowerCase() === res.user.username.toLowerCase()),
        };
      }
    } catch {}

    const allUsers = getAllUsers();
    const match = allUsers.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean)
    );
    if (!match) return null;
    return {
      username: match.username,
      name: match.name,
      role: match.role,
      email: match.email || `${match.username}@eldercare.demo`,
      isDemo: demoUsers.some((d) => d.username.toLowerCase() === match.username.toLowerCase()),
    };
  }, []);

  const resetPassword = useCallback(async (identifier, newPassword) => {
    if (!identifier || !newPassword) {
      return { success: false, message: 'Invalid request details.' };
    }

    try {
      const res = await authApi.resetPassword(identifier, newPassword);
      if (res.success) {
        return { success: true, message: 'Password has been updated successfully.' };
      }
    } catch {}

    const clean = identifier.trim().toLowerCase();
    const allUsers = getAllUsers();
    const match = allUsers.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean)
    );
    if (!match) {
      return { success: false, message: 'No account found matching those details.' };
    }

    const isDemo = demoUsers.some((d) => d.username.toLowerCase() === match.username.toLowerCase());
    if (isDemo) {
      const overrides = loadDemoPasswordOverrides();
      overrides[match.username.toLowerCase()] = newPassword;
      saveDemoPasswordOverrides(overrides);
    } else {
      const registered = loadRegisteredUsers();
      const updated = registered.map((u) => {
        if (
          u.username.toLowerCase() === match.username.toLowerCase() ||
          (u.email && u.email.toLowerCase() === match.email?.toLowerCase())
        ) {
          return { ...u, password: newPassword };
        }
        return u;
      });
      saveRegisteredUsers(updated);
    }

    return { success: true, message: 'Password has been updated successfully.' };
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false, message: 'No active session.' };

    const newName = updates.name ? updates.name.trim() : user.name;
    if (!newName) {
      return { success: false, message: 'Full name cannot be empty.' };
    }

    const initials = newName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('') || user.initials || 'EC';

    const cleanEmail = updates.email !== undefined ? updates.email.trim() : (user.email || '');
    const cleanPhone = updates.phone !== undefined ? updates.phone.trim() : (user.phone || '');

    const updatedUser = {
      ...user,
      ...updates,
      name: newName,
      initials,
      email: cleanEmail,
      phone: cleanPhone,
      ...(user.role === 'caregiver' ? { caregiverName: newName } : {}),
    };

    // 1. Backend API update if reachable
    try {
      const res = await authApi.updateProfile({
        id: updatedUser.id,
        username: updatedUser.username,
        name: newName,
        email: cleanEmail,
        phone: cleanPhone,
        initials,
        role: updatedUser.role,
        title: updatedUser.title,
      });
      if (res?.success && res?.user) {
        Object.assign(updatedUser, res.user);
      }
    } catch (apiErr) {
      console.warn('[Profile] Backend offline, persisting locally:', apiErr.message);
    }

    // 2. Update React user state
    setUser(updatedUser);

    // 3. Update active session
    const payload = JSON.stringify(updatedUser);
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, payload);
      } else {
        localStorage.setItem(SESSION_KEY, payload);
      }
    } catch (err) {
      console.warn('[AppContext] Failed to update session storage:', err);
    }

    // 4. Update demo profile overrides or registered users
    const isDemo = demoUsers.some((d) => d.username.toLowerCase() === updatedUser.username?.toLowerCase());
    if (isDemo) {
      const demoProfiles = loadDemoProfileOverrides();
      demoProfiles[updatedUser.username.toLowerCase()] = {
        name: updatedUser.name,
        initials: updatedUser.initials,
        email: updatedUser.email,
        phone: updatedUser.phone,
        ...(updatedUser.title ? { title: updatedUser.title } : {}),
        ...(updatedUser.role === 'caregiver' ? { caregiverName: updatedUser.name } : {}),
      };
      saveDemoProfileOverrides(demoProfiles);
    } else {
      const registered = loadRegisteredUsers();
      const nextRegistered = registered.map((u) => {
        if (
          (u.id && u.id === updatedUser.id) ||
          (u.username && u.username.toLowerCase() === updatedUser.username.toLowerCase())
        ) {
          return { ...u, ...updatedUser };
        }
        return u;
      });
      saveRegisteredUsers(nextRegistered);
    }

    return { success: true, user: updatedUser, message: 'Profile updated successfully.' };
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setJwtToken(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(JWT_TOKEN_KEY);
    sessionStorage.removeItem(JWT_TOKEN_KEY);
  }, []);

  const markAsRead = useCallback(async (id) => {
    setNotificationList((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, read: true, isRead: true } : n
      );
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('[AppContext] Failed to save notifications to localStorage:', err);
      }
      return updated;
    });

    try { await notificationsApi.markRead(id); } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotificationList((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true, isRead: true }));
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('[AppContext] Failed to save notifications to localStorage:', err);
      }
      return updated;
    });

    try { await notificationsApi.markAllRead(); } catch {}
  }, []);

  const removeNotification = useCallback(async (id) => {
    setNotificationList((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('[AppContext] Failed to save notifications to localStorage:', err);
      }
      return updated;
    });

    try { await notificationsApi.delete(id); } catch {}
  }, []);

  const pushMedicationReminder = useCallback((med, customOptions = {}) => {
    if (!med) return null;
    const senderRole = customOptions.senderRole || user?.role || 'admin';
    const senderName = customOptions.senderName || user?.name || (senderRole === 'admin' ? 'System Administrator' : senderRole === 'caregiver' ? 'Caregiver' : senderRole === 'family' ? 'Family Member' : 'Patient');
    const patientId = customOptions.patientId || med.patientId || med.residentId;
    const patient = customOptions.patient || med.patient;
    const caregiver = customOptions.caregiver || med.caregiver;
    const targetRoles = customOptions.targetRoles || getReminderTargetRoles(senderRole);

    const id = med.id ? `NT-MED-${med.id}-${Date.now()}` : `NT-${Date.now()}-${Math.round(Math.random() * 999)}`;
    const newNotif = {
      id,
      type: 'medication',
      title: 'Medication Reminder',
      time: med.time || 'Now',
      patient,
      patientId,
      residentId: patientId,
      caregiver,
      medicine: med.medicine,
      dosage: med.dosage,
      detail: `${med.medicine || 'Medicine'} · ${med.dosage || ''}`,
      desc: `${patient || 'Patient'}, it is time to take your ${med.medicine || 'medication'} ${med.dosage || ''}.`,
      message: `${patient || 'Patient'}, it is time to take your ${med.medicine || 'medication'} ${med.dosage || ''}.`,
      group: 'today',
      read: false,
      isRead: false,
      actionable: true,
      senderRole,
      senderName,
      targetRoles,
      createdAt: new Date().toISOString(),
    };

    setNotificationList((prev) => {
      const existingIdx = prev.findIndex((n) => n.id === id);
      let next;
      if (existingIdx !== -1) {
        next = prev.map((n, idx) => (idx === existingIdx ? { ...newNotif } : n));
      } else {
        next = [newNotif, ...prev];
      }
      try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('[AppContext] Failed to save notifications to localStorage:', err);
      }
      return next;
    });

    setReminderQueue((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      const next = [...filtered, newNotif];
      try {
        localStorage.setItem(REMINDER_QUEUE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    return id;
  }, [user]);

  const dismissReminder = useCallback((id) => {
    setReminderQueue((prev) => {
      const next = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(REMINDER_QUEUE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const scheduleAdvanceReminder = useCallback((scheduleData) => {
    const id = `SCHED-${Date.now()}-${Math.round(Math.random() * 999)}`;
    const newSchedule = {
      id,
      medId: scheduleData.medId,
      patientId: scheduleData.patientId,
      patient: scheduleData.patient,
      caregiver: scheduleData.caregiver,
      medicine: scheduleData.medicine,
      dosage: scheduleData.dosage,
      scheduledDoseTime: scheduleData.scheduledDoseTime,
      triggerTimestamp: scheduleData.triggerTimestamp,
      triggerTimeFormatted: scheduleData.triggerTimeFormatted,
      leadOption: scheduleData.leadOption,
      createdAt: Date.now(),
      status: 'active',
    };

    setScheduledReminders((prev) => {
      const filtered = prev.filter((s) => s.medId !== scheduleData.medId);
      const next = [...filtered, newSchedule];
      try {
        localStorage.setItem(SCHEDULED_REMINDERS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    return newSchedule;
  }, []);

  const cancelScheduledReminder = useCallback((medId) => {
    setScheduledReminders((prev) => {
      const next = prev.filter((s) => s.medId !== medId && s.id !== medId);
      try {
        localStorage.setItem(SCHEDULED_REMINDERS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const scopedNotificationList = useMemo(
    () => scopeNotifications(user, notificationList, residentList),
    [user, notificationList, residentList]
  );

  const unreadCount = useMemo(
    () => scopedNotificationList.filter((n) => !(n.isRead || n.read)).length,
    [scopedNotificationList]
  );

  const [settings, setSettingsState] = useState(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const activeColor = (!parsed || parsed.colorTheme === 'terracotta' || parsed.colorTheme === 'emerald' || parsed.colorTheme === 'indigo') ? 'oceanic' : parsed.colorTheme;
      return {
        language: parsed?.language || 'en',
        theme: parsed?.theme || 'light',
        colorTheme: activeColor,
        toggles: parsed?.toggles || { medication: true, appointment: true, health: true, emergency: true }
      };
    } catch {
      return { language: 'en', theme: 'light', colorTheme: 'oceanic', toggles: { medication: true, appointment: true, health: true, emergency: true } };
    }
  });

  const setSettings = useCallback(async (next) => {
    setSettingsState((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    });

    if (user?.id) {
      try {
        await settingsApi.update(user.id, next);
      } catch {}
    }
  }, [user?.id]);

  useEffect(() => {
    const currentTheme = settings?.theme === 'dark' ? 'dark' : 'light';
    const currentColorTheme = settings?.colorTheme || 'oceanic';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-color-theme', currentColorTheme);
  }, [settings?.theme, settings?.colorTheme]);

  const language = settings?.language || 'en';

  const t = useCallback(
    (key, fallback) => {
      return getTranslation(settings?.language || 'en', key) || fallback || key;
    },
    [settings?.language]
  );

  const value = {
    isAuthenticated,
    user,
    dbStatus,
    dbDetails,
    refreshDbConnection: () => checkDbAndSync(true),
    login,
    googleLogin,
    logout,
    register,
    updateProfile,
    findUserForReset,
    resetPassword,
    notificationList: scopedNotificationList,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    pushMedicationReminder,
    reminderQueue,
    dismissReminder,
    scheduledReminders,
    scheduleAdvanceReminder,
    cancelScheduledReminder,
    settings,
    setSettings,
    residents: residentList,
    addResident,
    refreshResidents,
    deleteResident,
    caregivers: caregiverList,
    addCaregiver,
    updateCaregiver,
    deleteCaregiver,
    careTasks,
    addCareTask,
    updateCareTask,
    toggleCareTask,
    reassignCareTask,
    reassignResident,
    carePlans: carePlanList,
    toggleCarePlanTask,
    appointments: appointmentList,
    addAppointment,
    deleteAppointment,
    emergencyAlerts,
    activeEmergencies,
    triggerEmergencyAlert,
    respondToEmergency,
    resolveEmergency,
    cancelEmergency,
    voicemails: voicemailList,
    unreadVoicemailCount,
    addVoicemail,
    markVoicemailAsRead,
    deleteVoicemail,
    fetchVoicemails,
    language,
    changeLanguage: (lang) => setSettings({ language: lang }),
    t,
    jwtToken,
    recentlyAccessed,
    trackRecentlyAccessed,
    clearRecentlyAccessed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
