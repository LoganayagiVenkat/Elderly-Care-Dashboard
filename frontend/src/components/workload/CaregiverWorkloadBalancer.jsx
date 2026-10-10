import { useState, useMemo, useEffect } from 'react';
import {
  Users, UserCog, ClipboardList, AlertTriangle, CheckCircle2,
  Clock, Plus, ArrowRightLeft, ShieldAlert, Search, Filter,
  Activity, Calendar, Pill, Sparkles, ChevronRight, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import {
  calculateAllCaregiverWorkloads,
  detectWorkloadImbalance,
  WORKLOAD_LEVELS
} from '../../utils/workloadUtils.js';
import CaregiverDetailsModal from './CaregiverDetailsModal.jsx';
import TaskAssignmentModal from './TaskAssignmentModal.jsx';
import WorkloadRebalanceModal from './WorkloadRebalanceModal.jsx';
import StatusBadge from '../StatusBadge.jsx';
import '../../styles/workload.css';

// Activities helper
function getStoredActivities() {
  try {
    const raw = localStorage.getItem('eldercare_activities_list');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// Medications helper
function getStoredMedications() {
  try {
    const raw = localStorage.getItem('eldercare_medications_list');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export default function CaregiverWorkloadBalancer() {
  const {
    caregivers = [],
    residents = [],
    careTasks = [],
    carePlans = [],
    appointments = [],
    emergencyAlerts = [],
    addCareTask,
    toggleCareTask,
    reassignCareTask,
  } = useApp();

  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [dutyFilter, setDutyFilter] = useState('all');
  const [successBanner, setSuccessBanner] = useState('');

  // Modals state
  const [selectedCaregiverWorkload, setSelectedCaregiverWorkload] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [preselectedCaregiverForTask, setPreselectedCaregiverForTask] = useState(null);
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);
  const [preselectedTaskForReassign, setPreselectedTaskForReassign] = useState(null);

  // Keep live clock refreshed
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  const activities = useMemo(() => getStoredActivities(), []);
  const storedMeds = useMemo(() => getStoredMedications(), []);

  // Compute all caregiver workloads dynamically using existing data
  const allWorkloads = useMemo(() => {
    return calculateAllCaregiverWorkloads(caregivers, {
      residents,
      careTasks,
      carePlans,
      appointments,
      medications: storedMeds,
      activities,
      emergencyAlerts,
      now,
    });
  }, [caregivers, residents, careTasks, carePlans, appointments, storedMeds, activities, emergencyAlerts, now]);

  // Keep selected caregiver workload object updated in real-time if open in modal
  useEffect(() => {
    if (selectedCaregiverWorkload) {
      const refreshed = allWorkloads.find((w) => w.caregiverId === selectedCaregiverWorkload.caregiverId);
      if (refreshed) setSelectedCaregiverWorkload(refreshed);
    }
  }, [allWorkloads, selectedCaregiverWorkload?.caregiverId]);

  // Imbalance Detection
  const imbalance = useMemo(() => {
    return detectWorkloadImbalance(allWorkloads);
  }, [allWorkloads]);

  // Filtering & Sorting
  const filteredWorkloads = useMemo(() => {
    return allWorkloads.filter((w) => {
      const matchSearch =
        (w.caregiverName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.role || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = levelFilter === 'all' || w.level.toLowerCase() === levelFilter.toLowerCase();
      const matchDuty =
        dutyFilter === 'all' ||
        (dutyFilter === 'on_duty' && (w.availability === 'On Duty' || w.availability === 'On Call'));
      return matchSearch && matchLevel && matchDuty;
    }).sort((a, b) => {
      // Show High workload first, then Moderate, then Low
      const order = { [WORKLOAD_LEVELS.HIGH]: 1, [WORKLOAD_LEVELS.MODERATE]: 2, [WORKLOAD_LEVELS.LOW]: 3 };
      if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
      return b.score - a.score;
    });
  }, [allWorkloads, searchQuery, levelFilter, dutyFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCaregivers = allWorkloads.length;
    const highCount = allWorkloads.filter((w) => w.level === WORKLOAD_LEVELS.HIGH).length;
    const modCount = allWorkloads.filter((w) => w.level === WORKLOAD_LEVELS.MODERATE).length;
    const lowCount = allWorkloads.filter((w) => w.level === WORKLOAD_LEVELS.LOW).length;
    const totalPending = allWorkloads.reduce((acc, w) => acc + w.pendingTaskCount, 0);
    const totalOverdue = allWorkloads.reduce((acc, w) => acc + w.overdueTaskCount, 0);
    const avgScore = totalCaregivers > 0
      ? Math.round((allWorkloads.reduce((acc, w) => acc + w.score, 0) / totalCaregivers) * 10) / 10
      : 0;

    return { totalCaregivers, highCount, modCount, lowCount, totalPending, totalOverdue, avgScore };
  }, [allWorkloads]);

  // Handlers
  const handleOpenAssignModal = (caregiver = null) => {
    setPreselectedCaregiverForTask(caregiver);
    setIsAssignModalOpen(true);
  };

  const handleOpenRebalanceModal = (task = null) => {
    setPreselectedTaskForReassign(task);
    setIsRebalanceModalOpen(true);
  };

  const handleTaskAssigned = async (taskData) => {
    const created = await addCareTask(taskData);
    setSuccessBanner(`Care task "${created.title}" successfully assigned to ${created.caregiver}! Workloads updated.`);
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  const handleTaskReassigned = async (taskId, newCaregiverName, reason) => {
    await reassignCareTask(taskId, newCaregiverName, reason);
    setSuccessBanner(`Task successfully reassigned to ${newCaregiverName}! Workload scores updated.`);
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  return (
    <div className="workload-container">
      {/* Success Notification Banner */}
      {successBanner && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            background: 'var(--wb-low-bg)',
            color: 'var(--wb-low-fg)',
            border: '1px solid var(--wb-low-border)',
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 600,
            animation: 'wbFadeIn 200ms ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="var(--wb-primary)" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wb-low-fg)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Panel with Quick Actions */}
      <div className="wb-header-panel">
        <div className="wb-title-group">
          <h2>
            <UserCog size={22} style={{ color: 'var(--wb-primary)' }} />
            Caregiver Workload Balancer
          </h2>
          <p>
            Real-time operational burden analysis across assigned residents, pending tasks, overdue items and facility schedules.
          </p>
        </div>

        <div className="wb-actions-group">
          {imbalance.hasImbalance && (
            <button
              type="button"
              className="wb-btn wb-btn-secondary"
              onClick={() => handleOpenRebalanceModal()}
              style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FCD34D' }}
            >
              <ArrowRightLeft size={15} />
              <span>Review Imbalance ({imbalance.overloadedCaregivers.length})</span>
            </button>
          )}

          <button
            type="button"
            className="wb-btn wb-btn-primary"
            onClick={() => handleOpenAssignModal()}
          >
            <Plus size={16} />
            <span>Assign Care Task</span>
          </button>
        </div>
      </div>

      {/* Imbalance Detection Alert Banner */}
      {imbalance.hasImbalance && (
        <div className={`wb-imbalance-banner ${imbalance.overloadedCaregivers.length > 0 ? 'high-severity' : ''}`}>
          <div className="wb-imbalance-info">
            <div className="wb-imbalance-icon">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="wb-imbalance-title">
                Potential Workload Imbalance Detected
              </div>
              <div className="wb-imbalance-desc">
                {imbalance.recommendation?.summaryText ||
                  `${imbalance.overloadedCaregivers.length} caregiver has High workload while others have available capacity.`}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="wb-btn wb-btn-primary wb-btn-sm"
            onClick={() => handleOpenRebalanceModal()}
          >
            <ArrowRightLeft size={13} />
            <span>Review &amp; Rebalance</span>
          </button>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="wb-kpi-grid">
        <div className="wb-kpi-card">
          <div className="wb-kpi-icon">
            <Users size={20} />
          </div>
          <div>
            <div className="wb-kpi-label">Active Caregivers</div>
            <div className="wb-kpi-value">{stats.totalCaregivers}</div>
            <div className="wb-kpi-sub">{allWorkloads.filter(w => w.availability === 'On Duty').length} on active duty</div>
          </div>
        </div>

        <div className="wb-kpi-card">
          <div className={`wb-kpi-icon ${stats.highCount > 0 ? 'warning' : ''}`}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="wb-kpi-label">High Workload Alerts</div>
            <div className="wb-kpi-value" style={{ color: stats.highCount > 0 ? '#DC2626' : 'var(--wb-text)' }}>
              {stats.highCount}
            </div>
            <div className="wb-kpi-sub">
              {stats.highCount > 0 ? 'Exceeds threshold (>18 pts)' : 'Normal distribution'}
            </div>
          </div>
        </div>

        <div className="wb-kpi-card">
          <div className="wb-kpi-icon">
            <ClipboardList size={20} />
          </div>
          <div>
            <div className="wb-kpi-label">Active Pending Tasks</div>
            <div className="wb-kpi-value">{stats.totalPending}</div>
            <div className="wb-kpi-sub">Across care staff</div>
          </div>
        </div>

        <div className="wb-kpi-card">
          <div className={`wb-kpi-icon ${stats.totalOverdue > 0 ? 'warning' : ''}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="wb-kpi-label">Overdue Care Tasks</div>
            <div className="wb-kpi-value" style={{ color: stats.totalOverdue > 0 ? '#DC2626' : 'var(--wb-text)' }}>
              {stats.totalOverdue}
            </div>
            <div className="wb-kpi-sub">
              {stats.totalOverdue > 0 ? 'Urgent attention required' : 'All tasks on schedule'}
            </div>
          </div>
        </div>

        <div className="wb-kpi-card">
          <div className="wb-kpi-icon">
            <Activity size={20} />
          </div>
          <div>
            <div className="wb-kpi-label">Avg Workload Score</div>
            <div className="wb-kpi-value">{stats.avgScore} <span style={{ fontSize: 13, fontWeight: 500 }}>pts</span></div>
            <div className="wb-kpi-sub">Baseline capacity ~14 pts</div>
          </div>
        </div>
      </div>

      {/* Horizontal Workload Visualization & Comparison */}
      <div className="wb-viz-panel">
        <div className="wb-viz-header">
          <h3>
            <Activity size={17} style={{ color: 'var(--wb-primary)' }} />
            Workload Comparison &amp; Distribution
          </h3>

          <div className="wb-distribution-pills">
            <span className="wb-dist-pill high">
              ● High: {stats.highCount}
            </span>
            <span className="wb-dist-pill moderate">
              ● Moderate: {stats.modCount}
            </span>
            <span className="wb-dist-pill low">
              ● Low: {stats.lowCount}
            </span>
          </div>
        </div>

        <div className="wb-comparison-list">
          {allWorkloads.map((w) => (
            <div
              key={w.caregiverId}
              className="wb-comparison-row"
              onClick={() => setSelectedCaregiverWorkload(w)}
              title={`Click to view detailed workload breakdown for ${w.caregiverName}`}
            >
              {/* Caregiver Name & Role */}
              <div className="wb-row-caregiver">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: w.theme.bg,
                    color: w.theme.fg,
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {w.initials}
                </div>
                <div>
                  <div className="wb-row-name">{w.caregiverName}</div>
                  <div className="wb-row-role">{w.role}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="wb-bar-track">
                <div
                  className={`wb-bar-fill ${w.level.toLowerCase()}`}
                  style={{ width: `${w.capacityPct}%` }}
                />
              </div>

              {/* Stats Summary */}
              <div className="wb-row-stats">
                <span><strong>{w.assignedResidentCount}</strong> res</span>
                <span>•</span>
                <span><strong>{w.pendingTaskCount}</strong> pending</span>
                {w.overdueTaskCount > 0 && (
                  <span style={{ color: '#DC2626', fontWeight: 700 }}>
                    ({w.overdueTaskCount} overdue)
                  </span>
                )}
              </div>

              {/* Level Badge */}
              <div style={{ textAlign: 'right' }}>
                <span className={`wb-badge ${w.level.toLowerCase()}`}>
                  {w.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="toolbar" style={{ marginTop: 4 }}>
        <div className="search-box">
          <Search size={15} />
          <input
            placeholder="Search caregiver workload by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search caregiver workload"
          />
        </div>

        <select
          className="filter-select"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          aria-label="Filter by workload level"
        >
          <option value="all">All Workload Levels</option>
          <option value="high">High Workload Only</option>
          <option value="moderate">Moderate Workload Only</option>
          <option value="low">Low Workload Only</option>
        </select>

        <select
          className="filter-select"
          value={dutyFilter}
          onChange={(e) => setDutyFilter(e.target.value)}
          aria-label="Filter by duty status"
        >
          <option value="all">All Duty Statuses</option>
          <option value="on_duty">On Duty &amp; On Call Only</option>
        </select>
      </div>

      {/* Care Team Workload Cards Grid */}
      <div className="wb-cards-grid">
        {filteredWorkloads.map((w) => {
          const isHigh = w.level === WORKLOAD_LEVELS.HIGH;
          const isModerate = w.level === WORKLOAD_LEVELS.MODERATE;

          return (
            <div
              key={w.caregiverId}
              className={`wb-card ${isHigh ? 'is-high' : isModerate ? 'is-moderate' : 'is-low'}`}
            >
              <div>
                {/* Card Header */}
                <div className="wb-card-header">
                  <div className="wb-card-identity">
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: w.theme.bg,
                        color: w.theme.fg,
                        border: `1px solid ${w.theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {w.initials}
                    </div>
                    <div>
                      <div className="wb-card-name">{w.caregiverName}</div>
                      <div className="wb-card-role">{w.role}</div>
                    </div>
                  </div>

                  <span className={`wb-badge ${w.level.toLowerCase()}`}>
                    {w.level}
                  </span>
                </div>

                {/* Overload Warning if High Workload */}
                {isHigh && (
                  <div className="wb-overload-alert">
                    <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>HIGH WORKLOAD:</strong> Currently has{' '}
                      <strong>{w.assignedResidentCount} assigned residents</strong>,{' '}
                      <strong>{w.pendingTaskCount} pending tasks</strong>, and{' '}
                      <strong>{w.overdueTaskCount} overdue tasks</strong>.
                      <div style={{ fontSize: 11, color: '#7F1D1D', marginTop: 2 }}>
                        Review workload before assigning another task.
                      </div>
                    </div>
                  </div>
                )}

                {/* Metrics Breakdown Table */}
                <div className="wb-card-metrics">
                  <div className="wb-metric-row">
                    <span className="wb-metric-label">
                      <Users size={13} />
                      Assigned Residents
                    </span>
                    <span className="wb-metric-val">
                      {w.assignedResidentCount} {w.assignedResidentCount === 1 ? 'Resident' : 'Residents'}
                    </span>
                  </div>

                  <div className="wb-metric-row">
                    <span className="wb-metric-label">
                      <ClipboardList size={13} />
                      Pending Care Tasks
                    </span>
                    <span className="wb-metric-val">
                      {w.pendingTaskCount} Tasks
                    </span>
                  </div>

                  <div className="wb-metric-row">
                    <span className="wb-metric-label">
                      <AlertTriangle size={13} color={w.overdueTaskCount > 0 ? '#DC2626' : 'currentColor'} />
                      Overdue Tasks
                    </span>
                    <span className={`wb-metric-val ${w.overdueTaskCount > 0 ? 'alert' : ''}`}>
                      {w.overdueTaskCount} Overdue
                    </span>
                  </div>

                  <div className="wb-metric-row">
                    <span className="wb-metric-label">
                      <Calendar size={13} />
                      Today's Appointments
                    </span>
                    <span className="wb-metric-val">
                      {w.appointmentCount} Scheduled
                    </span>
                  </div>

                  <div className="wb-metric-row">
                    <span className="wb-metric-label">
                      <Clock size={13} />
                      Shift &amp; Duty
                    </span>
                    <span className="wb-metric-val" style={{ fontSize: 11.5 }}>
                      {w.availability}
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="wb-capacity-block">
                  <div className="wb-capacity-head">
                    <span>Workload Score: <strong className="wb-capacity-score">{w.score} pts</strong></span>
                    <span>{w.capacityPct}% Capacity</span>
                  </div>
                  <div className="wb-bar-track">
                    <div
                      className={`wb-bar-fill ${w.level.toLowerCase()}`}
                      style={{ width: `${w.capacityPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="wb-card-actions">
                <button
                  type="button"
                  className="wb-btn wb-btn-outline wb-btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedCaregiverWorkload(w)}
                >
                  View Breakdown
                </button>
                <button
                  type="button"
                  className="wb-btn wb-btn-primary wb-btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleOpenAssignModal(w)}
                >
                  <Plus size={13} />
                  <span>Assign Task</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredWorkloads.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: 48,
              textAlign: 'center',
              background: '#FFF',
              border: '1px solid var(--wb-border)',
              borderRadius: 12,
              color: 'var(--wb-muted-text)',
            }}
          >
            <UserCog size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--wb-text)' }}>
              No Caregivers Found
            </h4>
            <p style={{ margin: 0, fontSize: 13 }}>
              No caregivers match the selected workload filters or search term.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: CAREGIVER DETAILS BREAKDOWN */}
      {selectedCaregiverWorkload && (
        <CaregiverDetailsModal
          workload={selectedCaregiverWorkload}
          onClose={() => setSelectedCaregiverWorkload(null)}
          onToggleTask={toggleCareTask}
          onOpenReassignTask={(task) => {
            setSelectedCaregiverWorkload(null);
            handleOpenRebalanceModal(task);
          }}
        />
      )}

      {/* MODAL 2: ASSIGN CARE TASK */}
      <TaskAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setPreselectedCaregiverForTask(null);
        }}
        residents={residents}
        caregiverWorkloads={allWorkloads}
        onAssignTask={handleTaskAssigned}
        preselectedCaregiver={preselectedCaregiverForTask}
      />

      {/* MODAL 3: WORKLOAD REBALANCING */}
      <WorkloadRebalanceModal
        isOpen={isRebalanceModalOpen}
        onClose={() => {
          setIsRebalanceModalOpen(false);
          setPreselectedTaskForReassign(null);
        }}
        overloadedCaregiver={imbalance.recommendation?.source || allWorkloads.find(w => w.level === WORKLOAD_LEVELS.HIGH)}
        caregiverWorkloads={allWorkloads}
        onReassignTask={handleTaskReassigned}
        preselectedTask={preselectedTaskForReassign}
      />
    </div>
  );
}
