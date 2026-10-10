import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import MedicationReminder from './MedicationReminder.jsx';
import ChatbotFab from './ChatbotFab.jsx';
import { useApp } from '../context/AppContext.jsx';
import { medications } from '../data/dummyData';
import { scopeByResident } from '../utils/scope.js';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, pushMedicationReminder, scheduledReminders, cancelScheduledReminder } = useApp();
  const firedRef = useRef(new Set());
  const scheduledFiredRef = useRef(new Set());

  // Watch advance scheduled reminders (e.g. 1h before, 2h before, or 10s demo)
  useEffect(() => {
    if (!scheduledReminders || scheduledReminders.length === 0) return;

    const checkAdvanceSchedules = () => {
      const nowMs = Date.now();
      scheduledReminders.forEach((s) => {
        if (s.triggerTimestamp && nowMs >= s.triggerTimestamp && !scheduledFiredRef.current.has(s.id)) {
          scheduledFiredRef.current.add(s.id);
          // Push reminder targeted to the patient
          pushMedicationReminder(
            {
              id: s.medId || s.id,
              time: s.scheduledDoseTime || 'Scheduled Time',
              patient: s.patient,
              patientId: s.patientId,
              caregiver: s.caregiver,
              medicine: s.medicine,
              dosage: s.dosage,
              desc: `${s.patient}, this is your advance reminder for ${s.medicine} ${s.dosage || ''} (${s.leadOption || 'Scheduled Dose'}).`,
            },
            {
              senderRole: 'patient',
              senderName: s.patient || 'Advance Reminder System',
              patientId: s.patientId,
              patient: s.patient,
              caregiver: s.caregiver,
            }
          );
          // Remove from scheduled queue
          cancelScheduledReminder(s.id);
        }
      });
    };

    const interval = setInterval(checkAdvanceSchedules, 1000);
    return () => clearInterval(interval);
  }, [scheduledReminders, pushMedicationReminder, cancelScheduledReminder]);

  // Watches the current time and automatically fires a medication
  // reminder once the clock reaches (or passes) a scheduled dose time,
  // scoped to residents the logged-in user is actually allowed to see.
  useEffect(() => {
    const scopedMeds = scopeByResident(user, medications, 'patientId');
    const checkSchedule = () => {
      const now = new Date();
      const nowLabel = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const cleanNow = nowLabel.replace(/[\u202f\u00a0]/g, ' ').trim().toUpperCase();
      scopedMeds.forEach((med) => {
        const cleanMed = (med.time || '').replace(/[\u202f\u00a0]/g, ' ').trim().toUpperCase();
        if (cleanMed === cleanNow && !firedRef.current.has(med.id + cleanNow)) {
          firedRef.current.add(med.id + cleanNow);
          pushMedicationReminder(med, {
            senderRole: 'admin',
            patientId: med.patientId,
            patient: med.patient,
            caregiver: med.caregiver,
          });
        }
      });
    };
    const interval = setInterval(checkSchedule, 5000);
    return () => clearInterval(interval);
  }, [pushMedicationReminder, user]);

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`overlay-scrim ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className="app-body">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <MedicationReminder />
      <ChatbotFab />
    </div>
  );
}
