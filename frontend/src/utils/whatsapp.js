// ============================================================
// ElderCare — WhatsApp Communication Utility
// Facilitates 1-click WhatsApp messaging for Emergency SOS,
// Caregiver updates, Doctor consultations, and Family check-ins.
// ============================================================

/**
 * Standardizes phone numbers to international digits-only format.
 * Defaults to country code +91 (India) if standard 10-digit number is provided.
 */
export function cleanPhoneNumber(rawPhone = '') {
  if (!rawPhone) return '';
  // Extract only numbers and optional leading plus
  let cleaned = String(rawPhone).replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // If standard 10-digit Indian phone without country code
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  return cleaned;
}

/**
 * Creates a valid wa.me link with encoded text message.
 */
export function buildWhatsAppUrl(phone, text) {
  const cleaned = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  if (!cleaned) {
    // If no phone is provided, opens WhatsApp with pre-filled message ready to pick contact
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleaned}?text=${encodedText}`;
}

/**
 * Opens WhatsApp in a new browser tab safely.
 */
export function openWhatsApp(phone, text) {
  const url = buildWhatsAppUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Formats a high-priority Emergency SOS distress alert for WhatsApp.
 */
export function formatEmergencyWhatsAppMessage(alert = {}) {
  const residentName = alert.residentName || alert.patient || 'Resident';
  const room = alert.room || 'Resident Room';
  const emergencyType = alert.emergencyType || 'Urgent Health Distress';
  const condition = alert.condition || 'Under Supervision';
  const bloodGroup = alert.bloodGroup || 'Not Specified';
  const caregiver = alert.caregiver || 'On-Duty Caregiver';
  const notes = alert.notes || 'Emergency assistance requested immediately.';
  const timestamp = alert.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const specialty = alert.specialty || '';
  const alertId = alert.id || 'SOS-LIVE';

  return `🚨 *ELDERCARE EMERGENCY SOS DISPATCH* 🚨
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *URGENT MEDICAL ASSISTANCE REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━
🆔 *Alert ID:* ${alertId}
👤 *Resident:* ${residentName}
🏠 *Room:* ${room}
🚨 *Incident:* ${emergencyType}
🩸 *Blood Group:* ${bloodGroup}
🩺 *Medical Condition:* ${condition}
👩‍⚕️ *Assigned Caregiver:* ${caregiver}
${specialty ? `👨‍⚕️ *Specialist Referred:* ${specialty}\n` : ''}📝 *Incident Notes:* "${notes}"
⏰ *Broadcast Time:* ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Action:* Please acknowledge this message immediately or contact ElderCare Front Desk!`;
}

/**
 * Formats a Caregiver shift & resident care message.
 */
export function formatCaregiverWhatsAppMessage({ caregiverName, residentName, message }) {
  return `👋 *Hello ${caregiverName || 'Caregiver'},*

This is an inquiry from ElderCare regarding *${residentName || 'the assigned resident'}*.

📋 *Message:*
${message || 'Could you please share a quick update on the resident vitals and medication schedule?'}

_Sent via ElderCare Management System_`;
}

/**
 * Formats a Doctor appointment & clinical referral message.
 */
export function formatDoctorWhatsAppMessage({ doctorName, residentName, specialty, appointmentTime, notes }) {
  return `🩺 *ElderCare Medical Referral Update*

*Dear ${doctorName || 'Doctor'},*
Reference Consultation for Resident: *${residentName || 'Resident'}*
${specialty ? `• Specialty: ${specialty}\n` : ''}${appointmentTime ? `• Scheduled Slot: ${appointmentTime}\n` : ''}${notes ? `• Clinical Notes: ${notes}\n` : ''}
Please review the resident care records in the ElderCare Portal. Thank you!`;
}

/**
 * Formats a friendly family check-in message.
 */
export function formatFamilyCheckinWhatsAppMessage({ familyName, residentName, status, notes }) {
  return `🌸 *ElderCare Resident Wellness Update*

Dear ${familyName || 'Family Member'},
Here is today's wellness update for *${residentName || 'your loved one'}*:

• *Current Status:* ${status || 'Stable & Comfortable'}
• *Daily Notes:* ${notes || 'Participated in morning mobility activities and took scheduled meals on time.'}

If you have any questions, feel free to reply or visit the ElderCare portal anytime! 💙`;
}
