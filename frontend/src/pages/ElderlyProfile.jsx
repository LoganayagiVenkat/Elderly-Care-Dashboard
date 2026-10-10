import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Phone, Droplet, CalendarDays, Pill, ClipboardList, NotebookPen, Plus, Trash2, AlertCircle, X, GitFork, MessageSquare, Mic } from 'lucide-react';
import { elderlyResidents, medications } from '../data/dummyData';
import { useApp } from '../context/AppContext.jsx';
import { getScopedResidentIds } from '../utils/scope.js';
import { getRelativeFormatted } from '../utils/dateUtils.js';
import { openWhatsApp, formatFamilyCheckinWhatsAppMessage } from '../utils/whatsapp.js';
import StatusBadge from '../components/StatusBadge.jsx';

const SEED_NOTES = [
  { id: 'CN-01', author: 'Priya Nair', time: `${getRelativeFormatted(-1)} · 09:10 AM`, text: 'Resident was comfortable during morning activities. Appetite was normal.' },
];

const RESIDENT_NOTES_KEY = 'eldercare_resident_notes';

function loadStoredNotes(residentId) {
  try {
    const raw = localStorage.getItem(RESIDENT_NOTES_KEY);
    if (raw) {
      const all = JSON.parse(raw);
      if (all && all[residentId]) return all[residentId];
    }
  } catch (err) {
    console.warn('[ElderlyProfile] Failed to load notes from localStorage', err);
  }
  return SEED_NOTES;
}

