import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, CalendarClock, Sparkles, ClipboardList, FolderOpen, Phone, Bell, Sunrise, Clock, Siren, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import {
  medications as allMedications, appointments as allAppointments, activities,
  documents as allDocuments,
} from '../../data/dummyData';
import { getPrimaryResident, scopeByResident } from '../../utils/scope.js';
import { toISODate } from '../../utils/dateUtils.js';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const { user, notificationList, pushMedicationReminder, carePlans: allCarePlans, activeEmergencies } = useApp();
  const resident = getPrimaryResident(user);
  const medications = scopeByResident(user, allMedications, 'patientId');
  const [now, setNow] = useState(new Date());
  const [toastMessage, setToastMessage] = useState(null);

  const handleSendReminder = () => {
    if (!medications[0] || !resident) return;
    const target = medications[0];
    pushMedicationReminder(target, {
      senderRole: 'family',
      senderName: user?.name,
      patientId: resident.id,
      patient: resident.name,
      caregiver: resident.caregiver,
    });
    setToastMessage(`✓ Reminder sent to ${resident.name.split(' ')[0]} only (Family & Admin will not be alerted)`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!resident) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        No resident is linked to your account yet. Please contact the facility administrator.
      </div>
    );
  }

  const todayISO = toISODate(now);
  const appointments = scopeByResident(user, allAppointments, 'patientId')
    .filter((a) => a.date >= todayISO)
    .slice(0, 3);
  const carePlan = scopeByResident(user, allCarePlans, 'residentId')[0];
  const documents = scopeByResident(user, allDocuments, 'residentId').slice(0, 3);
  const activeLovedOneAlert = activeEmergencies?.find(
    (a) => a.residentId === resident.id && a.senderRole === 'patient'
  );

  return (
    <div>
      {toastMessage && (
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
          <span>{toastMessage}</span>
        </div>
      )}

      {activeLovedOneAlert && (
        <div
          className="emergency-banner emergency-active-banner"
          style={{ cursor: 'pointer', marginBottom: 20 }}
          onClick={() => navigate('/emergency')}
        >
          <div className="sos-beacon">
            <Siren size={26} className="e-icon" />
          </div>
          <div style={{ flex: 1 }}>
            <h4>🚨 URGENT: {resident.name} triggered an Emergency SOS!</h4>
            <p>
              Distress call received from {resident.room}. On-duty caregiver ({activeLovedOneAlert.caregiver}) and nursing staff are dispatched. Click to view status.
            </p>
          </div>
        </div>
      )}

      <div className="welcome-banner">
        <div>
          <div className="w-date" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sunrise size={13} style={{ verticalAlign: 'text-bottom' }} />
            <span>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>·</span>
            <span>Family Dashboard</span>
          </div>
          <h1>Welcome, {user.name.split(' ')[0]}</h1>
          <p>Here is how {resident.name} is doing today — care status, medications and appointments, all in one place.</p>
        </div>
        <button className="btn btn-terracotta" onClick={handleSendReminder} disabled={!medications[0]}>
          <Bell size={15} /> Send Reminder to {resident.name.split(' ')[0]}
        </button>
      </div>

      <div className="vitals-hero" style={{ marginBottom: 22 }}>
        <div className="vitals-hero-top">
          <div className="vitals-hero-patient">
            <div className="identity-tile size-md">{resident.initials}</div>
            <div>
              <h3>{resident.name}</h3>
              <div className="meta">{resident.id} · Room {resident.room?.replace('Room ', '')} · {resident.condition}</div>
            </div>
          </div>
          <StatusBadge status={resident.status} />
        </div>
      </div>

      <div className="dash-grid">
        <div className="stack-gap">
          <div className="panel">
            <div className="panel-header">
              <div><h3><Pill size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Today&rsquo;s Medication</h3></div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/medications')}>View all</button>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Time</th><th>Medicine</th><th>Status</th></tr></thead>
                <tbody>
                  {medications.map((m) => (
                    <tr key={m.id}><td className="mono">{m.time}</td><td className="row-name">{m.medicine}</td><td><StatusBadge status={m.status} /></td></tr>
                  ))}
                  {medications.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No medications scheduled.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div><h3><CalendarClock size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Upcoming Appointments</h3></div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>View all</button>
            </div>
            <div className="panel-body">
              <div className="timeline">
                {appointments.map((a) => (
                  <div className="timeline-item" key={a.id}>
                    <div className="timeline-dot" />
                    <div className="timeline-time">{a.date} · {a.time}</div>
                    <div className="timeline-title">{a.type}</div>
                    <div className="timeline-desc">with {a.doctor}</div>
                  </div>
                ))}
                {appointments.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No upcoming appointments.</div>}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3><Sparkles size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Today&rsquo;s Activities</h3></div>
            <div className="panel-body">
              <div className="mini-status-list">
                {activities.slice(0, 3).map((a) => (
                  <div className="mini-status-row" key={a.id}>
                    <div className="m-name">{a.name}</div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.schedule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="stack-gap">
          <div className="panel">
            <div className="panel-header"><h3><ClipboardList size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Care Plan Progress</h3></div>
            <div className="panel-body">
              {carePlan ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>{carePlan.goal}</div>
                  <div className="progress-row" style={{ marginBottom: 6 }}>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${carePlan.progress}%` }} /></div>
                    <span className="progress-pct">{carePlan.progress}%</span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active care plan on file.</div>
              )}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/care-plans')}>View full care plan</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3><FolderOpen size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Relevant Documents</h3></div>
            <div>
              {documents.map((d) => (
                <div className="doc-row" key={d.id}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-name">{d.name}</div>
                    <div className="d-meta">{d.type} · {d.date}</div>
                  </div>
                </div>
              ))}
              {documents.length === 0 && <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>No documents on file.</div>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3><Phone size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Emergency Contact</h3></div>
            <div className="panel-body" style={{ fontSize: 13 }}>{resident.emergencyContact}</div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Care Updates</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notifications')}>View all</button>
            </div>
            <div>
              {notificationList.slice(0, 3).map((n) => (
                <div className="notif-item" key={n.id} style={{ padding: '13px 22px' }}>
                  <div className="n-body">
                    <div className="n-title">{n.title}</div>
                    <div className="n-meta">{n.time}</div>
                  </div>
                </div>
              ))}
              {notificationList.length === 0 && <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>You&rsquo;re all caught up.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
