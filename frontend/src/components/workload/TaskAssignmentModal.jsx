import { useState, useMemo } from 'react';
import {
  X, Plus, AlertTriangle, Sparkles, CheckCircle2, UserCheck,
  Clock, ShieldAlert, Calendar
} from 'lucide-react';
import { getSuggestedCaregiver, WORKLOAD_LEVELS } from '../../utils/workloadUtils.js';

const COMMON_TASKS = [
  'Evening Care & Night Handover',
  'Morning Vitals & BP Check',
  'Prescribed Medication Supervision',
  'Assisted Mobility & Posture Repositioning',
  'Hydration & Low-Sodium Dietary Check',
  'Diabetic Foot & Skin Inspection',
];

export default function TaskAssignmentModal({
  isOpen,
  onClose,
  residents = [],
  caregiverWorkloads = [],
  onAssignTask,
  preselectedCaregiver = null,
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [residentId, setResidentId] = useState(residents[0]?.id || '');
  const [selectedCaregiverName, setSelectedCaregiverName] = useState(
    preselectedCaregiver?.caregiverName || caregiverWorkloads[0]?.caregiverName || ''
  );
  const [dueTime, setDueTime] = useState('04:30 PM');
  const [category, setCategory] = useState('clinical');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Find suggested caregiver based ONLY on workload calculation
  const suggested = useMemo(() => {
    return getSuggestedCaregiver(caregiverWorkloads);
  }, [caregiverWorkloads]);

  // Selected caregiver's current workload object
  const selectedWorkload = useMemo(() => {
    return caregiverWorkloads.find((w) => w.caregiverName === selectedCaregiverName);
  }, [caregiverWorkloads, selectedCaregiverName]);

  const isSelectedHighWorkload = selectedWorkload?.level === WORKLOAD_LEVELS.HIGH;

  const handleSelectSuggested = () => {
    if (suggested) {
      setSelectedCaregiverName(suggested.caregiverName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a care task title or select one from the quick options.');
      return;
    }
    if (!selectedCaregiverName) {
      setFormError('Please select a caregiver to assign this task to.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      const targetResident = residents.find((r) => r.id === residentId);

      await onAssignTask({
        title: title.trim(),
        category,
        residentId: residentId || null,
        residentName: targetResident ? targetResident.name : 'Facility General',
        room: targetResident ? targetResident.room : 'General Area',
        caregiver: selectedCaregiverName,
        dueTime,
        priority,
        notes: notes.trim(),
      });

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setFormError(err?.message || 'Failed to assign task. Please try again.');
    }
  };

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="wb-modal-header">
          <div>
            <h3>
              <Plus size={18} style={{ color: 'var(--wb-primary)' }} />
              Assign Care Task
            </h3>
            <span style={{ fontSize: 12, color: 'var(--wb-muted-text)' }}>
              Operational workload overview for available caregivers before assignment
            </span>
          </div>
          <button type="button" className="wb-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="wb-modal-body">
            {formError && (
              <div
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {formError}
              </div>
            )}

            {/* Task Title with Quick Chips */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                Care Task Title *
              </label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. Evening Care & Handover, Vitals Check"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--wb-border)',
                  fontSize: 13.5,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {COMMON_TASKS.map((quickTitle) => (
                  <button
                    key={quickTitle}
                    type="button"
                    onClick={() => setTitle(quickTitle)}
                    style={{
                      background: title === quickTitle ? 'var(--wb-soft)' : '#FFF',
                      border: title === quickTitle ? '1px solid var(--wb-primary)' : '1px solid var(--wb-border)',
                      color: title === quickTitle ? 'var(--wb-deep)' : 'var(--wb-muted-text)',
                      borderRadius: 14,
                      padding: '4px 10px',
                      fontSize: 11.5,
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 120ms ease',
                    }}
                  >
                    + {quickTitle}
                  </button>
                ))}
              </div>
            </div>

            {/* Resident & Due Time Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                  Associated Resident
                </label>
                <select
                  value={residentId}
                  onChange={(e) => setResidentId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--wb-border)',
                    fontSize: 13,
                    background: '#FFF',
                  }}
                >
                  <option value="">Facility Wide / General</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.room})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                  Target Due Time
                </label>
                <select
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--wb-border)',
                    fontSize: 13,
                    background: '#FFF',
                  }}
                >
                  <option value="08:00 AM">08:00 AM (Morning Round)</option>
                  <option value="11:30 AM">11:30 AM (Pre-Lunch)</option>
                  <option value="02:00 PM">02:00 PM (Afternoon)</option>
                  <option value="04:30 PM">04:30 PM (Evening Activity)</option>
                  <option value="06:30 PM">06:30 PM (Dinner & Vitals)</option>
                  <option value="08:30 PM">08:30 PM (Night Care)</option>
                  <option value="10:00 PM">10:00 PM (Bedtime Routine)</option>
                </select>
              </div>
            </div>

            {/* Category & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                  Task Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--wb-border)',
                    fontSize: 13,
                    background: '#FFF',
                  }}
                >
                  <option value="clinical">Clinical Care & Vitals</option>
                  <option value="medication">Medication Administration</option>
                  <option value="mobility">Mobility & Physiotherapy</option>
                  <option value="hygiene">Hygiene & Comfort</option>
                  <option value="wellness">Wellness & Recreation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--wb-border)',
                    fontSize: 13,
                    background: '#FFF',
                  }}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority (Standard)</option>
                  <option value="high">High Priority (Urgent)</option>
                </select>
              </div>
            </div>

            {/* SECTION: AVAILABLE CAREGIVERS WITH LIVE WORKLOAD INFO */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--wb-text)', margin: 0 }}>
                  Select Assignee Caregiver *
                </label>
                <span style={{ fontSize: 11.5, color: 'var(--wb-muted-text)' }}>
                  Showing live workload before assignment
                </span>
              </div>

              {/* Suggested Caregiver Pill / Prompt */}
              {suggested && (
                <div className="wb-suggested-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={16} style={{ color: 'var(--wb-primary)' }} />
                    <div style={{ fontSize: 12.5 }}>
                      Suggested based on current workload:{' '}
                      <strong>{suggested.caregiverName}</strong>
                      <span className="wb-badge low" style={{ marginLeft: 8, fontSize: 10 }}>
                        {suggested.level} WORKLOAD
                      </span>
                    </div>
                  </div>
                  {selectedCaregiverName !== suggested.caregiverName && (
                    <button
                      type="button"
                      className="wb-btn wb-btn-primary wb-btn-sm"
                      onClick={handleSelectSuggested}
                    >
                      Assign to {suggested.caregiverName.split(' ')[0]}
                    </button>
                  )}
                </div>
              )}

              {/* Live Caregiver Workload Selector List */}
              <div className="wb-caregiver-picker-list">
                {caregiverWorkloads.map((w) => {
                  const isSelected = selectedCaregiverName === w.caregiverName;
                  return (
                    <div
                      key={w.caregiverId}
                      className={`wb-caregiver-picker-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedCaregiverName(w.caregiverName)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="radio"
                          name="caregiverSelect"
                          checked={isSelected}
                          onChange={() => setSelectedCaregiverName(w.caregiverName)}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--wb-text)' }}>
                            {w.caregiverName}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--wb-muted-text)', marginTop: 1 }}>
                            {w.role} • {w.availability}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right', fontSize: 11.5 }}>
                          <span style={{ fontWeight: 600, color: 'var(--wb-text)' }}>
                            {w.assignedResidentCount} Res
                          </span>
                          <span style={{ color: 'var(--wb-muted-text)', margin: '0 4px' }}>•</span>
                          <span style={{ fontWeight: 600, color: w.pendingTaskCount > 4 ? '#DC2626' : 'var(--wb-text)' }}>
                            {w.pendingTaskCount} Pending
                          </span>
                          {w.overdueTaskCount > 0 && (
                            <span style={{ color: '#DC2626', fontWeight: 700, marginLeft: 4 }}>
                              ({w.overdueTaskCount} overdue)
                            </span>
                          )}
                        </div>

                        <span className={`wb-badge ${w.level.toLowerCase()}`}>
                          {w.level}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* OVERLOAD WARNING IF ADMIN SELECTS A HIGH WORKLOAD CAREGIVER */}
              {isSelectedHighWorkload && selectedWorkload && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <ShieldAlert size={18} style={{ color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12.5, color: '#991B1B', lineHeight: 1.4 }}>
                    <strong>HIGH WORKLOAD WARNING:</strong> {selectedWorkload.caregiverName} currently has{' '}
                    <strong>{selectedWorkload.assignedResidentCount} assigned residents</strong>,{' '}
                    <strong>{selectedWorkload.pendingTaskCount} pending tasks</strong>, and{' '}
                    <strong>{selectedWorkload.overdueTaskCount} overdue tasks</strong>.
                    <div style={{ marginTop: 4, color: '#7F1D1D' }}>
                      Review workload capacity before assigning another care task. This is an operational workload-management warning, not a medical restriction.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                Care Instructions / Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Specific guidance, observations to record, or precautions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--wb-border)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--wb-muted-text)', background: 'var(--wb-bg)', padding: '8px 12px', borderRadius: 6 }}>
              Note: Workload suggestion is an operational recommendation only. Admin retains complete authority and control over the final assignment decision.
            </div>
          </div>

          {/* Footer */}
          <div className="wb-modal-footer">
            <button type="button" className="wb-btn wb-btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="wb-btn wb-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : `Confirm Assignment to ${selectedCaregiverName.split(' ')[0] || 'Caregiver'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
