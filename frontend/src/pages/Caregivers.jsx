import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Phone, Clock, Users2, Plus, UserPlus, X, AlertCircle,
  CheckCircle2, Trash2, ToggleLeft, ToggleRight, ArrowUpDown, Activity,
  Users, Pill, CalendarClock, ClipboardCheck, Bell, Sunrise, ShieldAlert,
  ClipboardList, Sparkles, NotebookPen, ArrowUpRight, Check, AlertTriangle, FileText, GitFork, MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PatientIdentity from '../components/PatientIdentity.jsx';
import CaregiverWorkloadBalancer from '../components/workload/CaregiverWorkloadBalancer.jsx';
import { getScopedResidents, scopeByResident } from '../utils/scope.js';
import { toISODate } from '../utils/dateUtils.js';
import { calculateCaregiverWorkload, WORKLOAD_LEVELS } from '../utils/workloadUtils.js';
import { appointments as defaultAppointments, medications as defaultMedications, dailySchedule, elderlyResidents } from '../data/dummyData';
import { openWhatsApp, formatCaregiverWhatsAppMessage } from '../utils/whatsapp.js';
import Pagination from '../components/Pagination.jsx';
import '../styles/workload.css';

function highlightMatch(text = '', query = '') {
  if (!query || !query.trim() || !text) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const DEFAULT_ROLES = [
  'Senior Caregiver',
  'Care Assistant',
  'Registered Nurse',
  'Physiotherapist',
  'Care Coordinator',
  'Specialist Nurse'
];

const SHIFT_OPTIONS = [
  'Morning · 7:00 AM – 3:00 PM',
  'Afternoon · 3:00 PM – 11:00 PM',
  'Night · 11:00 PM – 7:00 AM',
  'General · 9:00 AM – 5:00 PM',
  'Visits · Flexible'
];

const INITIAL_FORM = {
  name: '',
  role: 'Care Assistant',
  experience: '3 years',
  shift: 'Morning · 7:00 AM – 3:00 PM',
  availability: 'On Duty',
  status: 'active',
  phone: '+91 ',
};

export default function Caregivers({ isDashboard = false }) {
  const navigate = useNavigate();
  const {
    user,
    caregivers = [],
    addCaregiver,
    updateCaregiver,
    deleteCaregiver,
    residents: allResidents = [],
    careTasks = [],
    carePlans = [],
    appointments: apptList = [],
    emergencyAlerts = [],
    notificationList = [],
    pushMedicationReminder,
    toggleCareTask,
    t
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: If role is caregiver or isDashboard flag is set, default to 'operations'
  const isCaregiverUser = user?.role === 'caregiver';
  const paramTab = searchParams.get('tab');
  const defaultTab = (isCaregiverUser || isDashboard) ? 'operations' : 'directory';
  const activeTab = paramTab || defaultTab;

  const setTab = (tab) => {
    setSearchParams(tab === defaultTab ? {} : { tab });
  };

  // Clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  const todayISO = toISODate(now);

  // Scoped Data for Caregiver Operations
  const scopedResidents = useMemo(() => getScopedResidents(user, allResidents), [user, allResidents]);
  const activeResidentsList = scopedResidents.length > 0 ? scopedResidents : allResidents;
  const activeResidentIds = useMemo(() => new Set(activeResidentsList.map((r) => r.id)), [activeResidentsList]);

  // Scoped Medications
  const scopedMedications = useMemo(() => {
    const list = defaultMedications || [];
    if (user?.role === 'caregiver') {
      return list.filter((m) => activeResidentIds.has(m.patientId));
    }
    return list;
  }, [user, defaultMedications, activeResidentIds]);

  // Scoped Appointments for Today
  const scopedTodayAppointments = useMemo(() => {
    const list = apptList.length > 0 ? apptList : defaultAppointments;
    return list.filter((a) => a.date === todayISO && (user?.role !== 'caregiver' || activeResidentIds.has(a.patientId)));
  }, [apptList, defaultAppointments, todayISO, user, activeResidentIds]);

  // Caregiver Profile for Personal Workload
  const currentCaregiver = useMemo(() => {
    const cgName = (user?.caregiverName || user?.name || '').trim().toLowerCase();
    return (
      caregivers.find((c) => (c.name || '').trim().toLowerCase() === cgName) || {
        id: user?.id || 'CG-USER',
        name: user?.name || 'Caregiver',
        role: user?.title || 'Senior Caregiver',
        shift: 'Morning · 7:00 AM – 3:00 PM',
        availability: 'On Duty',
        status: 'active',
      }
    );
  }, [caregivers, user]);

  // Calculate Operational Workload
  const myWorkload = useMemo(() => {
    return calculateCaregiverWorkload(currentCaregiver, {
      residents: allResidents,
      careTasks,
      carePlans,
      appointments: apptList.length > 0 ? apptList : defaultAppointments,
      medications: scopedMedications,
      emergencyAlerts,
      now,
    });
  }, [currentCaregiver, allResidents, careTasks, carePlans, apptList, scopedMedications, emergencyAlerts, now]);

  // Centralized Care Tasks Filtered for this Caregiver / Residents
  const filteredCareTasks = useMemo(() => {
    const cgName = (user?.caregiverName || user?.name || '').trim().toLowerCase();
    const assignedResIds = new Set(activeResidentsList.map((r) => r.id));
    const filtered = careTasks.filter((task) => {
      const isDirect = (task.caregiver || '').trim().toLowerCase() === cgName;
      const isRes = task.residentId && assignedResIds.has(task.residentId);
      return isDirect || isRes;
    });

    if (filtered.length > 0) return filtered;
    return careTasks.slice(0, 6);
  }, [careTasks, user, activeResidentsList]);

  const completedTasksCount = filteredCareTasks.filter((t) => t.status === 'completed' || t.done).length;
  const completionPercentage = filteredCareTasks.length > 0 ? Math.round((completedTasksCount / filteredCareTasks.length) * 100) : 100;
  const pendingMedicationsCount = scopedMedications.filter((m) => m.status === 'pending' || m.status === 'missed').length;

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState(null);

  const handleSendReminder = (targetMed) => {
    const med = targetMed || scopedMedications[0];
    if (!med) return;
    pushMedicationReminder(med, {
      senderRole: 'caregiver',
      senderName: user?.name,
      patientId: med.patientId,
      patient: med.patient,
      caregiver: user?.name,
    });
    setToastMessage(`✓ Medication reminder dispatched to ${med.patient}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Staff Directory State
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchWrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const roles = useMemo(() => {
    const list = new Set([...DEFAULT_ROLES, ...caregivers.map((c) => c.role).filter(Boolean)]);
    return ['all', ...Array.from(list)];
  }, [caregivers]);

  const filteredDirectory = useMemo(() => {
    let list = caregivers.filter((c) => {
      const matchQuery =
        (c.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (c.role || '').toLowerCase().includes(query.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(query.toLowerCase());
      const matchRole = roleFilter === 'all' || c.role === roleFilter;
      const matchAvail =
        availabilityFilter === 'all' ||
        (c.availability || '').toLowerCase().replace(/\s+/g, '_') === availabilityFilter.toLowerCase();
      return matchQuery && matchRole && matchAvail;
    });

    list.sort((a, b) => {
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'role') return (a.role || '').localeCompare(b.role || '');
      if (sortBy === 'experience') {
        const expA = parseInt(a.experience, 10) || 0;
        const expB = parseInt(b.experience, 10) || 0;
        return expB - expA;
      }
      if (sortBy === 'availability') {
        const order = { 'On Duty': 1, 'On Call': 2, 'Off Duty': 3 };
        return (order[a.availability] || 4) - (order[b.availability] || 4);
      }
      return 0;
    });

    return list;
  }, [caregivers, query, roleFilter, availabilityFilter, sortBy]);

  // Directory Pagination
  const [dirPage, setDirPage] = useState(1);
  const [dirLimit, setDirLimit] = useState(6);

  useEffect(() => {
    setDirPage(1);
  }, [query, roleFilter, availabilityFilter, sortBy]);

  const dirTotalPages = Math.ceil(filteredDirectory.length / dirLimit) || 1;
  const paginatedDirectory = useMemo(() => {
    const start = (dirPage - 1) * dirLimit;
    return filteredDirectory.slice(start, start + dirLimit);
  }, [filteredDirectory, dirPage, dirLimit]);

  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM);
    setError('');
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter the caregiver full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim() === '+91') {
      setError('Please enter a valid contact phone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const created = await addCaregiver({
        name: formData.name.trim(),
        role: formData.role.trim(),
        experience: formData.experience.trim() || '1 year',
        shift: formData.shift,
        availability: formData.availability,
        status: formData.availability === 'Off Duty' ? 'inactive' : 'active',
        phone: formData.phone.trim(),
        assigned: 0,
      });

      setIsSubmitting(false);
      setIsAddModalOpen(false);
      setSuccessMessage(`Caregiver "${created?.name || formData.name}" has been successfully added to the staff directory!`);
      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (err) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to save caregiver. Please try again.');
    }
  };

  const handleToggleDuty = async (c) => {
    const isCurrentlyOnDuty = (c.availability || '').toLowerCase() === 'on duty';
    const nextAvailability = isCurrentlyOnDuty ? 'Off Duty' : 'On Duty';
    const nextStatus = isCurrentlyOnDuty ? 'inactive' : 'active';
    await updateCaregiver(c.id, {
      availability: nextAvailability,
      status: nextStatus,
    });
  };

  const handleDeleteCaregiver = async (id, name) => {
    try {
      await deleteCaregiver(id);
      setDeleteConfirmId(null);
      setSuccessMessage(`Caregiver "${name}" was removed from the directory.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Assigned Residents', value: activeResidentsList.length, icon: Users, color: '#0066CC' },
    { label: 'Care Tasks Today', value: `${completedTasksCount}/${filteredCareTasks.length}`, icon: ClipboardCheck, color: '#059669' },
    { label: 'Medications Pending', value: pendingMedicationsCount, icon: Pill, color: '#D97706' },
    { label: "Today's Appointments", value: scopedTodayAppointments.length, icon: CalendarClock, color: '#7C3AED' },
  ];

  return (
    <div>
      {/* Toast Feedback */}
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

      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: 18 }}>
        <div>
          <h1>Caregivers</h1>
          <p className="desc">
            Complete caregiver coordination &mdash; operational daily care, task schedule, staff directory and workload management.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>Add Caregiver</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Switcher */}
      <div className="caregivers-nav-tabs" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`caregivers-nav-tab ${activeTab === 'operations' ? 'active' : ''}`}
          onClick={() => setTab('operations')}
        >
          <ClipboardCheck size={16} />
          <span>Daily Care & Operations</span>
          {myWorkload?.pendingTaskCount > 0 && (
            <span className="tab-badge" style={{ background: '#E0F2FE', color: '#0066CC' }}>
              {myWorkload.pendingTaskCount} Tasks
            </span>
          )}
        </button>

        <button
          type="button"
          className={`caregivers-nav-tab ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setTab('directory')}
        >
          <Users2 size={16} />
          <span>Staff Directory & Shifts</span>
          <span className="tab-badge">{caregivers.length}</span>
        </button>

        <button
          type="button"
          className={`caregivers-nav-tab ${activeTab === 'workload' ? 'active' : ''}`}
          onClick={() => setTab('workload')}
        >
          <Activity size={16} />
          <span>Caregiver Workload Balancer</span>
          <span className="tab-badge" style={{ background: 'var(--wb-soft)', color: 'var(--wb-deep)' }}>
            Dynamic Load
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: CARE OPERATIONS & DAILY TASKS (Merged from Dashboard)
          ======================================================== */}
      {activeTab === 'operations' && (
        <div className="care-operations-view">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div>
              <div className="w-date" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sunrise size={13} style={{ verticalAlign: 'text-bottom' }} />
                <span>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span>·</span>
                <Clock size={12} style={{ color: '#E0F2FE', verticalAlign: 'text-bottom' }} />
                <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <h1>{greeting}, {user?.name ? user.name.split(' ')[0] : 'Caregiver'}</h1>
              <p>
                You have clinical oversight of {activeResidentsList.length} resident{activeResidentsList.length !== 1 ? 's' : ''} today. {completedTasksCount} of {filteredCareTasks.length} daily care tasks completed.
              </p>
            </div>
            <button className="btn btn-terracotta" onClick={() => handleSendReminder()} disabled={!scopedMedications[0]}>
              <Bell size={15} /> Send Reminder to Patient
            </button>
          </div>

          {/* 4 Quick Stat Cards */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            {stats.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon" style={{ color: s.color }}><s.icon size={17} /></div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Personal Workload Card */}
          {myWorkload && (
            <div className="panel" style={{ padding: '18px 22px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: myWorkload.theme.bg,
                      color: myWorkload.theme.fg,
                      border: `1px solid ${myWorkload.theme.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--wb-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      My Operational Workload
                      <span className={`wb-badge ${myWorkload.level.toLowerCase()}`}>
                        {myWorkload.level} WORKLOAD
                      </span>
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--wb-muted-text)', marginTop: 2 }}>
                      Workload score: <strong>{myWorkload.score} pts</strong> ({myWorkload.capacityPct}% capacity index)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="eyebrow mono" style={{ fontSize: 11.5 }}>
                    ● Real-time sync active
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="wb-bar-track" style={{ height: 8, marginBottom: 14 }}>
                <div
                  className={`wb-bar-fill ${myWorkload.level.toLowerCase()}`}
                  style={{ width: `${myWorkload.capacityPct}%` }}
                />
              </div>

              {/* Workload Metric Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div style={{ background: 'var(--wb-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--wb-muted-text)' }}>Assigned Residents:</span>{' '}
                  <strong style={{ color: 'var(--wb-text)' }}>{myWorkload.assignedResidentCount}</strong>
                </div>

                <div style={{ background: 'var(--wb-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--wb-muted-text)' }}>Pending Tasks:</span>{' '}
                  <strong style={{ color: 'var(--wb-text)' }}>{myWorkload.pendingTaskCount}</strong>
                </div>

                <div style={{ background: myWorkload.overdueTaskCount > 0 ? '#FEE2E2' : 'var(--wb-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: myWorkload.overdueTaskCount > 0 ? '#991B1B' : 'var(--wb-muted-text)' }}>Overdue Tasks:</span>{' '}
                  <strong style={{ color: myWorkload.overdueTaskCount > 0 ? '#DC2626' : 'var(--wb-text)' }}>
                    {myWorkload.overdueTaskCount}
                  </strong>
                </div>

                <div style={{ background: 'var(--wb-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--wb-muted-text)' }}>Today's Appts:</span>{' '}
                  <strong style={{ color: 'var(--wb-text)' }}>{myWorkload.appointmentCount}</strong>
                </div>
              </div>

              {myWorkload.level === WORKLOAD_LEVELS.HIGH && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#991B1B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>High Workload Active:</strong> You currently have {myWorkload.pendingTaskCount} pending tasks and {myWorkload.overdueTaskCount} overdue items. Administration has visibility to assist with workload rebalancing.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Main Two-Column Operations Layout */}
          <div className="dash-grid">
            {/* Left Stack: Care Tasks, Medication Tasks, Care Plans, Handover */}
            <div className="stack-gap">
              {/* Daily Care Tasks Panel */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Today&rsquo;s Care Tasks</h3>
                    <div className="sub">{completionPercentage}% complete ({completedTasksCount}/{filteredCareTasks.length} tasks)</div>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="progress-row" style={{ marginBottom: 16 }}>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${completionPercentage}%` }} /></div>
                    <span className="progress-pct">{completionPercentage}%</span>
                  </div>

                  {filteredCareTasks.map((t) => {
                    const isDone = t.status === 'completed' || t.done;
                    const isOverdue = t.status === 'overdue' || t.isOverdue;
                    return (
                      <div
                        className={`plan-task ${isDone ? 'done' : ''}`}
                        key={t.id}
                        style={{
                          cursor: 'pointer',
                          background: isOverdue && !isDone ? '#FFF5F5' : undefined,
                          border: isOverdue && !isDone ? '1px solid #FED7D7' : undefined,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 8,
                        }}
                        onClick={() => toggleCareTask(t.id)}
                        title="Click to toggle completed / pending"
                      >
                        <span className="chk">{isDone ? '✓' : ''}</span>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{t.title || t.label}</span>
                            {t.residentName && (
                              <span style={{ fontSize: 11, color: 'var(--wb-muted-text)', marginLeft: 8 }}>
                                ({t.residentName} · Due: {t.dueTime || 'Today'})
                              </span>
                            )}
                          </div>
                          {isOverdue && !isDone && (
                            <span style={{ fontSize: 10, background: '#FEE2E2', color: '#991B1B', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Medication Tasks Panel */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Medication Tasks & Doses</h3>
                    <div className="sub">Prescribed doses for assigned residents</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/medications')}>
                    View all medications
                  </button>
                </div>
                <div className="panel-body" style={{ padding: '8px 16px' }}>
                  {scopedMedications.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border-hairline)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>
                          {m.medicine} · <span style={{ color: 'var(--color-forest)', fontSize: 12 }}>{m.dosage}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {m.patient} · {m.time} ({m.slot})
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusBadge status={m.status || 'pending'} />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleSendReminder(m)}
                          title="Remind Patient"
                          style={{ padding: '4px 8px' }}
                        >
                          <Bell size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Care Plans & Care Instructions */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Care Plans & Instructions</h3>
                    <div className="sub">Active goals and daily caregiver directives</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/care-plans')}>
                    Full Plans
                  </button>
                </div>
                <div className="panel-body" style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {carePlans.slice(0, 3).map((cp) => (
                    <div key={cp.id} style={{ padding: '12px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ fontSize: 13.5, color: '#0F172A' }}>{cp.patient}</strong>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0066CC' }}>{cp.progress}% complete</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 6 }}>
                        🎯 {cp.goal}
                      </div>
                      <div style={{ height: 5, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${cp.progress}%`, background: '#0066CC', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Care Handover & Shift Notes */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Care & Handover Notes</h3>
                    <div className="sub">Briefing for oncoming shift and clinical transitions</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/documents')}>
                    All Notes
                  </button>
                </div>
                <div className="panel-body" style={{ padding: '14px 18px' }}>
                  <div style={{ padding: '10px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, fontSize: 12.5, color: '#0369A1', marginBottom: 10 }}>
                    <strong>Shift Handover Briefing:</strong> All morning vital rounds completed. Resident Subramaniam Iyer is under close monitoring. No unexpected incidents during the current shift.
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/documents')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <NotebookPen size={13} />
                    <span>File New Handover Note</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Stack: Assigned Residents, Schedule, Appointments & Notifications */}
            <div className="stack-gap">
              {/* Assigned Residents */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Assigned Elderly Residents</h3>
                    <div className="sub">Residents under your direct daily care</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate('/care-dependency-map')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                      title="View Care Dependency Map for assigned residents"
                    >
                      <GitFork size={13} />
                      <span>Dependency Map</span>
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/elderly')}>View all</button>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="mini-status-list">
                    {activeResidentsList.map((r) => (
                      <div
                        className="mini-status-row"
                        key={r.id}
                        style={{ cursor: 'pointer', padding: '10px 12px' }}
                        onClick={() => navigate(`/elderly/${r.id}`)}
                      >
                        <PatientIdentity initials={r.initials} name={r.name} meta={`${r.id} · ${r.room}`} size="sm" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: '#64748B' }}>{r.condition?.split(',')[0]}</span>
                          <StatusBadge status={r.status} />
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '3px 6px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/care-dependency-map?residentId=${r.id}`);
                            }}
                            title={`Open ${r.name}'s Care Dependency Map`}
                          >
                            <GitFork size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {activeResidentsList.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 14 }}>
                        No residents are currently assigned to you.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Schedule */}
              <div className="panel">
                <div className="panel-header"><h3>Facility Daily Schedule</h3></div>
                <div className="panel-body">
                  <div className="timeline">
                    {dailySchedule.slice(0, 4).map((item, i) => (
                      <div className={`timeline-item ${i < 2 ? 'is-done' : i === 2 ? 'is-current' : ''}`} key={item.title}>
                        <div className="timeline-dot" />
                        <div className="timeline-time">{item.time}</div>
                        <div className="timeline-title">{item.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Today's Consultations</h3>
                    <div className="sub">Doctor visits scheduled for your residents</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>View all</button>
                </div>
                <div className="panel-body" style={{ padding: '8px 16px' }}>
                  {scopedTodayAppointments.length > 0 ? (
                    scopedTodayAppointments.slice(0, 4).map((a) => (
                      <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{a.patient}</div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>{a.time} · {a.type} ({a.doctor})</div>
                        </div>
                        <StatusBadge status={a.status || 'confirmed'} />
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748B', fontSize: 12.5, padding: '12px 0' }}>
                      No doctor appointments scheduled for your assigned residents today.
                    </div>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="panel">
                <div className="panel-header">
                  <h3>Notifications & Alerts</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notifications')}>View all</button>
                </div>
                <div>
                  {notificationList.slice(0, 3).map((n) => (
                    <div className="notif-item" key={n.id} style={{ padding: '12px 20px' }}>
                      <div className="n-icon"><CheckCircle2 size={15} /></div>
                      <div className="n-body">
                        <div className="n-title">{n.title}</div>
                        <div className="n-meta">{n.time} {n.patient ? `· ${n.patient}` : ''}</div>
                      </div>
                    </div>
                  ))}
                  {notificationList.length === 0 && (
                    <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>No notifications right now.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: STAFF DIRECTORY & SHIFTS (from Caregivers.jsx)
          ======================================================== */}
      {activeTab === 'directory' && (
        <>
          {/* Success Banner */}
          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                borderRadius: 10,
                marginBottom: 18,
                fontSize: 13.5,
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} color="#059669" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', display: 'flex' }}
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Search & Filter & Sort Toolbar */}
          <div className="toolbar" style={{ marginBottom: 18 }}>
            <div className="search-box-wrapper" ref={searchWrapRef}>
              <div className="search-box">
                <Search size={15} />
                <input
                  placeholder="Search caregivers by name, role or phone"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsDropdownOpen(false);
                  }}
                  aria-label="Search caregivers"
                />
                {query && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="toolbar-filters">
              <select
                className="select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r === 'all' ? 'All Roles' : r}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                aria-label="Filter by availability"
              >
                <option value="all">All Availability</option>
                <option value="on_duty">On Duty</option>
                <option value="on_call">On Call</option>
                <option value="off_duty">Off Duty</option>
              </select>

              <select
                className="select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort caregivers"
              >
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="role">Role</option>
                <option value="experience">Experience</option>
                <option value="availability">Availability</option>
              </select>
            </div>
          </div>

          {/* Caregiver Cards Grid */}
          <div className="card-grid">
            {paginatedDirectory.map((c) => {
              const isOnDuty = (c.availability || '').toLowerCase() === 'on duty';
              return (
                <div key={c.id} className="caregiver-card" style={{ position: 'relative' }}>
                  <div className="cg-head">
                    <div className="cg-avatar tone-forest">
                      {c.initials || (c.name || 'C').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="cg-meta">
                      <h3>{highlightMatch(c.name, query)}</h3>
                      <div className="cg-role">{highlightMatch(c.role, query)}</div>
                    </div>
                  </div>

                  <div className="cg-body">
                    <div className="cg-row">
                      <Clock size={14} className="cg-icon" />
                      <span className="cg-val">{c.experience || '3 years'} experience</span>
                    </div>
                    <div className="cg-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={14} className="cg-icon" />
                        <a href={`tel:${c.phone}`} className="cg-val cg-link">
                          {highlightMatch(c.phone || '+91 98400 12345', query)}
                        </a>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 6px', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                        onClick={() => openWhatsApp(c.phone || '+91 98400 12345', formatCaregiverWhatsAppMessage({ caregiverName: c.name, message: 'Care coordination inquiry from ElderCare.' }))}
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare size={13} style={{ color: '#25D366' }} /> WhatsApp
                      </button>
                    </div>
                    <div className="cg-row">
                      <Users2 size={14} className="cg-icon" />
                      <span className="cg-val">
                        <strong>{c.assigned ?? 0}</strong> resident{(c.assigned ?? 0) !== 1 ? 's' : ''} assigned
                      </span>
                    </div>
                    <div className="cg-row">
                      <span className="cg-val" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Shift: {c.shift || 'Morning · 7:00 AM – 3:00 PM'}
                      </span>
                    </div>
                  </div>

                  <div className="cg-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                    <StatusBadge status={c.availability || 'On Duty'} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleToggleDuty(c)}
                        title={isOnDuty ? 'Mark Off Duty' : 'Mark On Duty'}
                        style={{ fontSize: 12 }}
                      >
                        {isOnDuty ? <ToggleRight size={18} color="#059669" /> : <ToggleLeft size={18} color="#94A3B8" />}
                      </button>

                      {deleteConfirmId === c.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteCaregiver(c.id, c.name)}
                            style={{ padding: '2px 8px', fontSize: 11 }}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDeleteConfirmId(null)}
                            style={{ padding: '2px 6px', fontSize: 11 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteConfirmId(c.id)}
                          title="Remove Caregiver"
                          style={{ padding: 6, color: '#EF4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Directory Pagination */}
          {filteredDirectory.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Pagination
                page={dirPage}
                totalPages={dirTotalPages}
                total={filteredDirectory.length}
                limit={dirLimit}
                onPageChange={setDirPage}
                onLimitChange={setDirLimit}
                showInfo={true}
                showPageSize={true}
              />
            </div>
          )}

          {filteredDirectory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              No caregivers found matching your criteria.
            </div>
          )}
        </>
      )}

      {/* ========================================================
          TAB 3: CAREGIVER WORKLOAD BALANCER
          ======================================================== */}
      {activeTab === 'workload' && <CaregiverWorkloadBalancer />}

      {/* Add Caregiver Modal */}
      {isAddModalOpen && (
        <div className="doc-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="doc-modal-container" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-head">
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Add Caregiver</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="doc-modal-body">
                {error && (
                  <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Radhika Sundaram"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Role Designation *</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {DEFAULT_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Shift *</label>
                  <select
                    className="form-control"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  >
                    {SHIFT_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>Contact Phone *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91 98400 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="doc-modal-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Caregiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
