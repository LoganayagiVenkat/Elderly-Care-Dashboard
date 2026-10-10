import { useState, useMemo } from 'react';
import {
  X, ArrowRightLeft, AlertTriangle, CheckCircle2, UserCheck,
  ShieldCheck, ArrowRight, Clock, Users
} from 'lucide-react';
import { WORKLOAD_LEVELS } from '../../utils/workloadUtils.js';

export default function WorkloadRebalanceModal({
  isOpen,
  onClose,
  overloadedCaregiver,
  caregiverWorkloads = [],
  onReassignTask,
  preselectedTask = null,
}) {
  if (!isOpen) return null;

  // Source caregiver
  const sourceCg = overloadedCaregiver || caregiverWorkloads.find((w) => w.level === WORKLOAD_LEVELS.HIGH) || caregiverWorkloads[0];

  // Candidates for reassignment (on-duty, lower workload)
  const candidateCaregivers = useMemo(() => {
    return caregiverWorkloads.filter(
      (w) => w.caregiverName !== sourceCg?.caregiverName && (w.availability === 'On Duty' || w.availability === 'On Call')
    ).sort((a, b) => a.score - b.score);
  }, [caregiverWorkloads, sourceCg]);

  // Tasks eligible for reassignment (pending or overdue tasks of source caregiver)
  const eligibleTasks = useMemo(() => {
    if (!sourceCg) return [];
    return [...(sourceCg.overdueTasks || []), ...(sourceCg.pendingTasks || [])];
  }, [sourceCg]);

  const [selectedTaskId, setSelectedTaskId] = useState(
    preselectedTask?.id || eligibleTasks[0]?.id || ''
  );
  const [targetCaregiverName, setTargetCaregiverName] = useState(
    candidateCaregivers[0]?.caregiverName || ''
  );
  const [reassignReason, setReassignReason] = useState('Workload leveling & schedule balance');
  const [isConfirming, setIsConfirming] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedTask = useMemo(() => {
    return eligibleTasks.find((t) => t.id === selectedTaskId) || preselectedTask;
  }, [eligibleTasks, selectedTaskId, preselectedTask]);

  const targetWorkload = useMemo(() => {
    return caregiverWorkloads.find((w) => w.caregiverName === targetCaregiverName);
  }, [caregiverWorkloads, targetCaregiverName]);

  const handleExecuteReassignment = async () => {
    if (!selectedTaskId) {
      setErrorMsg('Please select a task to reassign.');
      return;
    }
    if (!targetCaregiverName) {
      setErrorMsg('Please choose a target caregiver.');
      return;
    }

    try {
      setIsConfirming(true);
      setErrorMsg('');

      await onReassignTask(selectedTaskId, targetCaregiverName, reassignReason);

      setSuccessFeedback(
        `Task "${selectedTask?.title || 'Selected task'}" was successfully reassigned from ${sourceCg?.caregiverName} to ${targetCaregiverName}!`
      );

      setTimeout(() => {
        setIsConfirming(false);
        onClose();
      }, 1800);
    } catch (err) {
      setIsConfirming(false);
      setErrorMsg(err?.message || 'Failed to reassign task.');
    }
  };

  return (
    <div className="wb-modal-overlay" onClick={() => !isConfirming && onClose()}>
      <div className="wb-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660 }}>
        {/* Header */}
        <div className="wb-modal-header">
          <div>
            <h3>
              <ArrowRightLeft size={18} style={{ color: 'var(--wb-primary)' }} />
              Workload Rebalancing Assistant
            </h3>
            <span style={{ fontSize: 12, color: 'var(--wb-muted-text)' }}>
              Review care tasks from high-load caregivers and reassign to available team members
            </span>
          </div>
          <button type="button" className="wb-modal-close" onClick={onClose} disabled={isConfirming} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Success Feedback Alert */}
        {successFeedback ? (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--wb-text)', margin: '0 0 6px' }}>
              Workload Reassigned Successfully!
            </h4>
            <p style={{ fontSize: 13.5, color: 'var(--wb-muted-text)', maxWidth: 440, margin: '0 auto' }}>
              {successFeedback} Both caregiver workload scores and dashboards have been recalculated immediately.
            </p>
          </div>
        ) : (
          <div className="wb-modal-body">
            {errorMsg && (
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
                {errorMsg}
              </div>
            )}

            {/* Side-by-Side Caregiver Workload Comparison */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 12,
                alignItems: 'center',
                background: 'var(--wb-bg)',
                borderRadius: 10,
                padding: '14px 16px',
                border: '1px solid var(--wb-border-light)',
              }}
            >
              {/* Source (Overloaded) */}
              <div style={{ background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid #FCA5A5' }}>
                <span className="wb-badge high" style={{ fontSize: 9.5, marginBottom: 4 }}>
                  SOURCE (HIGH WORKLOAD)
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--wb-text)' }}>
                  {sourceCg?.caregiverName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--wb-muted-text)', marginTop: 2 }}>
                  {sourceCg?.assignedResidentCount} Residents • {sourceCg?.pendingTaskCount} Pending
                </div>
                {sourceCg?.overdueTaskCount > 0 && (
                  <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, marginTop: 2 }}>
                    ⚠ {sourceCg.overdueTaskCount} Overdue Tasks
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--wb-muted)' }}>
                <ArrowRight size={20} />
                <span style={{ fontSize: 10, fontWeight: 700 }}>REASSIGN</span>
              </div>

              {/* Target (Lower Workload) */}
              <div style={{ background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid var(--wb-border)' }}>
                <span className={`wb-badge ${targetWorkload?.level?.toLowerCase() || 'low'}`} style={{ fontSize: 9.5, marginBottom: 4 }}>
                  TARGET ({targetWorkload?.level || 'LOW'} WORKLOAD)
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--wb-text)' }}>
                  {targetWorkload?.caregiverName || 'Select Caregiver'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--wb-muted-text)', marginTop: 2 }}>
                  {targetWorkload?.assignedResidentCount || 0} Residents • {targetWorkload?.pendingTaskCount || 0} Pending
                </div>
                <div style={{ fontSize: 11, color: 'var(--wb-primary)', fontWeight: 600, marginTop: 2 }}>
                  Available capacity
                </div>
              </div>
            </div>

            {/* Step 1: Select Eligible Task to Reassign */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                1. Select Task to Reassign from {sourceCg?.caregiverName} ({eligibleTasks.length} eligible) *
              </label>

              {eligibleTasks.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', background: 'var(--wb-bg)', borderRadius: 8, fontSize: 13, color: 'var(--wb-muted-text)' }}>
                  No pending care tasks currently assigned to {sourceCg?.caregiverName}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--wb-border)', borderRadius: 8, padding: 6 }}>
                  {eligibleTasks.map((t) => {
                    const isSelected = selectedTaskId === t.id;
                    const isOverdue = t.status === 'overdue' || t.isOverdue;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: isSelected ? 'var(--wb-soft)' : isOverdue ? '#FFF5F5' : '#FFF',
                          border: isSelected ? '1px solid var(--wb-primary)' : isOverdue ? '1px solid #FED7D7' : '1px solid var(--wb-border-light)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="radio"
                            name="taskToReassign"
                            checked={isSelected}
                            onChange={() => setSelectedTaskId(t.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--wb-text)' }}>
                              {t.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--wb-muted-text)' }}>
                              Resident: <strong>{t.residentName}</strong> ({t.room || 'General'}) • Due: <strong>{t.dueTime}</strong>
                            </div>
                          </div>
                        </div>

                        {isOverdue && (
                          <span style={{ fontSize: 10, background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            OVERDUE
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Select Target Caregiver */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                2. Reassign To Caregiver *
              </label>
              <select
                value={targetCaregiverName}
                onChange={(e) => setTargetCaregiverName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--wb-border)',
                  fontSize: 13.5,
                  background: '#FFF',
                  fontWeight: 600,
                }}
              >
                {candidateCaregivers.map((c) => (
                  <option key={c.caregiverId} value={c.caregiverName}>
                    {c.caregiverName} — {c.level} WORKLOAD ({c.assignedResidentCount} Res, {c.pendingTaskCount} Pending Tasks)
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Reassignment Reason / Note */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--wb-text)' }}>
                Operational Note (Optional)
              </label>
              <input
                type="text"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="Reason for rebalancing"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--wb-border)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E' }}>
              <strong>Admin Confirmation Required:</strong> Tasks are never reassigned automatically. Clicking "Confirm Reassignment" below will immediately transfer task ownership, recalculate both caregivers' workload scores, and update pending task counts across the system.
            </div>
          </div>
        )}

        {/* Footer */}
        {!successFeedback && (
          <div className="wb-modal-footer">
            <button type="button" className="wb-btn wb-btn-outline" onClick={onClose} disabled={isConfirming}>
              Cancel
            </button>
            <button
              type="button"
              className="wb-btn wb-btn-primary"
              onClick={handleExecuteReassignment}
              disabled={isConfirming || eligibleTasks.length === 0}
            >
              {isConfirming ? 'Reassigning...' : 'Confirm Task Reassignment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
