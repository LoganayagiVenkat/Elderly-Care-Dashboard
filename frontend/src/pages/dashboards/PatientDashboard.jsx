import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  CalendarClock,
  Sparkles,
  Phone,
  Bell,
  Clock3,
  Sunrise,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { medications as allMedications, appointments as allAppointments, dailySchedule } from '../../data/dummyData';
import { getPrimaryResident, scopeByResident } from '../../utils/scope.js';
import { toISODate, calculateTriggerTime } from '../../utils/dateUtils.js';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const {
    user,
    pushMedicationReminder,
    scheduledReminders = [],
    scheduleAdvanceReminder,
    cancelScheduledReminder,
  } = useApp();
  const resident = getPrimaryResident(user);
  const [now, setNow] = useState(new Date());

  // Modal state for setting advance reminder
  const [selectedMed, setSelectedMed] = useState(null);
  const [leadOption, setLeadOption] = useState(60); // default 1 hour before
  const [reminderToast, setReminderToast] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayISO = toISODate(now);
  const medications = scopeByResident(user, allMedications, 'patientId');
  const nextMed = medications.find((m) => m.status === 'pending' || m.status === 'upcoming') || medications[0];
  const appointments = scopeByResident(user, allAppointments, 'patientId')
    .filter((a) => a.date >= todayISO)
    .slice(0, 2);

  const handleTestReminder = () => {
    if (!nextMed) return;
    pushMedicationReminder(nextMed, {
      senderRole: 'patient',
      senderName: user?.name,
      patientId: resident?.id || user.residentId,
      patient: user?.name,
      caregiver: resident?.caregiver,
    });
    setReminderToast(`🔔 Reminder dispatched for ${nextMed.medicine}!`);
    setTimeout(() => setReminderToast(null), 3500);
  };

  const handleOpenScheduleModal = (med) => {
    setSelectedMed(med);
    setLeadOption(60); // Default 1 hr before
  };

  const handleSaveSchedule = () => {
    if (!selectedMed) return;
    const { triggerTimestamp, triggerTimeFormatted } = calculateTriggerTime(selectedMed.time, leadOption);

    const leadLabels = {
      0: 'At dose time',
      30: '30 mins before',
      60: '1 hour before',
      120: '2 hours before',
      [-1]: '10-sec demo alarm',
    };

    scheduleAdvanceReminder({
      medId: selectedMed.id,
      patientId: resident?.id || user.residentId,
      patient: user?.name,
      caregiver: resident?.caregiver,
      medicine: selectedMed.medicine,
      dosage: selectedMed.dosage,
      scheduledDoseTime: selectedMed.time,
      triggerTimestamp,
      triggerTimeFormatted,
      leadOption: leadLabels[leadOption] || `${leadOption} mins before`,
    });

    setReminderToast(`⏰ Advance reminder set for ${selectedMed.medicine} (${leadLabels[leadOption]} at ${triggerTimeFormatted})`);
    setSelectedMed(null);
    setTimeout(() => setReminderToast(null), 4000);
  };

  const handleCancelSchedule = (medId, medName) => {
    cancelScheduledReminder(medId);
    setReminderToast(`✓ Reminder cancelled for ${medName}`);
    setTimeout(() => setReminderToast(null), 3000);
  };

  return (
    <div className="patient-view">
      {/* Toast feedback */}
      {reminderToast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 28,
            zIndex: 9999,
            background: 'var(--color-navy, #1E293B)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#34D399' }} />
          <span>{reminderToast}</span>
        </div>
      )}

      <div className="welcome-banner">
        <div>
          <div className="w-date" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sunrise size={13} style={{ verticalAlign: 'text-bottom' }} />
            <span>
              {now.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span>·</span>
            <span>My Dashboard</span>
          </div>
          <h1 style={{ fontSize: 28 }}>Hello, {user.name.split(' ')[0]}</h1>
          <p style={{ fontSize: 15 }}>
            Here is your personalized care schedule. You can set advance reminders for all your daily tablets.
          </p>
        </div>

        <button className="btn btn-terracotta" onClick={handleTestReminder} disabled={!nextMed}>
          <Bell size={16} /> Test Alarm Now
        </button>
      </div>

      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <button className="stat-card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate('/medications')}>
          <div className="stat-icon"><Pill size={20} /></div>
          <div className="stat-value" style={{ fontSize: 26 }}>{medications.length}</div>
          <div className="stat-label" style={{ fontSize: 13.5 }}>My Medications Today</div>
        </button>
        <button className="stat-card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate('/appointments')}>
          <div className="stat-icon"><CalendarClock size={20} /></div>
          <div className="stat-value" style={{ fontSize: 26 }}>{appointments.length}</div>
          <div className="stat-label" style={{ fontSize: 13.5 }}>Upcoming Appointments</div>
        </button>
        <button className="stat-card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate('/activities')}>
          <div className="stat-icon"><Sparkles size={20} /></div>
          <div className="stat-value" style={{ fontSize: 26 }}>Today</div>
          <div className="stat-label" style={{ fontSize: 13.5 }}>My Activities</div>
        </button>
      </div>

      <div className="dash-grid">
        <div className="stack-gap">
          {/* Medications Card with Advance Reminder Control */}
          <div className="panel">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18 }}>
                <Pill size={17} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
                My Medications & Dose Reminders
              </h3>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Set reminders 1h or 2h in advance
              </span>
            </div>

            <div className="panel-body">
              {medications.map((m) => {
                const activeSchedule = scheduledReminders.find((s) => s.medId === m.id);

                return (
                  <div
                    className="mini-status-row"
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: '14px 16px',
                      background: activeSchedule ? '#F0FDF4' : 'var(--surface-sunken, #F8FAFC)',
                      border: activeSchedule ? '1px solid #BBF7D0' : '1px solid var(--border-color, #E2E8F0)',
                      borderRadius: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="m-name" style={{ fontSize: 15, fontWeight: 600 }}>
                          {m.medicine} — {m.dosage}
                        </div>
                        <div className="m-sub" style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Clock size={13} /> Scheduled Dose Time: <strong>{m.time}</strong>
                        </div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>

                    {/* Reminder Status & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E2E8F0', paddingTop: 8, marginTop: 4 }}>
                      {activeSchedule ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#166534', fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
                          <span>
                            Reminder active: <strong>{activeSchedule.leadOption}</strong> (Trigger: {activeSchedule.triggerTimeFormatted})
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                          No advance alarm set for this dose
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6 }}>
                        {activeSchedule ? (
                          <button
                            className="btn btn-sm"
                            style={{
                              padding: '4px 10px',
                              fontSize: 12,
                              color: '#DC2626',
                              background: '#FEE2E2',
                              border: '1px solid #FECACA',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleCancelSchedule(m.id, m.medicine)}
                          >
                            Cancel Alarm
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm"
                            style={{
                              padding: '5px 12px',
                              fontSize: 12.5,
                              color: 'var(--color-terracotta)',
                              background: '#FFF7ED',
                              border: '1px solid #FFEDD5',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                            onClick={() => handleOpenScheduleModal(m)}
                          >
                            <Bell size={13} /> ⏰ Set Advance Reminder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {medications.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No medications scheduled today.</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 style={{ fontSize: 18 }}>
                <Clock3 size={17} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
                My Care Schedule
              </h3>
            </div>
            <div className="panel-body">
              <div className="timeline">
                {dailySchedule.slice(0, 4).map((item) => (
                  <div className="timeline-item" key={item.title}>
                    <div className="timeline-dot" />
                    <div className="timeline-time" style={{ fontSize: 14 }}>{item.time}</div>
                    <div className="timeline-title" style={{ fontSize: 15 }}>{item.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="stack-gap">
          <div className="panel">
            <div className="panel-header">
              <h3 style={{ fontSize: 18 }}>
                <CalendarClock size={17} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
                My Appointments
              </h3>
            </div>
            <div className="panel-body">
              {appointments.map((a) => (
                <div className="mini-status-row" key={a.id}>
                  <div>
                    <div className="m-name" style={{ fontSize: 15 }}>{a.type}</div>
                    <div className="m-sub" style={{ fontSize: 13 }}>{a.date} · {a.time} · {a.doctor}</div>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No appointments coming up.</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 style={{ fontSize: 18 }}>
                <Phone size={17} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
                Emergency Contact
              </h3>
            </div>
            <div className="panel-body" style={{ fontSize: 15 }}>
              {resident?.emergencyContact || 'Not on file'}
            </div>
          </div>
        </div>
      </div>

      {/* Advance Reminder Modal */}
      {selectedMed && (
        <div className="modal-backdrop" onClick={() => setSelectedMed(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, margin: 0 }}>⏰ Set Advance Medication Reminder</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Set an alert in advance so you never miss your medicine.
                </p>
              </div>
              <button
                onClick={() => setSelectedMed(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {/* Medicine Highlight */}
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#92400E' }}>
                  {selectedMed.medicine} — {selectedMed.dosage}
                </div>
                <div style={{ fontSize: 13, color: '#B45309', marginTop: 3 }}>
                  Scheduled Dose Time: <strong>{selectedMed.time}</strong>
                </div>
              </div>

              {/* Advance Timing Selection */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                  When should the reminder alert you?
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { value: 60, label: '1 Hour Before dose (Recommended)', sub: 'e.g., if dose is at 8:00, alerts at 7:00' },
                    { value: 120, label: '2 Hours Before dose', sub: 'e.g., if dose is at 8:00, alerts at 6:00' },
                    { value: 30, label: '30 Minutes Before dose', sub: 'e.g., if dose is at 8:00, alerts at 7:30' },
                    { value: 0, label: 'At Exact Dose Time', sub: 'Right on the scheduled minute' },
                    { value: -1, label: '⚡ 10-Second Test Alarm (Quick Demo)', sub: 'Fires in 10 seconds to test alarm chime & popup' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: leadOption === opt.value ? '2px solid var(--color-terracotta)' : '1px solid #E2E8F0',
                        background: leadOption === opt.value ? '#FFF7ED' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="leadOption"
                        checked={leadOption === opt.value}
                        onChange={() => setLeadOption(opt.value)}
                        style={{ marginTop: 3 }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: leadOption === opt.value ? 'var(--color-terracotta)' : 'inherit' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {opt.sub}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                }}
              >
                <Clock size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6, color: 'var(--color-terracotta)' }} />
                <span>
                  Alarm will ring: <strong>{calculateTriggerTime(selectedMed.time, leadOption).triggerTimeFormatted}</strong>
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedMed(null)}>
                Cancel
              </button>
              <button className="btn btn-terracotta" onClick={handleSaveSchedule}>
                <Bell size={15} /> Save & Activate Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
