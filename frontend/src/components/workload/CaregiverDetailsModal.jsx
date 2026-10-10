import { useState } from 'react';
import {
  X, UserCog, Clock, Phone, Users, CheckCircle2, AlertTriangle,
  Calendar, Pill, Sparkles, AlertCircle, ArrowRightLeft, Check
} from 'lucide-react';
import StatusBadge from '../StatusBadge.jsx';

export default function CaregiverDetailsModal({
  workload,
  onClose,
  onToggleTask,
  onOpenReassignTask,
}) {
  if (!workload) return null;

  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'residents' | 'appointments' | 'meds' | 'formula'

  const {
    caregiverName,
    role,
    shift,
    phone,
    availability,
    score,
    level,
    theme,
    capacityPct,
    assignedResidents = [],
    pendingTasks = [],
    completedTasks = [],
    overdueTasks = [],
    todayAppointments = [],
    pendingMedications = [],
    facilitatedActivities = [],
    breakdown = [],
  } = workload;

  const totalTasks = pendingTasks.length + completedTasks.length + overdueTasks.length;

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740 }}>
        {/* Header */}
        <div className="wb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: theme.bg,
                color: theme.fg,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {workload.initials}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                {caregiverName}
                <span className={`wb-badge ${level.toLowerCase()}`}>{level} WORKLOAD</span>
              </h3>
              <div style={{ fontSize: 12.5, color: 'var(--wb-muted-text)', marginTop: 2, display: 'flex', gap: 10 }}>
                <span>{role}</span>
                <span>•</span>
                <span><Clock size={12} style={{ verticalAlign: 'text-bottom' }} /> {shift}</span>
                <span>•</span>
                <span><Phone size={12} style={{ verticalAlign: 'text-bottom' }} /> {phone}</span>
              </div>
            </div>
          </div>
          <button type="button" className="wb-modal-close" onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div style={{ padding: '16px 24px', background: 'var(--wb-bg)', borderBottom: '1px solid var(--wb-border-light)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div style={{ background: '#FFF', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--wb-border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--wb-muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>Workload Score</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: theme.fg, marginTop: 2 }}>{score} pts</div>
              <div style={{ fontSize: 11, color: 'var(--wb-muted-text)' }}>{capacityPct}% operational load</div>
            </div>

            <div style={{ background: '#FFF', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--wb-border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--wb-muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Residents</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--wb-text)', marginTop: 2 }}>{assignedResidents.length}</div>
              <div style={{ fontSize: 11, color: 'var(--wb-muted-text)' }}>primary care</div>
            </div>

            <div style={{ background: '#FFF', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--wb-border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--wb-muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>Pending Tasks</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: pendingTasks.length > 0 ? 'var(--wb-text)' : 'var(--wb-muted-text)', marginTop: 2 }}>
                {pendingTasks.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--wb-muted-text)' }}>of {totalTasks} total tasks</div>
            </div>

            <div style={{ background: overdueTasks.length > 0 ? '#FEE2E2' : '#FFF', padding: '10px 14px', borderRadius: 8, border: overdueTasks.length > 0 ? '1px solid #FCA5A5' : '1px solid var(--wb-border-light)' }}>
              <div style={{ fontSize: 11, color: overdueTasks.length > 0 ? '#991B1B' : 'var(--wb-muted-text)', textTransform: 'uppercase', fontWeight: 600 }}>Overdue Tasks</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: overdueTasks.length > 0 ? '#DC2626' : 'var(--wb-muted-text)', marginTop: 2 }}>
                {overdueTasks.length}
              </div>
              <div style={{ fontSize: 11, color: overdueTasks.length > 0 ? '#991B1B' : 'var(--wb-muted-text)' }}>
                {overdueTasks.length > 0 ? 'requires attention' : 'all on schedule'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ padding: '0 24px', borderBottom: '1px solid var(--wb-border-light)' }}>
          <div className="wb-tabs-nav" style={{ margin: 0 }}>
            <button
              type="button"
              className={`wb-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              Care Tasks ({totalTasks})
            </button>
            <button
              type="button"
              className={`wb-tab-btn ${activeTab === 'residents' ? 'active' : ''}`}
              onClick={() => setActiveTab('residents')}
            >
              Assigned Residents ({assignedResidents.length})
            </button>
            <button
              type="button"
              className={`wb-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              Today's Appts ({todayAppointments.length})
            </button>
            <button
              type="button"
              className={`wb-tab-btn ${activeTab === 'meds' ? 'active' : ''}`}
              onClick={() => setActiveTab('meds')}
            >
              Medications ({pendingMedications.length})
            </button>
            <button
              type="button"
              className={`wb-tab-btn ${activeTab === 'formula' ? 'active' : ''}`}
              onClick={() => setActiveTab('formula')}
            >
              Score Calculation Breakdown
            </button>
          </div>
        </div>

        {/* Body Content by Tab */}
        <div className="wb-modal-body">
          {/* TAB 1: CARE TASKS */}
          {activeTab === 'tasks' && (
            <div>
              {/* Overdue Tasks Section */}
              {overdueTasks.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
                    <AlertTriangle size={15} />
                    <span>Overdue Care Tasks ({overdueTasks.length})</span>
                  </div>
                  {overdueTasks.map((t) => (
                    <div key={t.id} className="wb-task-item is-overdue">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => onToggleTask(t.id)}
                          style={{
                            background: '#FFF',
                            border: '1px solid #DC2626',
                            borderRadius: 4,
                            width: 20,
                            height: 20,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 2,
                          }}
                          title="Click to mark completed"
                        >
                          <span style={{ fontSize: 10, color: '#DC2626' }}>!</span>
                        </button>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#991B1B' }}>{t.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--wb-muted-text)', marginTop: 2 }}>
                            Resident: <strong>{t.residentName}</strong> ({t.room || 'Room N/A'}) • Due: <strong>{t.dueTime}</strong>
                          </div>
                          {t.notes && <div style={{ fontSize: 11.5, color: '#7F1D1D', marginTop: 3 }}>Note: {t.notes}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, background: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                          OVERDUE
                        </span>
                        {onOpenReassignTask && (
                          <button
                            type="button"
                            className="wb-btn wb-btn-outline wb-btn-sm"
                            onClick={() => onOpenReassignTask(t)}
                            title="Reassign this overdue task to another caregiver"
                          >
                            <ArrowRightLeft size={12} />
                            <span>Reassign</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Tasks Section */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--wb-text)', marginBottom: 8 }}>
                  Active Pending Tasks ({pendingTasks.length})
                </div>
                {pendingTasks.length === 0 ? (
                  <div style={{ padding: 18, textAlign: 'center', color: 'var(--wb-muted-text)', background: 'var(--wb-bg)', borderRadius: 8, fontSize: 13 }}>
                    No pending care tasks assigned to {caregiverName}.
                  </div>
                ) : (
                  pendingTasks.map((t) => (
                    <div key={t.id} className="wb-task-item">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => onToggleTask(t.id)}
                          style={{
                            background: '#FFF',
                            border: '1px solid var(--wb-border)',
                            borderRadius: 4,
                            width: 20,
                            height: 20,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 2,
                          }}
                          title="Click to mark completed"
                        >
                          {t.status === 'completed' && <Check size={14} color="var(--wb-primary)" />}
                        </button>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--wb-text)' }}>{t.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--wb-muted-text)', marginTop: 2 }}>
                            Resident: <strong>{t.residentName}</strong> ({t.room || 'General'}) • Due: <strong>{t.dueTime}</strong> • Priority: {t.priority || 'Medium'}
                          </div>
                          {t.notes && <div style={{ fontSize: 11.5, color: 'var(--wb-muted-text)', marginTop: 3 }}>{t.notes}</div>}
                        </div>
                      </div>
                      {onOpenReassignTask && (
                        <button
                          type="button"
                          className="wb-btn wb-btn-outline wb-btn-sm"
                          onClick={() => onOpenReassignTask(t)}
                          title="Reassign task to another caregiver"
                        >
                          <ArrowRightLeft size={12} />
                          <span>Reassign</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Completed Tasks Section */}
              {completedTasks.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--wb-muted-text)', marginBottom: 8 }}>
                    Completed Today ({completedTasks.length})
                  </div>
                  {completedTasks.map((t) => (
                    <div key={t.id} className="wb-task-item is-done">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => onToggleTask(t.id)}
                          style={{
                            background: 'var(--wb-soft)',
                            border: '1px solid var(--wb-muted)',
                            borderRadius: 4,
                            width: 20,
                            height: 20,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Click to unmark"
                        >
                          <Check size={14} color="var(--wb-primary)" />
                        </button>
                        <div>
                          <span style={{ fontSize: 13, textDecoration: 'line-through', color: 'var(--wb-muted-text)' }}>
                            {t.title}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--wb-muted-text)', marginLeft: 8 }}>
                            ({t.residentName} • Completed at {t.completedAt || 'today'})
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--wb-primary)', fontWeight: 600 }}>✓ Done</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSIGNED RESIDENTS */}
          {activeTab === 'residents' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--wb-muted-text)', marginBottom: 12 }}>
                Residents under primary care responsibility of <strong>{caregiverName}</strong>:
              </div>
              {assignedResidents.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--wb-muted-text)', background: 'var(--wb-bg)', borderRadius: 8 }}>
                  No residents currently assigned to this caregiver.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {assignedResidents.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--wb-border)',
                        borderRadius: 10,
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--wb-text)' }}>{r.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--wb-muted-text)' }}>ID: {r.id} • {r.room}</div>
                          </div>
                          <StatusBadge status={r.status} />
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--wb-text)' }}>
                          <strong>Condition:</strong> {r.condition || 'General Care'}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--wb-muted-text)', marginTop: 10, borderTop: '1px solid var(--wb-border-light)', paddingTop: 8 }}>
                        Last Assessment: {r.lastAssessment || 'Recent'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TODAY'S APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--wb-muted-text)', marginBottom: 12 }}>
                Appointments scheduled today involving {caregiverName} or assigned residents:
              </div>
              {todayAppointments.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--wb-muted-text)', background: 'var(--wb-bg)', borderRadius: 8 }}>
                  No appointments scheduled for today.
                </div>
              ) : (
                todayAppointments.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--wb-border)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--wb-text)' }}>
                        {a.type || 'Clinical Checkup'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--wb-muted-text)', marginTop: 2 }}>
                        Patient: <strong>{a.patient}</strong> • Doctor: {a.doctor} • Time: <strong>{a.time}</strong>
                      </div>
                    </div>
                    <StatusBadge status={a.status || 'confirmed'} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: MEDICATIONS */}
          {activeTab === 'meds' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--wb-muted-text)', marginBottom: 12 }}>
                Pending or missed medication rounds today for assigned residents:
              </div>
              {pendingMedications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--wb-muted-text)', background: 'var(--wb-bg)', borderRadius: 8 }}>
                  All scheduled medications for assigned residents are up to date!
                </div>
              ) : (
                pendingMedications.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--wb-border)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--wb-text)' }}>
                        {m.medicine} ({m.dosage})
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--wb-muted-text)', marginTop: 2 }}>
                        Patient: <strong>{m.patient}</strong> • Slot: {m.slot} • Time: <strong>{m.time}</strong>
                      </div>
                      {m.instructions && (
                        <div style={{ fontSize: 11.5, color: 'var(--wb-muted-text)', marginTop: 2 }}>
                          {m.instructions}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: SCORE CALCULATION BREAKDOWN */}
          {activeTab === 'formula' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--wb-muted-text)', marginBottom: 12 }}>
                Transparent mathematical scoring formula based strictly on facility care records:
              </div>

              <table className="wb-breakdown-formula-table">
                <thead>
                  <tr>
                    <th>Workload Factor</th>
                    <th style={{ textAlign: 'center' }}>Count</th>
                    <th style={{ textAlign: 'center' }}>Weight</th>
                    <th style={{ textAlign: 'right' }}>Calculated Points</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row) => (
                    <tr key={row.factor}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{row.factor}</span>
                        {row.urgent && (
                          <span style={{ marginLeft: 6, fontSize: 10.5, color: '#DC2626', fontWeight: 700 }}>
                            (! High Impact)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{row.count}</td>
                      <td style={{ textAlign: 'center' }}>× {row.weight.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {row.points.toFixed(1)} pts
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td>
                      <strong>Total Operational Workload Score</strong>
                    </td>
                    <td colSpan={2} style={{ textAlign: 'center', fontSize: 12 }}>
                      Scale: &lt;10 Low | 10–18 Moderate | &gt;18 High
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 15, color: theme.fg }}>
                      <strong>{score.toFixed(1)} pts ({level})</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: 'var(--wb-bg)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--wb-muted-text)',
                  lineHeight: 1.5,
                }}
              >
                <strong>Operational Safety Rule:</strong> This score measures administrative, escort, and daily care burden to balance staff assignments. It does not measure clinical severity or dictate medical treatments.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="wb-modal-footer">
          <button type="button" className="wb-btn wb-btn-primary" onClick={onClose}>
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
