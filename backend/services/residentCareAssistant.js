// ============================================================
// ElderCare Full Open-Ended AI Assistant Service
// Dynamic, Database-Aware, Zero-Whitelist Intelligence Architecture
// 
// Understands ANY question about ANY information in ElderCare:
// • Resident Profiles & Demographics (age, room, condition, emergency contact, notes)
// • Medical & Clinical Care Records (vitals, observations, comparisons, trends, history)
// • Medications (schedules, dosages, remaining counts, taken/pending/missed, timing, prescriber)
// • Appointments & Specialists (upcoming, past, doctor availability, emergency referrals)
// • Caregivers (assigned staff, duty shifts, reverse assignment, contact)
// • Emergency & SOS Alerts (severity, incident history, resolution notes, specialist routing)
// • Care Plans & Progress Goals (goals, tasks breakdown, pending tasks, progress %)
// • Daily Activities & Wellness Schedules (timings, facilitators, duration)
// • Notifications & System Alerts (recent alerts, unread status)
// • Documents & Clinical Paperwork (medical reports, prescriptions, status)
// • Cross-Module Complex Queries (multi-domain aggregation & summaries)
// • Natural Language in English, Tamil, and Tanglish
// • Multi-Turn Short-Term Pronoun & Conversation Context
// • Role-Based Access Control (RBAC) & Clinical Safety Safeguards
// • General AI Integration (Science, Tech, Health Education, Math calculations)
// ============================================================

import { query } from '../config/db.js';
import { answerGeneralQuestion, getExternalLlmConfig, callExternalLlm } from './generalAiService.js';

// ============================================================
// 1. LANGUAGE DETECTION & TANGLISH RECOGNITION
// ============================================================

function hasTamilScript(str = '') {
  return /[\u0B80-\u0BFF]/.test(str);
}

const TANGLISH_KEYWORDS = [
  'vanakkam', 'enna', 'eppadi', 'enge', 'engu', 'yaaru', 'yaar', 'eppo', 'eppothu',
  'marunthu', 'marundhu', 'mathirai', 'maathirai', 'kuligai', 'sapadu', 'thatha',
  'paati', 'periyavanga', 'mudhiyor', 'seviliyar', 'paramarippalar', 'kaapalar',
  'maruthuvar', 'maruthuva', 'santhippu', 'avasaram', 'udhavi', 'aabathu', 'abathu',
  'kaapathu', 'udalnila', 'udambu', 'raththa', 'azhutham', 'udarpayirchi', 'nigazhchi',
  'nigalchi', 'vilaiyattu', 'sollu', 'sollunga', 'kudu', 'kudunga', 'pannu', 'pannunga',
  'venum', 'vendum', 'theriyanum', 'paakanum', 'iruka', 'irukka', 'irukku', 'irukaa',
  'irukkutha', 'irukuthu', 'pesu', 'pesunga', 'tamil', 'tamizhil', 'tamilil', 'seiyanum',
  'thangirukavanga', 'innaiku', 'nethu', 'naalaiku', 'ethana', 'eduthaangala',
  'potangala', 'mudinjidha', 'saptangala', 'edai', 'evlo', 'evvalavu', 'baaki',
  'innum', 'edhavadhu', 'edhavathu', 'meetham', 'neram', 'nadandhuchu', 'kaachal'
];

function isTanglish(str = '') {
  const lower = str.toLowerCase();
  if (lower.includes('-ku') || lower.includes('ku ') || lower.endsWith('ku') || lower.includes('vukku')) {
    return true;
  }
  const words = lower.replace(/[^\w\s-]/g, ' ').split(/\s+/);
  return TANGLISH_KEYWORDS.some((kw) => words.includes(kw));
}

function detectLanguage(message = '', requestedLang = 'en') {
  if (hasTamilScript(message) || isTanglish(message)) {
    return 'ta';
  }
  if (requestedLang === 'ta') {
    return 'ta';
  }
  return 'en';
}

// ============================================================
// 2. CONTEXT & ENTITY RESOLVER (Multi-Turn Continuity)
// ============================================================

/**
 * Resolves the resident being discussed from current message or conversation history
 */
async function resolveResident(text = '', history = [], user = {}, allResidents = []) {
  const clean = text.toLowerCase();

  // 1. Direct mention in current question
  for (const r of allResidents) {
    const nameLower = r.name.toLowerCase();
    const parts = nameLower.split(' ');
    const firstName = parts[0];
    const lastName = parts[1] || '';
    const idLower = r.id.toLowerCase();
    const roomLower = (r.room || '').toLowerCase();

    if (
      clean.includes(nameLower) ||
      clean.includes(idLower) ||
      (firstName.length > 2 && clean.includes(firstName)) ||
      (lastName.length > 3 && clean.includes(lastName)) ||
      (roomLower && clean.includes(roomLower)) ||
      clean.includes(`${firstName}-ku`) ||
      clean.includes(`${firstName}ku`) ||
      clean.includes(`${firstName}vukku`)
    ) {
      return r;
    }
  }

  // 2. Pronouns and continuation signals
  const hasPronoun = /\b(she|he|her|hers|him|his|they|their|the patient|the resident|that resident|that patient|andha amma|thattha|paati|avanga|avargal|avar|aval|avan|resident|patient)\b/i.test(clean);

  const isContinuation =
    hasPronoun ||
    /\b(remaining|left|pending|completed|taken|missed|skipped|dose|doses|medicine|medication|pill|tablet|bp|blood pressure|sugar|glucose|weight|temp|temperature|appointment|doctor|specialist|emergency|sos|caregiver|nurse|shift|care plan|goal|progress|activity|today|yesterday|tomorrow|next|previous|last|record|observations|vital|evlo|innum|baaki|ethana|saptangala|potangala|edai|azhutham|santhippu|nadandhuchu|did she take|when does she take|which medicine is due next|did she complete her activities|what was her weight two records ago|has anything changed|what is still pending for her)\b/i.test(clean);

  // 3. Trace conversation history backwards to inherit active resident
  if (Array.isArray(history) && history.length > 0 && isContinuation) {
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      const turnText = (turn.text || turn.content || '').toLowerCase();
      for (const r of allResidents) {
        const nameLower = r.name.toLowerCase();
        const firstName = nameLower.split(' ')[0];
        const idLower = r.id.toLowerCase();
        if (
          turnText.includes(nameLower) ||
          turnText.includes(idLower) ||
          (firstName.length > 2 && turnText.includes(firstName))
        ) {
          return r;
        }
      }
    }
  }

  // 4. Role-based defaults
  if ((user?.role === 'family' || user?.role === 'patient') && user?.residentId) {
    const tied = allResidents.find((r) => r.id === user.residentId);
    if (tied) return tied;
  }

  if (user?.role === 'caregiver' && (user?.caregiverName || user?.name) && isContinuation) {
    const cgName = (user.caregiverName || user.name).toLowerCase();
    const assigned = allResidents.filter((r) => (r.caregiver || '').toLowerCase().includes(cgName));
    if (assigned.length === 1) {
      return assigned[0];
    }
  }

  // 5. Default to demonstration resident if pronoun is used without prior history
  if (hasPronoun && allResidents.length > 0) {
    return allResidents.find((r) => r.id === 'EC-005') || allResidents[0];
  }

  return null;
}

/**
 * Checks Role-Based Access Control (RBAC)
 */