export default function ElderlyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, residents, carePlans, toggleCarePlanTask, deleteResident } = useApp();
  const allResidents = residents || elderlyResidents;
  const allowedIds = getScopedResidentIds(user, allResidents);
  const resident = allResidents.find((r) => r.id === id);
  const isAuthorized = resident && allowedIds.has(resident.id);

  const [notes, setNotes] = useState(() => loadStoredNotes(id));
  const [noteText, setNoteText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canAddNotes = user.role === 'admin' || user.role === 'caregiver';

  const handleConfirmDelete = async () => {
    if (!resident) return;
    setIsDeleting(true);
    try {
      await deleteResident(resident.id);
      navigate('/elderly');
    } catch (err) {
      console.error('[ElderlyProfile] Error deleting resident:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!resident || !isAuthorized) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ marginBottom: 10 }}>{resident ? 'Access restricted' : 'Resident not found'}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          {resident
            ? 'You do not have permission to view this resident\u2019s profile.'
            : <>No profile exists for patient ID <span className="mono">{id}</span>.</>}
        </p>
        <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const residentMeds = medications.filter((m) => m.patientId === id);
  const residentPlan = carePlans.find((p) => p.patient === resident.name);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const newNote = {
      id: `CN-${Date.now()}`,
      author: user.name || 'Caregiver',
      time: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      text: noteText.trim(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setNoteText('');
    try {
      const raw = localStorage.getItem(RESIDENT_NOTES_KEY);
      const all = raw ? JSON.parse(raw) : {};
      all[id] = updated;
      localStorage.setItem(RESIDENT_NOTES_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn('[ElderlyProfile] Failed to save note to localStorage', err);
    }
  };

  const handleDeleteNote = (noteId) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    try {
      const raw = localStorage.getItem(RESIDENT_NOTES_KEY);
      const all = raw ? JSON.parse(raw) : {};
      all[id] = updated;
      localStorage.setItem(RESIDENT_NOTES_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn('[ElderlyProfile] Failed to update notes in localStorage', err);
    }
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="profile-header">
        <div className="identity-tile size-lg">{resident.initials}</div>
        <div className="p-info">
          <h2>{resident.name}</h2>
          <div className="p-meta">
            <span className="mono">{resident.id}</span>
            <span>{resident.age} Years · {resident.gender}</span>
            <span>{resident.room}</span>
            <StatusBadge status={resident.status} />
          </div>
        </div>
        <div className="profile-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/care-dependency-map?residentId=${resident.id}`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <GitFork size={14} /> Care Dependency Map
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/health')}>Care Records</button>
          {user?.role === 'admin' && (
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '8px 14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={15} /> Delete Resident
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="stack-gap">
          <div className="panel">
            <div className="panel-header">
              <h3>Medical Overview</h3>
            </div>
            <div className="panel-body">
              <div className="kv-list">
                <div className="kv-row"><span className="k">Primary Condition</span><span className="v">{resident.condition}</span></div>
                <div className="kv-row"><span className="k">Blood Group</span><span className="v">{resident.bloodGroup}</span></div>
                <div className="kv-row"><span className="k">Admitted On</span><span className="v">{resident.admitted}</span></div>
                <div className="kv-row"><span className="k">Assigned Caregiver</span><span className="v">{resident.caregiver}</span></div>
                <div className="kv-row"><span className="k">Last Assessment</span><span className="v">{resident.lastAssessment}</span></div>
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--surface-sunken)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                {resident.notes}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3><Pill size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Medication Schedule</h3>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Time</th><th>Medicine</th><th>Dosage</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {residentMeds.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No medications scheduled.</td></tr>
                  )}
                  {residentMeds.map((m) => (
                    <tr key={m.id}>
                      <td className="mono">{m.time}</td>
                      <td className="row-name">{m.medicine}</td>
                      <td>{m.dosage}</td>
                      <td><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3><NotebookPen size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Care Notes</h3></div>
            <div className="panel-body">
              {canAddNotes && (
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    placeholder="Add a care note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm"><Plus size={13} /> Add</button>
                </form>
              )}
              <div className="observation-list">
                {notes.map((n) => (
                  <div className="observation-card" key={n.id}>
                    <div className="o-head">
                      <span className="o-author">{n.author}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="o-date">{n.time}</span>
                        {canAddNotes && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(n.id)}
                            title="Delete note"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                              transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-terracotta)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="o-text">{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="stack-gap">
          <div className="panel">
            <div className="panel-header"><h3>Emergency & Contact Details</h3></div>
            <div className="panel-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: resident.phone ? 12 : 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="stat-icon"><Phone size={16} /></div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Emergency Contact</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{resident.emergencyContact}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5 }}
                  onClick={() => openWhatsApp(resident.emergencyContact, formatFamilyCheckinWhatsAppMessage({ familyName: 'Family', residentName: resident.name, status: resident.status }))}
                  title="Send WhatsApp wellness update to emergency contact"
                >
                  <MessageSquare size={13} style={{ color: '#25D366' }} /> WhatsApp
                </button>
              </div>

              {resident.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}><Phone size={16} /></div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Resident Phone</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{resident.phone}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5 }}
                    onClick={() => openWhatsApp(resident.phone, `Hello ${resident.name}, message from ElderCare care team.`)}
                  >
                    <MessageSquare size={13} style={{ color: '#25D366' }} /> WhatsApp
                  </button>
                </div>
              )}

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-hairline)' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => navigate('/voicemails')}
                >
                  <Mic size={14} /> Send Voice Mail to Resident / Family
                </button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <ClipboardList size={16} style={{ color: 'var(--color-forest, #0284C7)' }} />
                Care Plan
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/care-plans')}
                style={{ fontSize: 12, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                title="View full Care Plans page"
              >
                View Full <ArrowRight size={12} />
              </button>
            </div>
            <div className="panel-body">
              {residentPlan ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{residentPlan.goal}</div>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {residentPlan.tasks.filter((t) => t.done).length}/{residentPlan.tasks.length} done
                    </span>
                  </div>
                  <div className="progress-row" style={{ marginBottom: 14 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${residentPlan.progress}%`, transition: 'width 0.3s ease' }} />
                    </div>
                    <span className="progress-pct">{residentPlan.progress}%</span>
                  </div>
                  <div className="plan-tasks-list">
                    {residentPlan.tasks.map((t) => (
                      <div
                        className={`plan-task ${t.done ? 'done' : ''}`}
                        key={t.label}
                        onClick={() => toggleCarePlanTask(residentPlan.id, t.label)}
                        role="checkbox"
                        aria-checked={t.done}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggleCarePlanTask(residentPlan.id, t.label);
                          }
                        }}
                        title={`Click to mark as ${t.done ? 'pending' : 'completed'}`}
                      >
                        <span className="chk">{t.done ? '✓' : ''}</span>
                        <span>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active care plan on file.</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><h3><CalendarDays size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Vitals Snapshot</h3></div>
            <div className="panel-body">
              <div className="kv-list">
                <div className="kv-row"><span className="k">Blood Group</span><span className="v"><Droplet size={12} style={{ verticalAlign: 'text-bottom' }} /> {resident.bloodGroup}</span></div>
                <div className="kv-row"><span className="k">Status</span><span className="v"><StatusBadge status={resident.status} /></span></div>
              </div>
              <button className="btn btn-secondary btn-block" style={{ marginTop: 14 }} onClick={() => navigate('/health')}>
                Open Care Records
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Resident Confirmation Modal */}
      {showDeleteModal && (
        <div className="doc-modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="doc-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={20} style={{ color: '#DC2626' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#DC2626' }}>
                  Delete Elderly Resident
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-main, #334155)', lineHeight: 1.5 }}>
                Are you sure you want to permanently remove <strong>{resident.name}</strong> ({resident.id}) from the facility?
              </p>
              <div
                style={{
                  marginTop: 14,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#991B1B',
                  lineHeight: 1.4,
                }}
              >
                ⚠️ This will remove the resident from all pages, care plans, and directories across the system.
              </div>
            </div>

            <div className="doc-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                disabled={isDeleting}
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '8px 16px', borderRadius: 8 }}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Delete Resident</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