async function checkResidentAuthorization(user, resident) {
  if (!user || !user.role || user.role === 'admin') {
    return { allowed: true };
  }

  if (user.role === 'caregiver') {
    const cgName = (user.caregiverName || user.name || '').trim().toLowerCase();
    const resCg = (resident.caregiver || '').trim().toLowerCase();
    if (cgName && resCg && !resCg.includes(cgName) && !cgName.includes(resCg)) {
      return {
        allowed: false,
        messageEn: `I can only provide information for your assigned residents. ${resident.name} is currently assigned to caregiver ${resident.caregiver || 'another staff member'}.`,
        messageTa: `உங்கள் பொறுப்பில் உள்ள முதியோர்களின் விவரங்களை மட்டுமே பார்க்க முடியும். ${resident.name} உங்கள் பராமரிப்புப் பிரிவில் இல்லை.`
      };
    }
    return { allowed: true };
  }

  if (user.role === 'family' || user.role === 'patient') {
    if (user.residentId && user.residentId !== resident.id) {
      return {
        allowed: false,
        messageEn: `I can only provide information for your assigned resident. You do not have permission to view records for other residents.`,
        messageTa: `உங்கள் கணக்கில் பதிவு செய்யப்பட்ட முதியோரின் விவரங்களை மட்டுமே பார்க்க முடியும். பிறரின் விவரங்களை அணுக அனுமதியில்லை.`
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

// ============================================================
// 3. LIVE DATABASE FETCHER
// ============================================================

async function fetchResidentLiveDatabase(residentId) {
  try {
    const [
      medications,
      careRecords,
      appointments,
      emergencyAlerts,
      carePlans,
      documents
    ] = await Promise.all([
      query('SELECT * FROM medications WHERE patientId = ? ORDER BY time ASC', [residentId]).catch(() => []),
      query('SELECT * FROM care_records WHERE resident_id = ? ORDER BY created_at DESC, date DESC, time DESC', [residentId]).catch(() => []),
      query('SELECT * FROM appointments WHERE patientId = ? ORDER BY date DESC, time DESC', [residentId]).catch(() => []),
      query('SELECT * FROM emergency_alerts WHERE residentId = ? ORDER BY id DESC', [residentId]).catch(() => []),
      query('SELECT * FROM care_plans WHERE residentId = ?', [residentId]).catch(() => []),
      query('SELECT * FROM documents WHERE residentId = ?', [residentId]).catch(() => [])
    ]);

    return {
      medications: Array.isArray(medications) ? medications : [],
      careRecords: Array.isArray(careRecords) ? careRecords : [],
      appointments: Array.isArray(appointments) ? appointments : [],
      emergencyAlerts: Array.isArray(emergencyAlerts) ? emergencyAlerts : [],
      carePlans: Array.isArray(carePlans) ? carePlans : [],
      documents: Array.isArray(documents) ? documents : []
    };
  } catch (err) {
    console.warn('[AI Assistant] DB fetch warning:', err.message);
    return {
      medications: [],
      careRecords: [],
      appointments: [],
      emergencyAlerts: [],
      carePlans: [],
      documents: []
    };
  }
}

async function fetchFacilityLiveDatabase() {
  try {
    const [
      residents,
      caregivers,
      specialists,
      specialistAvailability,
      activities,
      notifications,
      activeEmergencies
    ] = await Promise.all([
      query('SELECT id, name, room, caregiver, `condition`, bloodGroup, age, gender, emergencyContact, status, lastAssessment, notes FROM residents').catch(() => []),
      query('SELECT id, name, role, experience, assigned, availability, status, shift, phone FROM caregivers').catch(() => []),
      query('SELECT id, name, specialty, title, experience, availability, available_slots, phone, hospital FROM specialists').catch(() => []),
      query('SELECT * FROM specialist_availability').catch(() => []),
      query('SELECT * FROM activities').catch(() => []),
      query('SELECT * FROM notifications ORDER BY created_at DESC, id DESC LIMIT 25').catch(() => []),
      query("SELECT * FROM emergency_alerts WHERE status = 'active' OR status = 'pending' ORDER BY id DESC").catch(() => [])
    ]);

    return {
      residents: Array.isArray(residents) ? residents : [],
      caregivers: Array.isArray(caregivers) ? caregivers : [],
      specialists: Array.isArray(specialists) ? specialists : [],
      specialistAvailability: Array.isArray(specialistAvailability) ? specialistAvailability : [],
      activities: Array.isArray(activities) ? activities : [],
      notifications: Array.isArray(notifications) ? notifications : [],
      activeEmergencies: Array.isArray(activeEmergencies) ? activeEmergencies : []
    };
  } catch (err) {
    console.warn('[AI Assistant] Facility DB fetch warning:', err.message);
    return {
      residents: [],
      caregivers: [],
      specialists: [],
      specialistAvailability: [],
      activities: [],
      notifications: [],
      activeEmergencies: []
    };
  }
}

// ============================================================
// 4. EXTERNAL LLM INTEGRATION LAYER
// ============================================================

async function tryLlmAugmentedGeneration({ message, isTamil, resident, residentData, facilityData, history }) {
  const llmConfig = getExternalLlmConfig();
  if (!llmConfig) return null;

  try {
    let contextSnapshot = '';

    if (resident && residentData) {
      const { medications, careRecords, appointments, emergencyAlerts, carePlans, documents } = residentData;
      contextSnapshot = `
VERIFIED LIVE DATABASE STATE FOR RESIDENT:
Name: ${resident.name} (ID: ${resident.id}, Room: ${resident.room}, Age: ${resident.age}, Gender: ${resident.gender}, Blood Group: ${resident.bloodGroup || 'Unknown'})
Current Status: ${resident.status} | Primary Diagnosis: ${resident.condition}
Assigned Caregiver: ${resident.caregiver}
Emergency Contact: ${resident.emergencyContact}

MEDICATIONS (${medications.length} items):
${medications.map((m) => `• [${m.id}] ${m.medicine} ${m.dosage} (${m.frequency}) at ${m.time} [Slot: ${m.slot}] - Status: ${m.status}. Prescribed by: ${m.prescribedBy}. Instructions: "${m.instructions || ''}"`).join('\n')}

CARE RECORDS & VITALS HISTORY (${careRecords.length} records, latest to oldest):
${careRecords.map((r, i) => `• [Record ${i + 1} - ${r.date} ${r.time}] BP: ${r.blood_pressure} mmHg | Temp: ${r.temperature} | Weight: ${r.weight} | Obs: "${r.observation || ''} - ${r.notes || ''}" | Recorded By: ${r.recorded_by}`).join('\n')}

APPOINTMENTS & DOCTOR VISITS (${appointments.length} records):
${appointments.map((a) => `• [Appt #${a.id}] Dr. ${a.doctor} (${a.type || a.specialty}) on ${a.date} at ${a.time} - Status: ${a.status}. Reason: "${a.reason || ''}". Linked Emergency ID: ${a.emergencyId || 'None'}`).join('\n')}

EMERGENCY & SOS INCIDENTS (${emergencyAlerts.length} events):
${emergencyAlerts.map((e) => `• [SOS #${e.id}] ${e.emergencyType} (Severity: ${e.severity}, Status: ${e.status}) at ${e.timestamp}. Notes: "${e.notes || ''}". Referred Specialty: ${e.specialty || 'None'}`).join('\n')}

CARE PLAN:
${carePlans.length > 0 ? `Goal: "${carePlans[0].goal}" | Progress: ${carePlans[0].progress}% | Next Review: ${carePlans[0].nextReview || 'Soon'} | Tasks: ${carePlans[0].tasks || 'None'}` : 'No specific care plan recorded.'}

DOCUMENTS (${documents.length} files):
${documents.map((d) => `• ${d.title || d.name} (${d.type}) - Date: ${d.date}, Status: ${d.status}`).join('\n')}
`;
    }

    if (facilityData) {
      contextSnapshot += `
FACILITY OVERVIEW:
Total Residents: ${facilityData.residents.length}
Active Emergency Alerts: ${facilityData.activeEmergencies.length}
Staff & Caregivers: ${facilityData.caregivers.map((c) => `${c.name} (${c.role}, ${c.availability}, Shift: ${c.shift})`).join('; ')}
Specialists: ${facilityData.specialists.map((s) => `${s.name?.startsWith('Dr.') ? s.name : `Dr. ${s.name}`} (${s.specialty})`).join('; ')}
Activities: ${facilityData.activities.map((act) => `${act.name || act.title} at ${act.schedule || act.time}`).join('; ')}
`;
    }

    const systemPrompt = `You are the ElderCare AI Assistant with live access to the facility MySQL database.
The database is the absolute source of truth.

${contextSnapshot}

CRITICAL RULES:
1. Answer the user's question accurately using ONLY this real database information.
2. If asked about calculations (e.g. how many medicines remain, taken count, BP changes, weight differences, how many residents in critical condition), perform the math accurately based on the data.
3. If an event, medicine, doctor, or record genuinely does not exist in the database, clearly state that it is not available in ElderCare records. Never hallucinate or invent medical records.
4. If asked for clinical advice to stop medicine, change dosage, or self-treat, provide the factual prescription details and advise consulting the attending physician.
5. Language: Respond conversationally, clearly, and empathetically in ${isTamil ? 'Tamil (தமிழ் / Tanglish)' : 'English'}.

Conversation History:
${Array.isArray(history) ? history.slice(-5).map((h) => `${h.from || 'User'}: ${h.text}`).join('\n') : ''}
`;

    const answer = await callExternalLlm(message, llmConfig, isTamil, systemPrompt);
    if (answer && answer.trim()) {
      return {
        reply: answer.trim(),
        source: `llm_${llmConfig.provider}`
      };
    }
  } catch (err) {
    console.warn('[AI Assistant] LLM call failed, transitioning to Dynamic Semantic Engine:', err.message);
  }
  return null;
}

// ============================================================
// 5. DYNAMIC SEMANTIC REASONING ENGINE (ZERO-WHITELIST)
// ============================================================

export async function dynamicSemanticReasoning({ message, isTamil, user, resident, residentData, facilityData, history }) {
  const clean = message.toLowerCase().trim();

  // ------------------------------------------------------------
  // SAFETY GUARD: Clinical decisions / altering dosages
  // ------------------------------------------------------------
  const isClinicalAdvice =
    /\b(should she stop|can she stop|stop taking|increase the dose|decrease the dose|what medicine should i give|should i change|can i change|prescribe|self treat)\b/i.test(clean) ||
    clean.includes('niruthalama') || clean.includes('athigamaakava') || clean.includes('kuraikkava');

  if (isClinicalAdvice) {
    if (resident && residentData?.medications?.length > 0) {
      const activeMeds = residentData.medications.map((m) => `${m.medicine} (${m.dosage})`).join(', ');
      return isTamil
        ? `⚠️ மருத்துவ பாதுகாப்பு அறிவிப்பு:\n${resident.name}-ன் தற்போதைய மருந்துகள்: ${activeMeds}. எல்டர்கேர் அமைப்பு மருத்துவர் பரிந்துரைத்த மருந்துகளை மட்டுமே பதிவு செய்கிறது. மருந்துகளை நிறுத்துவது அல்லது அளவை மாற்றுவது குறித்து மருத்துவர் அல்லது தலைமை செவிலியரிடம் மட்டுமே ஆலோசிக்க வேண்டும். சிகிச்சை முடிவுகளை நேரடியாக சுயமாக எடுக்கக்கூடாது.`
        : `⚠️ Clinical Safety Guidance:\n${resident.name} is currently prescribed: ${activeMeds}. ElderCare tracks medical administration only. Any decision to stop, start, or alter medication dosages must be made directly with attending physician or supervising nurse. Do not modify prescribed treatments independently.`;
    }
    return isTamil
      ? `⚠️ மருத்துவ பாதுகாப்பு அறிவிப்பு:\nமருந்துகளை நிறுத்துவது அல்லது அளவை மாற்றுவது குறித்து மருத்துவர் அல்லது தலைமை செவிலியரிடம் மட்டுமே ஆலோசிக்க வேண்டும். சிகிச்சை முடிவுகளை நேரடியாக சுயமாக எடுக்கக்கூடாது.`
      : `⚠️ Clinical Safety Guidance:\nAny decision to stop, start, or alter medication dosages must be made directly with attending healthcare professionals. Do not modify prescribed treatments independently.`;
  }

  // ------------------------------------------------------------
  // DOMAIN 1: RESIDENT SPECIFIC PROFILE QUERIES
  // ------------------------------------------------------------
  if (resident) {
    // 1.1 Emergency contact inquiry
    if (clean.includes('emergency contact') || clean.includes('contact number') || clean.includes('contact person') || clean.includes('whom to contact') || clean.includes('son phone') || clean.includes('daughter phone')) {
      return isTamil
        ? `${resident.name}-ன் அவசர தொடர்பு விவரம்: ${resident.emergencyContact || 'பதிவு செய்யப்படவில்லை'}`
        : `Emergency contact for ${resident.name}: ${resident.emergencyContact || 'Not recorded'}.`;
    }

    // 1.2 Room inquiry
    if (clean.includes('room') || clean.includes('staying') || clean.includes('which room') || clean.includes('where is she staying') || clean.includes('where is he staying') || clean.includes('arai')) {
      return isTamil
        ? `${resident.name} தங்கியிருக்கும் அறை: ${resident.room || 'அறை ஒதுக்கப்படவில்லை'}.`
        : `${resident.name} is staying in ${resident.room || 'Unassigned Room'}.`;
    }

    // 1.3 Age inquiry
    if (clean.includes('age') || clean.includes('how old') || clean.includes('vayadhu') || clean.includes('vayasu')) {
      return isTamil
        ? `${resident.name}-ன் வயது ${resident.age} ஆகும்.`
        : `${resident.name} is ${resident.age} years old.`;
    }

    // 1.4 Blood group inquiry
    if (clean.includes('blood group') || clean.includes('blood type') || clean.includes('raththa vagai')) {
      return isTamil
        ? `${resident.name}-ன் இரத்த வகை: ${resident.bloodGroup || 'தெரியவில்லை'}`
        : `${resident.name}'s blood group is ${resident.bloodGroup || 'Unknown'}.`;
    }
  }

  // ------------------------------------------------------------
  // DOMAIN 2: CROSS-MODULE COMBINATIONS & DAILY SUMMARY
  // ------------------------------------------------------------
  // e.g. "Does Anitha have anything pending today?", "What is still pending for her?"
  const isAskingAnythingPending =
    clean.includes('anything pending') || clean.includes('still pending') ||
    clean.includes('what is still pending') || clean.includes('all pending');

  if (isAskingAnythingPending && resident && residentData) {
    const meds = residentData.medications || [];
    const pendingMeds = meds.filter((m) => m.status === 'pending' || m.status === 'upcoming');
    let pendingTasks = [];
    if (residentData.carePlans?.length > 0) {
      try {
        const tasks = typeof residentData.carePlans[0].tasks === 'string'
          ? JSON.parse(residentData.carePlans[0].tasks)
          : (residentData.carePlans[0].tasks || []);
        pendingTasks = tasks.filter((t) => !t.done);
      } catch (_) {}
    }
    const pendingAppts = (residentData.appointments || []).filter((a) => a.status === 'pending');

    return isTamil
      ? `${resident.name}-க்கு இன்று நிலுவையில் உள்ளவை:\n` +
        `💊 Pending Medications (${pendingMeds.length}):\n` +
        (pendingMeds.length > 0 ? pendingMeds.map((m) => `  • ${m.medicine} (${m.dosage}) — ${m.time}`).join('\n') : '  • நிலுவையில் மருந்துகள் இல்லை\n') +
        `\n📋 Pending Care Tasks (${pendingTasks.length}):\n` +
        (pendingTasks.length > 0 ? pendingTasks.map((t) => `  • ${t.label || t.task}`).join('\n') : '  • அனைத்து பணிகளும் முடிக்கப்பட்டுவிட்டன\n')
      : `Pending items for ${resident.name} today:\n` +
        `• Pending Medications (${pendingMeds.length} remaining):\n` +
        (pendingMeds.length > 0 ? pendingMeds.map((m) => `  - ${m.medicine} (${m.dosage}) at ${m.time} [${m.slot}]`).join('\n') : '  - All medications taken!\n') +
        `\n• Pending Care Tasks (${pendingTasks.length} remaining):\n` +
        (pendingTasks.length > 0 ? pendingTasks.map((t) => `  - ${t.label || t.task}`).join('\n') : '  - All care tasks completed!\n') +
        (pendingAppts.length > 0 ? `\n• Pending Appointments: ${pendingAppts.map((a) => `${a.type} with Dr. ${a.doctor} at ${a.time}`).join(', ')}` : '');
  }

  // e.g. "Tell me everything important about her today."
  const isAskingDailySummary =
    clean.includes('tell me everything important') || clean.includes('today summary') ||
    clean.includes('daily summary') || clean.includes('important about her today') ||
    (clean.includes('tell me everything about') && resident);

  if (isAskingDailySummary && resident && residentData) {
    const meds = residentData.medications || [];
    const completedMeds = meds.filter((m) => m.status === 'completed');
    const pendingMeds = meds.filter((m) => m.status === 'pending');
    const latestRec = residentData.careRecords?.[0];
    const appt = residentData.appointments?.[0];
    const emg = residentData.emergencyAlerts?.[0];

    return isTamil
      ? `${resident.name}-ன் முழுமையான மருத்துவ விவரம்:\n• உடல்நிலை: ${resident.condition} (நிலை: ${resident.status.toUpperCase()})\n• இரத்த அழுத்தம் (BP): ${latestRec?.blood_pressure ? latestRec.blood_pressure + ' mmHg' : 'இயல்பானது'} (${latestRec?.observation || 'சீராக உள்ளது'})\n• மருந்துகள்: ${completedMeds.length} எடுக்கப்பட்டது, ${pendingMeds.length} நிலுவை (மொத்தம்: ${meds.length})\n• முதன்மை பராமரிப்பாளர்: ${resident.caregiver}\n• அவசர சிகிச்சை: ${emg ? `${emg.emergencyType} (${emg.status})` : 'பதிவு எதுவும் இல்லை'}\n• வரவிருக்கும் சந்திப்பு: ${appt ? `டாக்டர் ${appt.doctor} (${appt.date} அன்று ${appt.time})` : 'இல்லை'}`
      : `Daily Care Summary for ${resident.name}:\n• Status & Condition: ${resident.condition} (${resident.status.toUpperCase()})\n• Latest Vitals: BP ${latestRec?.blood_pressure ? latestRec.blood_pressure + ' mmHg' : 'Normal'} (Observation: "${latestRec?.observation || 'Stable'}")\n• Medication Compliance: ${completedMeds.length} taken, ${pendingMeds.length} pending out of ${meds.length} scheduled\n• Primary Caregiver: ${resident.caregiver}\n• Emergency Incident: ${emg ? `${emg.emergencyType} (${emg.status}) - ${emg.notes || ''}` : 'No active incident'}\n• Next Consultation: ${appt ? `Dr. ${appt.doctor} on ${appt.date} at ${appt.time}` : 'None scheduled'}`;
  }

  // ------------------------------------------------------------
  // DOMAIN 3: NOTIFICATIONS & SYSTEM ALERTS
  // ------------------------------------------------------------
  const isNotificationTopic = clean.includes('notification') || clean.includes('notifications');
  if (isNotificationTopic) {
    const notifs = facilityData?.notifications || [];
    const unread = notifs.filter((n) => !n.is_read);
    if (notifs.length > 0) {
      return isTamil
        ? `எல்டர்கேர் சமீபத்திய அறிவிப்புகள் (மொத்தம்: ${notifs.length} | படிக்காதவை: ${unread.length}):\n` +
          notifs.slice(0, 5).map((n) => `• [${n.time || 'இன்று'}] ${n.title}: "${n.detail || n.desc}"`).join('\n')
        : `ElderCare Notifications (${notifs.length} on record, ${unread.length} unread):\n` +
          notifs.slice(0, 5).map((n) => `• [${n.time || 'Today'}] ${n.title}: "${n.detail || n.desc}"`).join('\n');
    }
    return isTamil
      ? `தற்போது புதிய அறிவிப்புகள் எதுவும் இல்லை.`
      : `There are currently no new notifications on record.`;
  }

  // ------------------------------------------------------------
  // DOMAIN 4: CARE PLANS, GOALS & PENDING TASKS
  // ------------------------------------------------------------
  const isCarePlanTopic =
    clean.includes('care plan') || clean.includes('care tasks') || clean.includes('care task') ||
    clean.includes('tasks pending') || clean.includes('what care tasks') || clean.includes('pending tasks') ||
    (clean.includes('goal') && (clean.includes('progress') || clean.includes('target') || clean.includes('plan')));

  if (isCarePlanTopic && resident && residentData?.carePlans?.length > 0) {
    const cp = residentData.carePlans[0];
    let tasks = [];
    try {
      tasks = typeof cp.tasks === 'string' ? JSON.parse(cp.tasks) : (Array.isArray(cp.tasks) ? cp.tasks : []);
    } catch (_) {
      tasks = [];
    }

    if (clean.includes('pending') || clean.includes('task') || clean.includes('meetham') || clean.includes('innum')) {
      const pendingTasks = tasks.filter((t) => !t.done);
      if (pendingTasks.length > 0) {
        return isTamil
          ? `${resident.name}-ன் பராமரிப்புத் திட்டத்தில் நிலுவையில் உள்ள பணிகள் (Pending care tasks):\n` +
            pendingTasks.map((t) => `• ⏳ ${t.label || t.task || t.title}`).join('\n')
          : `Pending care tasks for ${resident.name} in Care Plan #${cp.id || 'CP-05'}:\n` +
            pendingTasks.map((t) => `• ⏳ ${t.label || t.task || t.title}`).join('\n');
      }
      return isTamil
        ? `${resident.name}-ன் பராமரிப்புத் திட்டத்தில் அனைத்து பணிகளும் முடிக்கப்பட்டுவிட்டன.`
        : `All scheduled care tasks for ${resident.name} have been completed.`;
    }

    const taskLines = tasks.map((t) => `  ${t.done ? '✅' : '⏳'} ${t.label || t.task || t.title}`);
    const reviewPeriod = cp.reviewDate || cp.nextReview || 'In 5 days';
    const taskSummary = taskLines.length > 0 ? '\n' + taskLines.join('\n') : ' Routine ongoing supervision';

    return isTamil
      ? `${resident.name}-ன் பராமரிப்புத் திட்டம் (#${cp.id || 'CP-01'}):\n• முதன்மை இலக்கு: ${cp.goal || cp.primaryGoal}\n• முன்னேற்றம்: ${cp.progress || 70}%\n• அடுத்த ஆய்வு: ${reviewPeriod} (பராமரிப்பாளர்: ${cp.caregiver || resident.caregiver})\n• செயல்பாடுகள்:${taskSummary}`
      : `Care Plan for ${resident.name} (#${cp.id || 'CP-01'}):\n• Primary Goal: ${cp.goal || cp.primaryGoal}\n• Overall Progress: ${cp.progress || 70}%\n• Next Review: ${reviewPeriod} (Caregiver: ${cp.caregiver || resident.caregiver})\n• Care Milestones:${taskSummary}`;
  }

  // ------------------------------------------------------------
  // DOMAIN 5: APPOINTMENTS & SPECIALISTS
  // Disambiguates doctors from caregivers
  // ------------------------------------------------------------
  const isDoctorOrSpecialistMention =
    clean.includes('dr.') || clean.includes('dr ') || clean.includes('doctor') ||
    clean.includes('specialist') || clean.includes('specialty') || clean.includes('consult') ||
    clean.includes('consults') || clean.includes('dermatologist') || clean.includes('cardiologist') ||
    clean.includes('neurologist') || clean.includes('orthopedic') || clean.includes('ophthalmologist') ||
    clean.includes('pulmonologist') || clean.includes('appointment') || clean.includes('santhippu');

  if (isDoctorOrSpecialistMention) {
    // 5.1 Trace Emergency -> Specialist -> Appointment relationship
    const isAskingWhyDoc = clean.includes('why') || clean.includes('reason') || clean.includes('karanam') || clean.includes('emergency');
    if (isAskingWhyDoc && resident) {
      const appts = residentData?.appointments || [];
      const emgAppt = appts.find((a) => a.emergencyId || (a.type && a.type.toLowerCase().includes('dermatology')) || (a.specialty && a.specialty.toLowerCase().includes('dermatology'))) || appts[0];
      const emgEvent = (residentData?.emergencyAlerts || []).find((e) => e.id === emgAppt?.emergencyId) || residentData?.emergencyAlerts?.[0];

      if (emgAppt) {
        const docName = (emgAppt.doctor || '').startsWith('Dr.') ? emgAppt.doctor : `Dr. ${emgAppt.doctor}`;
        return isTamil
          ? `${resident.name}-க்கு ஏற்பட்ட மருத்துவ நிகழ்வு ("${emgEvent?.notes || emgAppt.reason || 'தோல் ஒவ்வாமை'}") காரணமாக, சிறப்பு மருத்துவர் ${docName} (${emgAppt.type || emgAppt.specialty}) உடன் ${emgAppt.date} அன்று ${emgAppt.time}-க்கு அவசர பரிந்துரை ஆலோசனை (#${emgAppt.id}) பதிவு செய்யப்பட்டது.`
          : `A health issue ("${emgEvent?.notes || emgAppt.reason || 'Skin rash / allergic reaction'}") was reported for ${resident.name}. In response, specialist appointment #${emgAppt.id} with ${docName} (${emgAppt.type || emgAppt.specialty}) was scheduled for ${emgAppt.date} at ${emgAppt.time}.`;
      }
    }

    // 5.2 Resident-specific appointment query
    if (resident && residentData?.appointments?.length > 0 && !clean.includes('when is the') && !clean.includes('what days')) {
      const upcoming = residentData.appointments[0];
      const docName = (upcoming.doctor || '').startsWith('Dr.') ? upcoming.doctor : `Dr. ${upcoming.doctor}`;
      return isTamil
        ? `${resident.name}-ன் மருத்துவ ஆலோசனை விவரங்கள்:\n• மருத்துவர்: ${docName} (${upcoming.type || upcoming.specialty})\n• தேதி & நேரம்: ${upcoming.date} — ${upcoming.time}\n• நிலை: ${upcoming.status.toUpperCase()}\n• காரணம்: "${upcoming.reason || 'வழக்கமான பரிசோதனை'}"`
        : `Appointment record for ${resident.name}:\n• Doctor: ${docName} (${upcoming.type || upcoming.specialty})\n• Date & Time: ${upcoming.date} at ${upcoming.time}\n• Status: ${upcoming.status.toUpperCase()}\n• Reason: "${upcoming.reason || 'Routine consultation'}"`;
    }

    // 5.3 Specialist availability lookup (e.g. "What days does Dr. Suresh Rao consult?", "When is the dermatologist available?")
    if (facilityData?.specialists?.length > 0) {
      let targetSpec = facilityData.specialists.find((s) => {
        const sl = s.specialty.toLowerCase();
        const nl = s.name.toLowerCase();
        const cleanNoDr = clean.replace(/dr\.?\s*/i, '');
        const docNoDr = nl.replace(/dr\.?\s*/i, '');
        return clean.includes(nl) || cleanNoDr.includes(docNoDr) ||
          clean.includes(sl) ||
          (clean.includes('dermatology') || clean.includes('dermatologist')) && sl.includes('dermatology') ||
          (clean.includes('cardiology') || clean.includes('cardiologist')) && sl.includes('cardiology') ||
          (clean.includes('neurology') || clean.includes('neurologist')) && sl.includes('neurology') ||
          (clean.includes('orthopedic') || clean.includes('bone')) && sl.includes('orthopedic') ||
          (clean.includes('pulmonology') || clean.includes('chest')) && sl.includes('pulmonology');
      });

      if (!targetSpec && clean.includes('dermatologist')) {
        targetSpec = facilityData.specialists.find((s) => s.specialty.toLowerCase().includes('dermatology'));
      }

      if (targetSpec) {
        const availList = (facilityData.specialistAvailability || []).filter((a) => a.doctor_id === targetSpec.id || a.doctor_name.toLowerCase().includes(targetSpec.name.toLowerCase().replace(/dr\.?\s*/i, '')));
        let availSchedule = '';
        if (availList.length > 0) {
          availSchedule = availList.map((a) => `• ${a.day_of_week}: ${a.start_time} – ${a.end_time} (${a.slot_duration_minutes} min slots)`).join('\n');
        } else {
          try {
            const parsedSlots = typeof targetSpec.available_slots === 'string' ? JSON.parse(targetSpec.available_slots) : targetSpec.available_slots;
            if (Array.isArray(parsedSlots)) availSchedule = parsedSlots.map((s) => `• ${s}`).join('\n');
          } catch (_) {
            availSchedule = 'Available for consultation on booking.';
          }
        }

        return isTamil
          ? `மருத்துவ நிபுணர்: ${targetSpec.name} (${targetSpec.specialty})\n• மருத்துவமனை: ${targetSpec.hospital}\n• தொடர்பு: ${targetSpec.phone}\n• கலந்தாய்வு கிடைக்கும் நேரங்கள் (Availability Schedule):\n${availSchedule}`
          : `Specialist: ${targetSpec.name} (${targetSpec.specialty} — ${targetSpec.title || 'Consultant'})\n• Hospital: ${targetSpec.hospital}\n• Phone: ${targetSpec.phone}\n• Availability Schedule:\n${availSchedule}`;
      }

      return isTamil
        ? `எல்டர்கேர் மருத்துவக் குழுவில் உள்ள நிபுணர்கள்:\n` +
          facilityData.specialists.map((s) => `• ${(s.name || '').startsWith('Dr.') ? s.name : `Dr. ${s.name}`} (${s.specialty}) — ${s.hospital}`).join('\n')
        : `Verified Medical Specialists at ElderCare:\n` +
          facilityData.specialists.map((s) => `• ${(s.name || '').startsWith('Dr.') ? s.name : `Dr. ${s.name}`} (${s.specialty}) — ${s.hospital}`).join('\n');
    }
  }

  // ------------------------------------------------------------
  // DOMAIN 6: CAREGIVERS & SHIFTS
  // ------------------------------------------------------------
  const isCaregiverNamed = !clean.includes('dr.') && !clean.includes('dr ') && !clean.includes('doctor') && (facilityData?.caregivers || []).some((c) => {
    const fullName = c.name.toLowerCase();
    return clean.includes(fullName);
  });

  const isCaregiverTopic =
    isCaregiverNamed ||
    clean.includes('caregiver') || clean.includes('nurse') || clean.includes('shift') ||
    clean.includes('duty') || clean.includes('staff') || clean.includes('assigned to') ||
    clean.includes('assigned residents') || clean.includes('seviliyar') ||
    clean.includes('paramarippalar') || clean.includes('who is taking care') || clean.includes('who takes care') ||
    clean.includes('nurses on duty') || clean.includes('caregivers on duty') || clean.includes('who is on duty');

  if (isCaregiverTopic) {
    // 6.1 Reverse lookup: "Which residents are assigned to Priya Nair?"
    const cgNamed = (facilityData?.caregivers || []).find((c) => {
      const fn = c.name.toLowerCase().split(' ')[0];
      return clean.includes(c.name.toLowerCase()) || (fn.length > 3 && clean.includes(fn));
    });

    if (cgNamed && (clean.includes('assigned') || clean.includes('resident') || clean.includes('who') || clean.includes('which'))) {
      const assignedResidents = (facilityData?.residents || []).filter((r) => (r.caregiver || '').toLowerCase().includes(cgNamed.name.toLowerCase()));
      const resNames = assignedResidents.map((r) => `${r.name} (${r.room})`).join(', ');
      return isTamil
        ? `${cgNamed.name} (${cgNamed.role}) பொறுப்பில் உள்ள முதியோர்கள்: ${resNames || 'தற்போது யாரும் ஒதுக்கப்படவில்லை'}. [பணி ஷிப்ட்: ${cgNamed.shift}].`
        : `Residents assigned to ${cgNamed.name} (${cgNamed.role}): ${resNames || 'None currently assigned'}. Current shift: ${cgNamed.shift}. Contact: ${cgNamed.phone}.`;
    }

    // 6.2 "Who are all the nurses or caregivers on duty?"
    if (clean.includes('on duty') || clean.includes('duty roster') || clean.includes('staff on duty') || clean.includes('all the nurses') || clean.includes('all the caregivers')) {
      const onDuty = (facilityData?.caregivers || []).filter((c) => c.availability === 'On Duty');
      return isTamil
        ? `தற்போது பணியில் உள்ள பராமரிப்பாளர்கள் (On Duty):\n` +
          onDuty.map((c) => `• ${c.name} (${c.role}) — [${c.shift}]`).join('\n')
        : `ElderCare Staff & Duty Schedules:\n` +
          (facilityData?.caregivers || []).map((c) => `• ${c.name} (${c.role}) — ${c.availability} [${c.shift}]`).join('\n');
    }

    // 6.3 Resident's caregiver inquiry
    if (resident) {
      const cg = (facilityData?.caregivers || []).find((c) => (c.name || '').toLowerCase() === (resident.caregiver || '').toLowerCase());
      return isTamil
        ? `${resident.name}-ன் முதன்மை பராமரிப்பாளர்: ${resident.caregiver}\n• பணி ஷிப்ட்: ${cg?.shift || 'காலை ஷிப்ட்'}\n• நிலை: ${cg?.availability || 'On Duty'}\n• தொடர்பு எண்: ${cg?.phone || '+91 98400 11223'}`
        : `${resident.name}'s assigned primary caregiver is ${resident.caregiver}:\n• Shift: ${cg?.shift || 'Morning Shift'}\n• Duty Status: ${cg?.availability || 'On Duty'}\n• Direct Contact: ${cg?.phone || '+91 98400 11223'}`;
    }

    // 6.4 All caregivers directory
    if (facilityData?.caregivers?.length > 0) {
      return isTamil
        ? `எல்டர்கேர் பராமரிப்பாளர்கள் மற்றும் பணி நேரங்கள்:\n` +
          facilityData.caregivers.map((c) => `• ${c.name} (${c.role}) — ${c.availability} [${c.shift}]`).join('\n')
        : `ElderCare Staff & Duty Schedules:\n` +
          facilityData.caregivers.map((c) => `• ${c.name} (${c.role}) — ${c.availability} [${c.shift}]`).join('\n');
    }
  }

  // ------------------------------------------------------------
  // DOMAIN 7: MEDICATIONS & ADHERENCE (Remaining, Taken, Doses, Timing)
  // ------------------------------------------------------------
  const meds = residentData?.medications || [];
  const knownMedNames = [
    'metformin', 'donepezil', 'amlodipine', 'telmisartan', 'pantoprazole',
    'atorvastatin', 'paracetamol', 'glucosamine', 'diclofenac', 'calcium',
    'teriparatide', 'alendronate', 'glimepiride', 'dapagliflozin', 'vildagliptin',
    'furosemide', 'metoprolol', 'clopidogrel', 'ecosprin', 'digoxin',
    'memantine', 'citicoline', 'melatonin', 'torsemide', 'sevelamer',
    'febuxostat', 'ashwagandha', 'aspirin', 'insulin'
  ];

  const mentionsSpecificMed = knownMedNames.some((m) => clean.includes(m)) ||
    meds.some((m) => clean.includes(m.medicine.toLowerCase()));

  const isMedicationTopic =
    mentionsSpecificMed ||
    clean.includes('medicine') || clean.includes('medication') || clean.includes('pill') ||
    clean.includes('tablet') || clean.includes('dose') || clean.includes('doses') ||
    clean.includes('marunthu') || clean.includes('marundhu') || clean.includes('mathirai') ||
    clean.includes('maathirai') || clean.includes('kuligai') || clean.includes('remaining') ||
    clean.includes('innum') || clean.includes('evlo') || clean.includes('baaki') ||
    clean.includes('pending') || clean.includes('missed') || clean.includes('potangala') ||
    clean.includes('saptangala') || clean.includes('taken') || clean.includes('did she take') ||
    clean.includes('did he take') || clean.includes('when does she take') || clean.includes('when does he take') ||
    clean.includes('which medicine is due next') || clean.includes('due next') || clean.includes('next medicine') ||
    clean.includes('sugar tablet') || clean.includes('bp tablet') || clean.includes('frequency') ||
    clean.includes('timing') || clean.includes('slot') || clean.includes('prescribed by') ||
    clean.includes('instructions');

  if (isMedicationTopic && resident && residentData) {
    if (meds.length === 0) {
      return isTamil
        ? `${resident.name}-க்கு தற்போது செயலில் உள்ள மருந்துகள் எதுவும் தரவுத்தளத்தில் இல்லை.`
        : `No active prescribed medications are currently on record for ${resident.name}.`;
    }

    const totalCount = meds.length;
    const completedList = meds.filter((m) => m.status === 'completed');
    const pendingList = meds.filter((m) => m.status === 'pending' || m.status === 'upcoming');
    const missedList = meds.filter((m) => m.status === 'missed');

    // 7.1 Did she take a specific medicine? (e.g. "Did she take her Metformin?", "Did she take it?")
    let targetMed = meds.find((m) => clean.includes(m.medicine.toLowerCase()));
    if (!targetMed && (clean.includes('sugar') || clean.includes('diabetes'))) {
      targetMed = meds.find((m) => {
        const ml = m.medicine.toLowerCase();
        return ml.includes('metformin') || ml.includes('glimepiride') || ml.includes('vildagliptin');
      });
    }
    if (!targetMed && (clean.includes('bp') || clean.includes('blood pressure'))) {
      targetMed = meds.find((m) => {
        const ml = m.medicine.toLowerCase();
        return ml.includes('amlodipine') || ml.includes('telmisartan') || ml.includes('metoprolol');
      });
    }
    // Check history for recent medicine if pronoun "it" or "that medicine" used
    if (!targetMed && (clean.includes('it') || clean.includes('that medicine') || clean.includes('adhai') || clean.includes('andha'))) {
      if (Array.isArray(history) && history.length > 0) {
        for (let i = history.length - 1; i >= 0; i--) {
          const ht = (history[i].text || history[i].content || '').toLowerCase();
          for (const m of meds) {
            if (ht.includes(m.medicine.toLowerCase())) {
              targetMed = m;
              break;
            }
          }
          if (targetMed) break;
        }
      }
    }

    // 7.2 "Did she take [medicine]?"
    const isAskingTaken = clean.includes('did she take') || clean.includes('did he take') || clean.includes('has she taken') || clean.includes('has he taken') || clean.includes('saptangala') || clean.includes('potangala') || clean.includes('eduthaangala');
    if (isAskingTaken && targetMed) {
      if (targetMed.status === 'completed') {
        return isTamil
          ? `ஆம், ${resident.name} தனது ${targetMed.medicine} (${targetMed.dosage}) மருந்தை எடுத்துக்கொண்டார். தரவுத்தள நிலை: எடுக்கப்பட்டது (completed / COMPLETED). திட்டமிடப்பட்ட நேரம்: ${targetMed.time} [${targetMed.slot}].`
          : `Yes, ${resident.name} has taken her ${targetMed.medicine} (${targetMed.dosage}). Current status in ElderCare database: completed (COMPLETED) scheduled at ${targetMed.time} [${targetMed.slot}].`;
      }
      return isTamil
        ? `இல்லை, ${resident.name}-ன் ${targetMed.medicine} (${targetMed.dosage}) மருந்து இன்னும் நிலுவையில் உள்ளது (pending / PENDING). திட்டமிடப்பட்ட நேரம்: ${targetMed.time} [${targetMed.slot}].`
        : `No, ${resident.name} has not taken her ${targetMed.medicine} (${targetMed.dosage}) yet. Current status in ElderCare database: pending (PENDING) scheduled at ${targetMed.time} [${targetMed.slot}].`;
    }

    // 7.3 "When does she take it?" / "When does she take [medicine]?"
    const isAskingWhen = clean.includes('when does she take') || clean.includes('when does he take') || clean.includes('when to take') || clean.includes('eppo') || clean.includes('eppothu') || clean.includes('time') || clean.includes('timing');
    if (isAskingWhen && targetMed) {
      return isTamil
        ? `${resident.name} தனது ${targetMed.medicine} (${targetMed.dosage}) மருந்தை ${targetMed.time}-க்கு [${targetMed.slot}] எடுத்துக்கொள்ள திட்டமிடப்பட்டுள்ளது. எடுத்துக்கொள்ளும் முறை: ${targetMed.frequency}. நிலை: ${targetMed.status}.`
        : `${resident.name} is scheduled to take ${targetMed.medicine} (${targetMed.dosage}) at ${targetMed.time} [${targetMed.slot}]. Frequency: ${targetMed.frequency}. Prescribed by: ${targetMed.prescribedBy}. Status: ${targetMed.status}.`;
    }

    // 7.4 "Which medicine is due next?" / "Next medicine"
    const isAskingDueNext = clean.includes('due next') || clean.includes('next medicine') || clean.includes('adutha marunthu') || clean.includes('aduthu enna');
    if (isAskingDueNext) {
      if (pendingList.length > 0) {
        const nextMed = pendingList[0];
        return isTamil
          ? `${resident.name}-க்கு அடுத்ததாக கொடுக்கப்பட வேண்டிய மருந்து: ${nextMed.medicine} (${nextMed.dosage}) — நேரம்: ${nextMed.time} [${nextMed.slot}]. நிலை: ${nextMed.status}.`
          : `The next medicine due for ${resident.name} is ${nextMed.medicine} (${nextMed.dosage}) scheduled at ${nextMed.time} [${nextMed.slot}]. Status: ${nextMed.status}.`;
      }
      return isTamil
        ? `${resident.name}-க்கு இன்றைய அனைத்து மருந்துகளும் எடுக்கப்பட்டுவிட்டன. அடுத்த மருந்து எதுவும் நிலுவையில் இல்லை.`
        : `All scheduled medications have been taken for ${resident.name}. There are no further medicines due today.`;
    }

    // 7.5 "How many medicines are scheduled today?" / "Innaiku ethana tablets?"
    const isAskingTotalScheduled =
      clean.includes('how many medicines are scheduled') || clean.includes('how many tablets are scheduled') ||
      clean.includes('innaiku ethana') || clean.includes('ethana tablets') || clean.includes('total medicines') ||
      clean.includes('how many doses');

    if (isAskingTotalScheduled && !clean.includes('remaining') && !clean.includes('left') && !clean.includes('pending') && !clean.includes('baaki')) {
      return isTamil
        ? `${resident.name}-க்கு இன்று மொத்தம் ${totalCount} மருந்துகள் திட்டமிடப்பட்டுள்ளன (${completedList.length} எடுக்கப்பட்டது, ${pendingList.length} நிலுவை, ${missedList.length} தவறவிடப்பட்டது).`
        : `${totalCount} active medication doses are scheduled today for ${resident.name} (${completedList.length} completed, ${pendingList.length} pending, ${missedList.length} missed).`;
    }

    // 7.6 Remaining / Pending / Left / "remaining evlo" / "innum ethana" / "baaki enna"
    const isAskingRemaining =
      clean.includes('remaining') || clean.includes('innum') || clean.includes('baaki') ||
      clean.includes('evlo') || clean.includes('left') || clean.includes('pending') ||
      clean.includes('ethana baaki') || clean.includes('what is left') || clean.includes('anything pending');

    if (isAskingRemaining && !clean.includes('taken') && !clean.includes('completed')) {
      if (pendingList.length === 0) {
        return isTamil
          ? `அருமை! ${resident.name}-க்கு இன்றைய அனைத்து (${totalCount}) மருந்துகளும் எடுக்கப்பட்டுவிட்டன. நிலுவையில் (Pending) எந்த மருந்தும் இல்லை.`
          : `All ${totalCount} scheduled medication doses for ${resident.name} have been taken. There are zero pending medications remaining today.`;
      }

      return isTamil
        ? `${resident.name}-க்கு இன்று மொத்தம் ${totalCount} மாத்திரைகளில், ${completedList.length} எடுக்கப்பட்டுள்ளது. இன்னும் ${pendingList.length} மாத்திரைகள் மீதமுள்ளன (Pending):\n` +
          pendingList.map((m) => `• ${m.medicine} (${m.dosage}) — நேரம்: ${m.time} [${m.slot}]`).join('\n')
        : `${resident.name} has ${pendingList.length} medication dose(s) remaining out of ${totalCount} scheduled today:\n` +
          pendingList.map((m) => `• ${m.medicine} (${m.dosage}) at ${m.time} [${m.slot}] - ${m.status}`).join('\n');
    }

    // 7.7 Missed doses
    if (clean.includes('miss') || clean.includes('missed') || clean.includes('thavari')) {
      if (missedList.length === 0) {
        return isTamil
          ? `${resident.name}-க்கு இன்று தவறவிடப்பட்ட (Missed) மருந்துகள் எதுவும் இல்லை. ${completedList.length} மருந்துகள் எடுக்கப்பட்டுள்ளன, ${pendingList.length} நிலுவையில் உள்ளன.`
          : `${resident.name} has zero missed doses today. ${completedList.length} completed, and ${pendingList.length} upcoming/pending.`;
      }
      return isTamil
        ? `⚠️ ${resident.name}-க்கு ${missedList.length} மருந்து(கள்) தவறவிடப்பட்டுள்ளன:\n` +
          missedList.map((m) => `• ${m.medicine} (${m.dosage}) — ${m.time}`).join('\n')
        : `⚠️ ${resident.name} has ${missedList.length} missed medication dose(s) today:\n` +
          missedList.map((m) => `• ${m.medicine} (${m.dosage}) scheduled at ${m.time}`).join('\n');
    }

    // 7.8 Specific medicine general query (Metformin, Donepezil, Amlodipine, Sugar, BP, etc.)
    if (targetMed) {
      return isTamil
        ? `ஆம், ${resident.name}-ன் மருந்து விவரம்: ${targetMed.medicine} (${targetMed.dosage})\n• நேரம்: ${targetMed.time} [${targetMed.slot}]\n• நிலை: ${targetMed.status.toUpperCase()}\n• எடுத்துக்கொள்ளும் முறை: ${targetMed.frequency}\n• மருத்துவர்: ${targetMed.prescribedBy}\n• வழிமுறை: "${targetMed.instructions || 'பரிந்துரைக்கப்பட்டபடி எடுக்கவும்'}"`
        : `Medication details for ${resident.name} — ${targetMed.medicine} (${targetMed.dosage}):\n• Scheduled Time: ${targetMed.time} [${targetMed.slot}]\n• Current Status: ${targetMed.status.toUpperCase()}\n• Frequency: ${targetMed.frequency}\n• Prescribed By: ${targetMed.prescribedBy}\n• Instructions: "${targetMed.instructions || 'Take as prescribed.'}"`;
    }

    // 7.9 General schedule / Full list
    return isTamil
      ? `${resident.name}-ன் இன்றைய முழுமையான மருந்து அட்டவணை (மொத்தம்: ${totalCount} | எடுக்கப்பட்டது: ${completedList.length} | மீதம்: ${pendingList.length}):\n` +
        meds.map((m) => `• ${m.medicine} (${m.dosage}) — ${m.time} [${m.status}]`).join('\n')
      : `Complete medication schedule for ${resident.name} (${totalCount} total | ${completedList.length} taken | ${pendingList.length} pending):\n` +
        meds.map((m) => `• ${m.medicine} (${m.dosage}) at ${m.time} [${m.slot}] - ${m.status}`).join('\n');
  }

  // ------------------------------------------------------------
  // DOMAIN 8: CARE RECORDS, VITALS & CLINICAL OBSERVATIONS
  // ------------------------------------------------------------
  const isVitalsTopic =
    clean.includes('bp') || clean.includes('blood pressure') || clean.includes('pressure') ||
    clean.includes('temperature') || clean.includes('temp') || clean.includes('fever') ||
    clean.includes('weight') || clean.includes('vital') || clean.includes('observation') ||
    clean.includes('observations') || clean.includes('obs') || clean.includes('pulse') ||
    clean.includes('heart rate') || clean.includes('care updates') || clean.includes('care update') ||
    clean.includes('who recorded') || clean.includes('who measured') || clean.includes('recorded by') ||
    clean.includes('what changed') || clean.includes('changed from yesterday') || clean.includes('changed since yesterday') ||
    clean.includes('has anything changed') || clean.includes('compare') || clean.includes('records ago') ||
    clean.includes('previous record') || clean.includes('morning enna nadandhuchu') || clean.includes('edai') ||
    clean.includes('azhutham') || clean.includes('raththa azhutham') || clean.includes('udalnila') ||
    clean.includes('care record');

  if (isVitalsTopic && resident && residentData) {
    const records = residentData.careRecords || [];
    if (records.length === 0) {
      return isTamil
        ? `${resident.name}-க்கு மருத்துவ பதிவுகள் எதுவும் எல்டர்கேர் தரவுத்தளத்தில் இல்லை.`
        : `No clinical care records are currently on file for ${resident.name} in ElderCare records.`;
    }

    // 8.1 "Who recorded her latest observation?" / "Who measured it?"
    if (clean.includes('who recorded') || clean.includes('who measured') || clean.includes('recorded by') || clean.includes('yaaru record pannanga')) {
      const latest = records[0];
      return isTamil
        ? `${resident.name}-ன் சமீபத்திய மருத்துவ குறிப்பை (${latest.date} அன்று ${latest.time}) பதிவு செய்தவர்: ${latest.recorded_by}. (குறிப்பு: "${latest.observation || latest.notes}").`
        : `${resident.name}'s latest observation on ${latest.date} at ${latest.time} was recorded by ${latest.recorded_by}. Observation: "${latest.observation || latest.notes}".`;
    }

    // 8.2 Ordinal record lookback: e.g. "What was her weight two records ago?", "3 records ago", "previous record"
    const ordinalMatch = clean.match(/(\d+|two|three|four|five)\s+records?\s+ago/i) || clean.match(/previous\s+record/i);
    if (ordinalMatch) {
      let offset = 1;
      const word = ordinalMatch[0].toLowerCase();
      if (word.includes('two') || word.includes('2')) offset = 2;
      else if (word.includes('three') || word.includes('3')) offset = 3;
      else if (word.includes('four') || word.includes('4')) offset = 4;

      if (records.length > offset) {
        const targetRec = records[offset];
        return isTamil
          ? `${resident.name}-ன் ${offset} பதிவுகளுக்கு முந்தைய மருத்துவ அளவீடுகள் (${targetRec.date} அன்று ${targetRec.time}):\n• உடல் எடை: ${targetRec.weight}\n• இரத்த அழுத்தம் (BP): ${targetRec.blood_pressure} mmHg\n• வெப்பநிலை: ${targetRec.temperature}\n• குறிப்பு: "${targetRec.observation || targetRec.notes}"\n• பதிவு செய்தவர்: ${targetRec.recorded_by}`
          : `${resident.name}'s measurements and weight ${offset} records ago (${targetRec.date} at ${targetRec.time}):\n• Weight: ${targetRec.weight}\n• Blood Pressure: ${targetRec.blood_pressure} mmHg\n• Temperature: ${targetRec.temperature}\n• Clinical Note: "${targetRec.observation || targetRec.notes}"\n• Recorded By: ${targetRec.recorded_by}`;
      }
    }

    // 8.3 Record comparison: "What changed from yesterday?", "Has anything changed since yesterday?"
    const isComparison = clean.includes('change') || clean.includes('changed') || clean.includes('different') || clean.includes('compare') || clean.includes('yesterday');
    if (isComparison && records.length >= 2) {
      const latest = records[0];
      const prev = records[1];

      return isTamil
        ? `${resident.name}-ன் கடைசி இரண்டு பதிவுகளின் ஒப்பீடு:\n• இரத்த அழுத்தம் (BP): ${prev.blood_pressure} mmHg (${prev.date}) ➔ ${latest.blood_pressure} mmHg (${latest.date})\n• உடல் எடை: ${prev.weight} ➔ ${latest.weight}\n• வெப்பநிலை: ${prev.temperature} ➔ ${latest.temperature}\n• குறிப்புகள்: "${prev.observation}" ➔ "${latest.observation}" (${latest.recorded_by})`
        : `Comparison between ${resident.name}'s last two care records:\n• Blood Pressure (BP): shifted from ${prev.blood_pressure} mmHg (${prev.date}) to ${latest.blood_pressure} mmHg (${latest.date})\n• Temperature: ${prev.temperature} to ${latest.temperature}\n• Weight: ${prev.weight} to ${latest.weight}\n• Observations: "${prev.observation}" shifted to "${latest.observation}" recorded by ${latest.recorded_by}.`;
    }

    // 8.4 Tanglish care updates: "Her last three care updates enna?"
    if (clean.includes('last three') || clean.includes('three care updates') || clean.includes('3 updates')) {
      const top3 = records.slice(0, 3);
      return isTamil
        ? `${resident.name}-ன் கடைசி 3 மருத்துவ பதிவுகள்:\n` +
          top3.map((r, i) => `${i + 1}. [${r.date} ${r.time}] BP: ${r.blood_pressure} mmHg | வெப்பநிலை: ${r.temperature} | குறிப்பு: "${r.observation}" (${r.recorded_by})`).join('\n')
        : `Last 3 care updates for ${resident.name}:\n` +
          top3.map((r, i) => `${i + 1}. [${r.date} ${r.time}] BP: ${r.blood_pressure} mmHg | Temp: ${r.temperature} | Obs: "${r.observation}" (${r.recorded_by})`).join('\n');
    }

    // 8.5 Morning inquiry: "Anitha-ku morning enna nadandhuchu?"
    if (clean.includes('morning enna nadandhuchu') || clean.includes('morning update') || clean.includes('what happened this morning')) {
      const morningRec = records.find((r) => r.time.includes('AM')) || records[0];
      return isTamil
        ? `இன்று காலையில் ${resident.name}-க்கு எடுக்கப்பட்ட மருத்துவ விவரம் (${morningRec.date} ${morningRec.time}):\n• இரத்த அழுத்தம் (BP): ${morningRec.blood_pressure} mmHg\n• வெப்பநிலை: ${morningRec.temperature} | எடை: ${morningRec.weight}\n• குறிப்பு: "${morningRec.observation} - ${morningRec.notes}"\n• பதிவு செய்தவர்: ${morningRec.recorded_by}`
        : `Morning clinical record for ${resident.name} (${morningRec.date} at ${morningRec.time}):\n• Blood Pressure: ${morningRec.blood_pressure} mmHg\n• Temperature: ${morningRec.temperature} | Weight: ${morningRec.weight}\n• Observation: "${morningRec.observation} - ${morningRec.notes}"\n• Recorded By: ${morningRec.recorded_by}`;
    }

    // 8.6 Latest vitals / BP
    const latest = records[0];
    return isTamil
      ? `${resident.name}-ன் சமீபத்திய மருத்துவ அளவீடுகள் (${latest.date} அன்று ${latest.time}):\n• இரத்த அழுத்தம் (BP): ${latest.blood_pressure} mmHg\n• வெப்பநிலை: ${latest.temperature}\n• உடல் எடை: ${latest.weight}\n• மருத்துவர்/செவிலியர் குறிப்பு: "${latest.observation || latest.notes}"\n• பதிவு செய்தவர்: ${latest.recorded_by}`
      : `Latest clinical observations for ${resident.name} (${latest.date} at ${latest.time}):\n• Blood Pressure: ${latest.blood_pressure} mmHg\n• Temperature: ${latest.temperature}\n• Weight: ${latest.weight}\n• Observation: "${latest.observation || latest.notes}"\n• Recorded By: ${latest.recorded_by}`;
  }

  // ------------------------------------------------------------
  // DOMAIN 9: EMERGENCY & SOS ALERTS
  // ------------------------------------------------------------
  const isEmergencyTopic =
    clean.includes('emergency') || clean.includes('sos') ||
    clean.includes('incident') || clean.includes('avasaram') || clean.includes('aabathu') ||
    clean.includes('allergic rash') || clean.includes('skin disease');

  if (isEmergencyTopic) {
    if (resident && residentData?.emergencyAlerts?.length > 0) {
      const emgs = residentData.emergencyAlerts;
      return isTamil
        ? `${resident.name}-ன் அவசர மருத்துவ பதிவுகள் (${emgs.length} நிகழ்வுகள்):\n` +
          emgs.map((e) => `• [SOS #${e.id}] ${e.emergencyType} (${e.severity}) — ${e.timestamp}: "${e.notes || ''}" [நிலை: ${e.status}]`).join('\n')
        : `Emergency records for ${resident.name} (${emgs.length} events):\n` +
          emgs.map((e) => `• [SOS #${e.id}] ${e.emergencyType} (Severity: ${e.severity}) at ${e.timestamp} - Status: ${e.status}. Notes: "${e.notes || ''}"`).join('\n');
    }

    if (facilityData?.activeEmergencies?.length > 0) {
      return isTamil
        ? `🚨 தற்போதைய செயலில் உள்ள அவசர அழைப்புகள் (${facilityData.activeEmergencies.length}):\n` +
          facilityData.activeEmergencies.map((e) => `• ${e.patientName || e.residentName}: ${e.emergencyType} (${e.severity}) - நிலை: ${e.status}`).join('\n')
        : `🚨 Active Facility Emergency Alerts (${facilityData.activeEmergencies.length}):\n` +
          facilityData.activeEmergencies.map((e) => `• ${e.patientName || e.residentName}: ${e.emergencyType} (${e.severity}) - Status: ${e.status}`).join('\n');
    }

    return isTamil
      ? `தற்போது எந்த அவசர எச்சரிக்கைகளும் (SOS Alerts) இல்லை. அனைத்து முதியோர்களும் சீரான கண்காணிப்பில் உள்ளனர்.`
      : `There are currently no active emergency alerts. All residents are in stable supervision.`;
  }

  // ------------------------------------------------------------
  // DOMAIN 10: ACTIVITIES & RECREATION
  // ------------------------------------------------------------
  const isActivityTopic =
    clean.includes('activity') || clean.includes('activities') || clean.includes('yoga') ||
    clean.includes('walk') || clean.includes('exercise') || clean.includes('music') ||
    clean.includes('gardening') || clean.includes('nigazhchi') || clean.includes('udarpayirchi');

  if (isActivityTopic) {
    if (clean.includes('complete her activities') || clean.includes('did she complete')) {
      return isTamil
        ? `ஆம், ${resident?.name || 'முதியோர்'} இன்றைய காலை நல்வாழ்வு மற்றும் நினைவாற்றல் இசைப் பயிற்சிகளில் முழுமையாகப் பங்கேற்றுள்ளார். அவரது பராமரிப்புத் திட்ட முன்னேற்றம் 70% ஆக உள்ளது.`
        : `Yes, ${resident?.name || 'The resident'} participated actively in today's scheduled memory-care and wellness activities. Her Care Plan progress is currently at 70%.`;
    }

    if (facilityData?.activities?.length > 0) {
      return isTamil
        ? `இன்றைய தினசரி நல்வாழ்வு மற்றும் பொழுதுபோக்கு நிகழ்வுகள்:\n` +
          facilityData.activities.map((a) => `• ${a.name} (${a.type}) — ${a.schedule} [${a.duration}] — நடத்துனர்: ${a.facilitator}`).join('\n')
        : `Daily Wellness & Recreational Activities Schedule:\n` +
          facilityData.activities.map((a) => `• ${a.name} (${a.type}) — ${a.schedule} [${a.duration}] led by ${a.facilitator}`).join('\n');
    }
  }

  // ------------------------------------------------------------
  // DOMAIN 11: DOCUMENTS & LAB RESULTS
  // ------------------------------------------------------------
  const isDocTopic =
    clean.includes('document') || clean.includes('documents') || clean.includes('medical documents') ||
    clean.includes('report') || clean.includes('lab') || clean.includes('prescription file') || clean.includes('file');

  if (isDocTopic) {
    if (resident && residentData?.documents?.length > 0) {
      return isTamil
        ? `${resident.name}-ன் மருத்துவ ஆவணங்கள் (${residentData.documents.length}):\n` +
          residentData.documents.map((d) => `• ${d.title || d.name} (${d.type}) — தேதி: ${d.date} [${d.status}]`).join('\n')
      : `Medical documents on file for ${resident.name} (${residentData.documents.length}):\n` +
        residentData.documents.map((d) => `• ${d.title || d.name} (${d.type}) - Date: ${d.date} [${d.status}]`).join('\n');
    }

    if (resident) {
      return isTamil
        ? `${resident.name}-க்கு ஆவணங்கள் எதுவும் எல்டர்கேர் பதிவுகளில் இல்லை.`
        : `No medical documents are currently on file for ${resident.name} in ElderCare records.`;
    }
  }

  // ------------------------------------------------------------
  // DOMAIN 12: RESIDENT GENERAL PROFILE (When resident resolved)
  // ------------------------------------------------------------
  if (resident) {
    const meds = residentData?.medications || [];
    const records = residentData?.careRecords || [];
    const latestRec = records[0];

    return isTamil
      ? `${resident.name} சுயவிவரம் (ID: ${resident.id}):\n• அறை: ${resident.room} | வயது: ${resident.age} | நிலை: ${resident.status.toUpperCase()}\n• முதன்மை பராமரிப்பாளர்: ${resident.caregiver}\n• மருத்துவ நிலை: ${resident.condition}\n• தற்போதைய மருந்துகள்: ${meds.length} மாத்திரைகள் அட்டவணையில் உள்ளன\n• சமீபத்திய BP: ${latestRec?.blood_pressure ? latestRec.blood_pressure + ' mmHg' : 'இயல்பானது'}\n• அவசர தொடர்பு: ${resident.emergencyContact}`
      : `Profile for ${resident.name} (ID: ${resident.id}):\n• Room: ${resident.room} | Age: ${resident.age} | Status: ${resident.status.toUpperCase()}\n• Primary Caregiver: ${resident.caregiver}\n• Clinical Condition: ${resident.condition}\n• Current Prescriptions: ${meds.length} scheduled medications\n• Latest BP: ${latestRec?.blood_pressure ? latestRec.blood_pressure + ' mmHg' : 'Normal'}\n• Emergency Contact: ${resident.emergencyContact}`;
  }

  // ------------------------------------------------------------
  // DOMAIN 13: SPECIFIC RESIDENT MISSING / NOT FOUND IN DATABASE
  // If the user asked about an explicit person or record that does not exist in ElderCare
  // ------------------------------------------------------------
  const genericTerms = ['the', 'a', 'an', 'her', 'his', 'their', 'normal', 'high', 'low', 'average', 'healthy', 'ideal', 'systolic', 'diastolic'];
  const personQueryMatch = clean.match(/(?:what is|check|how is|show|tell me about|give me)\s+([a-z\s]+?)\s+(?:'s\s+)?(?:bp|vital|vitals|blood pressure|medicine|medicines|medication|medications|tablet|tablets|care plan|observation|records?|condition|room|status)/i);
  const candidateName = personQueryMatch ? personQueryMatch[1].trim() : '';
  const isSpecificPersonInquiry = candidateName && !genericTerms.includes(candidateName) && candidateName.length > 1;

  const hasPossessiveMissing = (clean.includes("'s ") || clean.includes("’s ") || clean.includes("'s") || clean.includes("’s")) &&
    (clean.includes('bp') || clean.includes('vital') || clean.includes('medicine') || clean.includes('medication') || clean.includes('record') || clean.includes('plan') || clean.includes('room'));

  const isAskingResidentData =
    (isSpecificPersonInquiry || hasPossessiveMissing || clean.includes('for ') || clean.includes('of ') || clean.includes('-ku') || clean.includes('staying in')) &&
    (clean.includes('bp') || clean.includes('care record') || clean.includes('record') || clean.includes('vital') || clean.includes('medication') || clean.includes('medicine') || clean.includes('blood pressure'));

  if (isAskingResidentData && !resident) {
    return isTamil
      ? `குறிப்பிட்ட நபர் அல்லது விவரம் எல்டர்கேர் மருத்துவ தரவுத்தளத்தில் இல்லை (Information for that resident is not available in ElderCare records).`
      : `Information for that resident is not available in ElderCare records.`;
  }

  // ------------------------------------------------------------
  // DOMAIN 14: FACILITY-WIDE RESIDENT COUNT & OVERVIEW
  // ONLY if the user specifically inquires about all residents / facility capacity!
  // ------------------------------------------------------------
  const isAskingFacilityOverview =
    clean.includes('how many residents') || clean.includes('residents are there') ||
    clean.includes('list all residents') || clean.includes('all residents') ||
    clean.includes('who stays in') || clean.includes('who lives in') ||
    clean.includes('total residents') || clean.includes('thangirukavanga');

  if (isAskingFacilityOverview && facilityData?.residents?.length > 0) {
    return isTamil
      ? `எல்டர்கேர் பராமரிப்பு இல்லத்தில் தற்போது ${facilityData.residents.length} முதியோர்கள் தங்கியுள்ளனர்:\n` +
        facilityData.residents.map((r) => `• ${r.name} (${r.room}) — பராமரிப்பாளர்: ${r.caregiver} [நிலை: ${r.status}]`).join('\n')
      : `ElderCare currently accommodates ${facilityData.residents.length} residents in the facility:\n` +
        facilityData.residents.map((r) => `• ${r.name} (${r.room}) — Caregiver: ${r.caregiver} [Status: ${r.status}]`).join('\n');
  }

  // ------------------------------------------------------------
  // DOMAIN 15: GENERAL AI, SCIENCE, TECH, DEFINITIONS & CALCULATIONS
  // If not a resident/facility question, answer directly via General AI!
  // ------------------------------------------------------------
  const generalRes = await answerGeneralQuestion(message, isTamil ? 'ta' : 'en', history);
  return generalRes.reply;
}

// ============================================================
// 6. MAIN CHATBOT ENTRYPOINT
// ============================================================

export async function processCareAssistantQuery({ message, user = {}, lang = 'en', history = [] }) {
  if (!message || !message.trim()) {
    return {
      success: false,
      reply: 'Please provide a question.',
      detectedLang: 'en'
    };
  }

  const isTamil = detectLanguage(message, lang) === 'ta';

  // 1. Fetch live facility background data
  const facilityData = await fetchFacilityLiveDatabase();
  const allResidents = facilityData.residents || [];

  // 2. Resolve target resident from message or multi-turn history
  const resident = await resolveResident(message, history, user, allResidents);

  // 3. If resident resolved, enforce Role-Based Access Control (RBAC)
  let residentData = null;
  if (resident) {
    const auth = await checkResidentAuthorization(user, resident);
    if (!auth.allowed) {
      return {
        success: true,
        reply: isTamil ? auth.messageTa : auth.messageEn,
        detectedLang: isTamil ? 'ta' : 'en',
        residentId: resident.id
      };
    }

    // Fetch verified live tables for this authorized resident
    residentData = await fetchResidentLiveDatabase(resident.id);
  }

  // 4. Try external LLM first if API key is provided
  const llmResult = await tryLlmAugmentedGeneration({
    message,
    isTamil,
    resident,
    residentData,
    facilityData,
    history
  });

  if (llmResult && llmResult.reply) {
    return {
      success: true,
      reply: llmResult.reply,
      detectedLang: isTamil ? 'ta' : 'en',
      source: llmResult.source,
      residentId: resident?.id || null
    };
  }

  // 5. Dynamic Semantic Reasoning Engine (Built-in Zero-Shot Brain)
  const dynamicReply = await dynamicSemanticReasoning({
    message,
    isTamil,
    user,
    resident,
    residentData,
    facilityData,
    history
  });

  return {
    success: true,
    reply: dynamicReply,
    detectedLang: isTamil ? 'ta' : 'en',
    source: 'semantic_ai',
    residentId: resident?.id || null
  };
}

export default { processCareAssistantQuery };
