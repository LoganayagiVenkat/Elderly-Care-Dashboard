import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Users, CalendarClock, Clock, AlertTriangle, ShieldAlert,
  ClipboardList, Pill, HeartPulse, CheckCircle2, XCircle, ArrowUpRight,
  Phone, Mail, Building2, Award, ChevronRight, Activity, Calendar,
  FileText, ArrowRight, RefreshCw, Eye, Sparkles, Filter, Siren,
  Check, X, GitFork
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { specialistsApi, appointmentsApi, emergencyApi, careRecordsApi } from '../../services/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PatientIdentity from '../../components/PatientIdentity.jsx';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, residents: allResidents = [], appointments: contextAppts = [], t } = useApp();
  const isAdmin = user?.role === 'admin';

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Doctor Selector (Default: user doctor or DOC-00 Chief Medical Officer)
  const initialDoctorId = user?.role === 'doctor' ? (user?.doctorId || 'DOC-00') : 'all';
  const [selectedDocId, setSelectedDocId] = useState(initialDoctorId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Active sub-filters & views
  const [residentFilter, setResidentFilter] = useState('all'); // 'all' | 'critical' | 'attention' | 'stable'
  const [appointmentTab, setAppointmentTab] = useState('today'); // 'today' | 'upcoming' | 'all'
  const [actionFeedback, setActionFeedback] = useState('');

  // Complete Care History Modal State
  const [activeHistoryResident, setActiveHistoryResident] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Emergency Response Modal State
  const [activeEmergencyModal, setActiveEmergencyModal] = useState(null);
  const [clinicalResponseNotes, setClinicalResponseNotes] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Fetch full doctor dashboard from MySQL backend API
  const fetchDashboardData = useCallback(async (docId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await specialistsApi.getDoctorDashboard({
        doctorId: docId,
        doctorName: user?.role === 'doctor' ? user?.name : undefined
      });
      if (res && res.success && res.data) {
        setDashboardData(res.data);
      } else {
        setError('Failed to load doctor dashboard data.');
      }
    } catch (err) {
      console.warn('[DoctorDashboard] API fetch warning, fallback to local data:', err.message);
      setError(err?.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData(selectedDocId);
  }, [selectedDocId, fetchDashboardData]);

  // Open Complete Care History Modal for a Resident
  const handleOpenHistory = async (resident) => {
    setActiveHistoryResident(resident);
    setLoadingHistory(true);
    try {
      const res = await careRecordsApi.getByResident(resident.id);
      if (res && res.success && Array.isArray(res.data)) {
        setHistoryRecords(res.data);
      } else if (resident.recentRecords && resident.recentRecords.length > 0) {
        setHistoryRecords(resident.recentRecords);
      } else {
        setHistoryRecords([]);
      }
    } catch (err) {
      console.warn('Failed to load resident history:', err);
      setHistoryRecords(resident.recentRecords || []);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Confirm or Complete Appointment
  const handleUpdateAppointmentStatus = async (apptId, nextStatus) => {
    try {
      await appointmentsApi.updateStatus(apptId, nextStatus);
      setActionFeedback(`Appointment #${apptId} marked as ${nextStatus}.`);
      setTimeout(() => setActionFeedback(''), 4000);
      fetchDashboardData(selectedDocId);
    } catch (err) {
      console.error('Failed to update appointment:', err);
    }
  };

  // Respond to Emergency Alert
  const handleEmergencyResponse = async (e) => {
    e.preventDefault();
    if (!activeEmergencyModal) return;
    try {
      setIsSubmittingResponse(true);
      const responder = user?.name || 'Dr. Arun Ramanathan, CMO';
      await emergencyApi.respond(activeEmergencyModal.id, responder);
      if (clinicalResponseNotes.trim()) {
        await emergencyApi.resolve(activeEmergencyModal.id, clinicalResponseNotes.trim());
      }
      setIsSubmittingResponse(false);
      setActiveEmergencyModal(null);
      setClinicalResponseNotes('');
      setActionFeedback(`Emergency #${activeEmergencyModal.id} has been reviewed and responded.`);
      setTimeout(() => setActionFeedback(''), 5000);
      fetchDashboardData(selectedDocId);
    } catch (err) {
      setIsSubmittingResponse(false);
      console.error('Emergency response failed:', err);
    }
  };

  // Extracted Data from API response
  const doctor = dashboardData?.doctor || {
    name: user?.name || 'Dr. Arun Ramanathan',
    title: user?.title || 'Chief Medical Officer & Cardiologist',
    specialty: 'Cardiology & General Medicine',
    hospital: 'ElderCare Central Medical Center & Fortis Heart Center',
    phone: '+91 98400 12345',
    email: user?.email || 'dr.arun@eldercare.demo',
    experience: '20 years',
    availability: 'Available'
  };

  const metrics = dashboardData?.metrics || {
    assignedResidentsCount: allResidents.length,
    todaysAppointmentsCount: 0,
    upcomingAppointmentsCount: 0,
    pendingFollowupsCount: 0,
    emergencyCasesCount: 0,
    activeCarePlansCount: 0,
    criticalResidentsCount: allResidents.filter(r => r.status === 'critical').length,
    attentionResidentsCount: allResidents.filter(r => r.status === 'attention').length,
    activePrescriptionsCount: 0,
    availableSlotsCount: 12
  };

  const assignedResidents = dashboardData?.assignedResidents || [];
  const todaysAppointments = dashboardData?.todaysAppointments || [];
  const upcomingAppointments = dashboardData?.upcomingAppointments || [];
  const pendingFollowups = dashboardData?.pendingFollowups || [];
  const emergencyCases = dashboardData?.emergencyCases || [];
  const activeCarePlans = dashboardData?.activeCarePlans || [];
  const recentHealthUpdates = dashboardData?.recentHealthUpdates || [];
  const medicationsOverview = dashboardData?.medicationsOverview || [];
  const availabilitySchedule = dashboardData?.availability || [];
  const allSpecialists = dashboardData?.allSpecialists || [];

  // Filtered Residents for display
  const filteredResidents = useMemo(() => {
    if (residentFilter === 'all') return assignedResidents;
    return assignedResidents.filter(r => r.status === residentFilter);
  }, [assignedResidents, residentFilter]);

  // Greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="doctor-dashboard">
      {/* Action Notification Toast */}
      {actionFeedback && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 28,
            zIndex: 99999,
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
            fontWeight: 600,
            borderLeft: '4px solid #10B981',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="doc-hero-banner">
        <div className="doc-hero-left">
          <div className="doc-hero-badge">
            <Stethoscope size={13} />
            <span>Clinical Doctor Station</span>
            <span>·</span>
            <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <h1 className="doc-hero-title">
            {greeting}, {doctor.name.split(' ')[0]} {doctor.name.split(' ')[1] || ''}
          </h1>
          <p className="doc-hero-desc">
            {doctor.title} &mdash; Direct clinical oversight for {metrics.assignedResidentsCount} residents with {metrics.todaysAppointmentsCount} consultations scheduled today.
          </p>
        </div>

        <div className="doc-hero-actions">
          {/* Doctor Switcher for Admin / CMO */}
          {(isAdmin || user?.role === 'doctor') && allSpecialists.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#E0F2FE' }}>
                {isAdmin ? 'Select Doctor View:' : 'Specialty Filter:'}
              </span>
              <select
                className="doc-select-box"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                aria-label="Filter doctor profile"
              >
                {isAdmin && <option value="all">Facility-wide Clinical Overview (All Doctors)</option>}
                {allSpecialists.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} · {doc.specialty}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/care-dependency-map')}
            title="Open Care Dependency Map"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.3)' }}
          >
            <GitFork size={14} />
            <span>Care Dependency Map</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchDashboardData(selectedDocId)}
            title="Refresh clinical data from MySQL"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.3)' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync Live DB</span>
          </button>
        </div>
      </div>

      {/* Doctor Profile Credentials Card */}
      <div className="doc-profile-card">
        <div className="doc-profile-main">
          <div className="doc-avatar">
            <Stethoscope size={24} />
          </div>
          <div className="doc-profile-details">
            <h2>
              {doctor.name}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>
                Reg. MCI-48291
              </span>
            </h2>
            <div className="doc-profile-title">{doctor.title} · {doctor.specialty}</div>
            <div className="doc-profile-meta">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Building2 size={13} color="#0066CC" /> {doctor.hospital || 'ElderCare Medical Facility'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Award size={13} color="#059669" /> {doctor.experience || '15+ years experience'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Phone size={13} color="#0284C7" /> {doctor.phone || '+91 98400 12345'}
              </span>
            </div>
          </div>
        </div>

        <div className="doc-profile-pills">
          <div className="doc-pill doc-pill-success">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span>{doctor.availability || 'Available on Duty'}</span>
          </div>
          <div className="doc-pill doc-pill-info">
            <CalendarClock size={14} />
            <span>Consultation Slots: {metrics.availableSlotsCount} Open</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="doc-stats-grid">
        {/* Card 1: Assigned Residents */}
        <div
          className="doc-stat-card"
          onClick={() => {
            const el = document.getElementById('section-assigned-residents');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          title="Click to view assigned residents"
        >
          <div className="doc-stat-icon-wrap doc-stat-icon-blue">
            <Users size={22} />
          </div>
          <div>
            <div className="doc-stat-val">{metrics.assignedResidentsCount}</div>
            <div className="doc-stat-lbl">Assigned Residents</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {metrics.criticalResidentsCount > 0 && (
                <span className="doc-stat-badge" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                  {metrics.criticalResidentsCount} Critical
                </span>
              )}
              {metrics.attentionResidentsCount > 0 && (
                <span className="doc-stat-badge" style={{ background: '#FEF3C7', color: '#B45309' }}>
                  {metrics.attentionResidentsCount} Attention
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Today's Appointments */}
        <div
          className="doc-stat-card"
          onClick={() => navigate('/appointments')}
          title="Click to view appointments module"
        >
          <div className="doc-stat-icon-wrap doc-stat-icon-emerald">
            <CalendarClock size={22} />
          </div>
          <div>
            <div className="doc-stat-val">{metrics.todaysAppointmentsCount}</div>
            <div className="doc-stat-lbl">Today's Appointments</div>
            <span className="doc-stat-badge" style={{ background: '#DCFCE7', color: '#166534' }}>
              {metrics.upcomingAppointmentsCount} Upcoming
            </span>
          </div>
        </div>

        {/* Card 3: Pending Follow-ups */}
        <div
          className="doc-stat-card"
          onClick={() => {
            const el = document.getElementById('section-followups');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          title="Click to view pending follow-ups"
        >
          <div className="doc-stat-icon-wrap doc-stat-icon-amber">
            <Clock size={22} />
          </div>
          <div>
            <div className="doc-stat-val">{metrics.pendingFollowupsCount}</div>
            <div className="doc-stat-lbl">Pending Follow-ups</div>
            <span className="doc-stat-badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
              Medical Reviews
            </span>
          </div>
        </div>

        {/* Card 4: Emergency Cases */}
        <div
          className={`doc-stat-card ${metrics.emergencyCasesCount > 0 ? 'pulse-danger' : ''}`}
          onClick={() => navigate('/emergency')}
          title="Click to open Emergency Assistance module"
          style={metrics.emergencyCasesCount > 0 ? { borderColor: '#F87171', background: '#FFF5F5' } : {}}
        >
          <div className="doc-stat-icon-wrap doc-stat-icon-rose">
            <Siren size={22} />
          </div>
          <div>
            <div className="doc-stat-val" style={metrics.emergencyCasesCount > 0 ? { color: '#DC2626' } : {}}>
              {metrics.emergencyCasesCount}
            </div>
            <div className="doc-stat-lbl">Emergency Cases</div>
            <span
              className="doc-stat-badge"
              style={metrics.emergencyCasesCount > 0 ? { background: '#FEE2E2', color: '#991B1B' } : { background: '#F1F5F9', color: '#64748B' }}
            >
              {metrics.emergencyCasesCount > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
        </div>

        {/* Card 5: Active Care Plans */}
        <div
          className="doc-stat-card"
          onClick={() => navigate('/care-plans')}
          title="Click to view Care Plans module"
        >
          <div className="doc-stat-icon-wrap doc-stat-icon-purple">
            <ClipboardList size={22} />
          </div>
          <div>
            <div className="doc-stat-val">{metrics.activeCarePlansCount}</div>
            <div className="doc-stat-lbl">Active Care Plans</div>
            <span className="doc-stat-badge" style={{ background: '#F3E8FF', color: '#6B21A8' }}>
              Clinical Goals
            </span>
          </div>
        </div>

        {/* Card 6: Medications Overview */}
        <div
          className="doc-stat-card"
          onClick={() => navigate('/medications')}
          title="Click to view Medications module"
        >
          <div className="doc-stat-icon-wrap doc-stat-icon-teal">
            <Pill size={22} />
          </div>
          <div>
            <div className="doc-stat-val">{metrics.activePrescriptionsCount}</div>
            <div className="doc-stat-lbl">Active Medications</div>
            <span className="doc-stat-badge" style={{ background: '#CCFBF1', color: '#0F766E' }}>
              Prescriptions Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Clinical Residents & Consultations) | Right Column (Emergencies & Followups) */}
      <div className="doc-section-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section: Assigned Elderly Residents */}
          <div className="panel" id="section-assigned-residents">
            <div className="doc-panel-head">
              <div>
                <h3>
                  <Users size={18} color="#0066CC" />
                  <span>Assigned Elderly Residents</span>
                </h3>
                <div className="sub">Associated patients under medical supervision & care history</div>
              </div>

              {/* Status Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {['all', 'critical', 'attention', 'stable'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn btn-sm ${residentFilter === st ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setResidentFilter(st)}
                    style={{ textTransform: 'capitalize', fontSize: 12, padding: '4px 10px' }}
                  >
                    {st === 'all' ? `All (${assignedResidents.length})` : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="doc-residents-list">
              {filteredResidents.map((r) => {
                const vitals = r.latestVitals;
                const isCrit = r.status === 'critical';
                const isAttn = r.status === 'attention';

                return (
                  <div key={r.id} className="doc-res-card">
                    <div className="doc-res-info">
                      <div className={`doc-res-avatar ${r.status || 'stable'}`}>
                        {r.initials || (r.name || 'R').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="doc-res-name">
                          {r.name} · <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{r.age}y, {r.gender}</span>
                        </div>
                        <div className="doc-res-meta">
                          <span>{r.room}</span> · <span>Caregiver: <strong>{r.caregiver || 'Staff'}</strong></span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#0369A1', marginTop: 2, fontWeight: 500 }}>
                          Diagnosis: {r.condition || 'Routine Elderly Care'}
                        </div>
                      </div>
                    </div>

                    {/* Vitals Snapshot */}
                    <div className="doc-vitals-pill-group">
                      <div className={`doc-vital-chip ${isCrit ? 'alert' : ''}`}>
                        <Activity size={12} color={isCrit ? '#DC2626' : '#0066CC'} />
                        <span>BP: <strong>{vitals?.systolic ? `${vitals.systolic}/${vitals.diastolic}` : (r.condition?.includes('Hypertension') ? '138/88' : '120/80')}</strong></span>
                      </div>
                      <div className="doc-vital-chip">
                        <HeartPulse size={12} color="#E11D48" />
                        <span>HR: <strong>{vitals?.heartRate || 74} bpm</strong></span>
                      </div>
                      <div className="doc-vital-chip">
                        <span>SpO2: <strong>{vitals?.spO2 || 98}%</strong></span>
                      </div>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="doc-res-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleOpenHistory(r)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#0066CC' }}
                        title="Doctor → Resident → Complete History"
                      >
                        <FileText size={13} />
                        <span>Care History</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate(`/health?residentId=${r.id}`)}
                        title="Doctor → Resident → Health Records"
                        style={{ fontSize: 12 }}
                      >
                        Vitals
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate('/medications')}
                        title="Doctor → Resident → Medications"
                        style={{ fontSize: 12 }}
                      >
                        Meds ({r.activeMedsCount || 10})
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate(`/elderly/${r.id}`)}
                        title="View Full Profile"
                        style={{ padding: '6px 8px' }}
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredResidents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B', fontSize: 13.5 }}>
                  No residents match the selected status filter.
                </div>
              )}
            </div>
          </div>

          {/* Section: Today's Appointments & Consultations */}
          <div className="panel">
            <div className="doc-panel-head">
              <div>
                <h3>
                  <CalendarClock size={18} color="#059669" />
                  <span>Clinical Consultations & Appointments</span>
                </h3>
                <div className="sub">Doctor visits, reviews and specialist examinations</div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${appointmentTab === 'today' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setAppointmentTab('today')}
                  style={{ fontSize: 12 }}
                >
                  Today ({todaysAppointments.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${appointmentTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setAppointmentTab('upcoming')}
                  style={{ fontSize: 12 }}
                >
                  Upcoming ({upcomingAppointments.length})
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => navigate('/appointments')}
                  style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <span>All Appointments</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            <div style={{ padding: '8px 0' }}>
              {(() => {
                const list = appointmentTab === 'today' ? todaysAppointments : upcomingAppointments;
                if (list.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '34px 20px', color: '#64748B' }}>
                      <CalendarClock size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                      <div style={{ fontSize: 14, fontWeight: 600 }}>No appointments scheduled for this period</div>
                      <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>
                        All routine consultations are up to date. You can schedule a new consultation via the Appointments module.
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate('/appointments')}
                        style={{ marginTop: 12 }}
                      >
                        Schedule New Consultation
                      </button>
                    </div>
                  );
                }

                return list.map((a) => (
                  <div key={a.id} className="doc-appt-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="doc-time-badge">
                        <Clock size={12} />
                        <span>{a.time}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
                          {a.patient}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          {a.type} · Doctor: {a.doctor}
                          {a.emergencyId && (
                            <span style={{ marginLeft: 8, padding: '1px 6px', background: '#FEE2E2', color: '#DC2626', borderRadius: 4, fontWeight: 700, fontSize: 10 }}>
                              EMERGENCY REFERRAL
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge status={a.status || 'confirmed'} />

                      {a.status !== 'completed' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleUpdateAppointmentStatus(a.id, 'completed')}
                          title="Mark Consultation Completed"
                          style={{ color: '#059669', fontSize: 12 }}
                        >
                          <Check size={14} /> Done
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate('/appointments')}
                        title="Doctor → Appointment → Appointment Details"
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Section: Active Care Plans */}
          <div className="panel">
            <div className="doc-panel-head">
              <div>
                <h3>
                  <ClipboardList size={18} color="#7C3AED" />
                  <span>Clinical Care Plans & Goals</span>
                </h3>
                <div className="sub">Targeted treatment protocols and physician directives</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/care-plans')}
                style={{ fontSize: 12 }}
              >
                View all plans
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeCarePlans.slice(0, 4).map((cp) => (
                <div
                  key={cp.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/care-plans')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>{cp.patient}</strong>
                      <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>Review: {cp.reviewDate}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0066CC' }}>{cp.progress}% complete</span>
                  </div>

                  <div style={{ fontSize: 13, color: '#334155', marginBottom: 10, fontWeight: 500 }}>
                    🎯 Goal: {cp.goal}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${cp.progress}%`, background: '#0066CC', borderRadius: 4 }} />
                  </div>

                  {/* Tasks preview */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(cp.tasksList || []).slice(0, 3).map((task, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: task.done ? '#DCFCE7' : '#FFFFFF',
                          color: task.done ? '#15803D' : '#475569',
                          border: '1px solid #E2E8F0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {task.done ? '✓' : '○'} {task.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {activeCarePlans.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: '#64748B', fontSize: 13 }}>
                  No active clinical care plans at this time.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Emergencies, Follow-ups, Health Updates & Availability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Emergency Cases */}
          <div className="panel" style={{ borderTop: '4px solid #EF4444' }}>
            <div className="doc-panel-head">
              <div>
                <h3 style={{ color: '#991B1B' }}>
                  <Siren size={18} color="#EF4444" />
                  <span>Emergency Cases</span>
                </h3>
                <div className="sub">Urgent alerts requiring physician oversight</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/emergency')}
                title="Doctor → Emergency → Emergency Details"
                style={{ fontSize: 12, color: '#991B1B' }}
              >
                Emergency Room
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {emergencyCases.slice(0, 3).map((emg) => (
                <div key={emg.id} className="doc-emg-card">
                  <div>
                    <div className="doc-emg-title">
                      <AlertTriangle size={15} />
                      <span>{emg.emergencyType || 'Urgent Medical Attention'}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', background: '#DC2626', color: '#FFF', borderRadius: 4, fontWeight: 700 }}>
                        {emg.severity || 'HIGH'}
                      </span>
                    </div>
                    <div className="doc-emg-sub">
                      Resident: <strong>{emg.residentName}</strong> ({emg.room})
                    </div>
                    <div style={{ fontSize: 11.5, color: '#7F1D1D', marginTop: 4 }}>
                      {emg.notes || 'Immediate doctor observation requested.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setActiveEmergencyModal(emg)}
                      style={{ fontSize: 11.5, background: '#DC2626', borderColor: '#DC2626' }}
                    >
                      Respond & Review
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => navigate('/emergency')}
                      style={{ fontSize: 11.5 }}
                    >
                      Full Details
                    </button>
                  </div>
                </div>
              ))}

              {emergencyCases.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#059669', fontSize: 13.5 }}>
                  <CheckCircle2 size={28} color="#10B981" style={{ marginBottom: 6 }} />
                  <div style={{ fontWeight: 600 }}>All emergencies are resolved</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>No pending critical alerts currently flagged.</div>
                </div>
              )}
            </div>
          </div>

          {/* Pending Follow-ups */}
          <div className="panel" id="section-followups">
            <div className="doc-panel-head">
              <div>
                <h3>
                  <Clock size={18} color="#D97706" />
                  <span>Pending Follow-ups</span>
                </h3>
                <div className="sub">Post-consultation reviews and monitoring</div>
              </div>
            </div>

            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingFollowups.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#92400E' }}>{f.patient}</strong>
                    <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>Due: {f.date}</span>
                  </div>
                  <div style={{ color: '#78350F', marginTop: 3 }}>
                    {f.type} · Status: <strong>{f.followup_status || f.status}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => navigate(`/health?residentId=${f.patientId}`)}
                      style={{ fontSize: 11, padding: '2px 8px' }}
                    >
                      Review Resident Vitals
                    </button>
                  </div>
                </div>
              ))}

              {pendingFollowups.length === 0 && (
                <div style={{ textAlign: 'center', padding: '18px 10px', color: '#64748B', fontSize: 13 }}>
                  No pending follow-ups waiting for review.
                </div>
              )}
            </div>
          </div>

          {/* Doctor Availability & Weekly Slots */}
          <div className="panel">
            <div className="doc-panel-head">
              <div>
                <h3>
                  <CalendarClock size={18} color="#0066CC" />
                  <span>Doctor Availability</span>
                </h3>
                <div className="sub">Weekly recurring schedule & consultation slots</div>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {availabilitySchedule.map((sched, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#0F172A', minWidth: 90 }}>
                      {sched.day_of_week}
                    </span>
                    <span style={{ color: '#0066CC', fontWeight: 600 }}>
                      {sched.start_time} &mdash; {sched.end_time}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>
                      Available
                    </span>
                  </div>
                ))}
              </div>

              {/* Sample Slot Chips */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Open Consultation Slots Today:
                </div>
                <div className="doc-slots-grid">
                  {['09:00 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:45 PM'].map((slot) => (
                    <div key={slot} className="doc-slot-chip">
                      <Clock size={11} />
                      <span>{slot}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Health Records Stream */}
          <div className="panel">
            <div className="doc-panel-head">
              <div>
                <h3>
                  <HeartPulse size={18} color="#E11D48" />
                  <span>Recent Health Updates</span>
                </h3>
                <div className="sub">Latest vitals logged by care team</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/health')}
                style={{ fontSize: 12 }}
              >
                All records
              </button>
            </div>

            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentHealthUpdates.slice(0, 4).map((rec) => (
                <div
                  key={rec.record_id || rec.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <strong style={{ color: '#0F172A' }}>Resident #{rec.resident_id}</strong>
                    <span style={{ color: '#64748B', fontFamily: 'var(--font-mono)' }}>{rec.date} · {rec.time}</span>
                  </div>
                  <div style={{ color: '#0066CC', fontWeight: 600 }}>
                    BP: {rec.blood_pressure || rec.bp} · Temp: {rec.temperature || rec.temp} · Weight: {rec.weight}
                  </div>
                  <div style={{ color: '#475569', marginTop: 3 }}>
                    {rec.notes || rec.note || 'Observation recorded during routine round.'}
                  </div>
                </div>
              ))}

              {recentHealthUpdates.length === 0 && (
                <div style={{ textAlign: 'center', padding: 18, color: '#64748B', fontSize: 13 }}>
                  No recent health observations logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Resident Care History Modal */}
      {activeHistoryResident && (
        <div className="doc-modal-overlay" onClick={() => setActiveHistoryResident(null)}>
          <div className="doc-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-head">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={20} color="#0066CC" />
                  <span>Complete Resident Care History</span>
                </h3>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                  {activeHistoryResident.name} · {activeHistoryResident.id} · {activeHistoryResident.room} · Blood Group: {activeHistoryResident.bloodGroup}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setActiveHistoryResident(null)}
                style={{ padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="doc-modal-body">
              {/* Resident Clinical Summary Banner */}
              <div
                style={{
                  padding: '12px 18px',
                  background: '#EFF6FF',
                  borderRadius: 10,
                  border: '1px solid #BFDBFE',
                  marginBottom: 18,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E3A8A' }}>
                    Primary Condition: {activeHistoryResident.condition || 'Elderly Care'}
                  </div>
                  <div style={{ fontSize: 12, color: '#1D4ED8', marginTop: 2 }}>
                    Emergency Contact: {activeHistoryResident.emergencyContact}
                  </div>
                </div>
                <StatusBadge status={activeHistoryResident.status || 'stable'} />
              </div>

              {/* Chronological History from MySQL care_records */}
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} color="#0066CC" />
                <span>Chronological Care History Logs (MySQL care_records)</span>
              </div>

              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B' }}>
                  <RefreshCw size={24} className="spin" style={{ marginBottom: 8 }} />
                  <div>Loading complete care records from database...</div>
                </div>
              ) : historyRecords.length > 0 ? (
                <div className="doc-history-timeline">
                  {historyRecords.map((item, idx) => (
                    <div key={item.record_id || item.id || idx} className="doc-history-item">
                      <div className="doc-history-dot" />
                      <div className="doc-history-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="doc-history-date">{item.date} · {item.time}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#DCFCE7', padding: '1px 6px', borderRadius: 4 }}>
                            {item.record_type || 'Routine Round'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0066CC', marginTop: 4 }}>
                          BP: {item.blood_pressure || item.bp} · Temp: {item.temperature || item.temp} · Weight: {item.weight}
                        </div>
                        <div className="doc-history-notes">
                          {item.notes || item.note}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                          Recorded by: <strong>{item.recorded_by || item.recordedBy || 'Attending Staff'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B', fontSize: 13.5 }}>
                  No care records have been filed for this resident yet.
                </div>
              )}
            </div>

            <div className="doc-modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  navigate(`/health?residentId=${activeHistoryResident.id}`);
                  setActiveHistoryResident(null);
                }}
              >
                Open Health Module
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveHistoryResident(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Response & Resolution Modal */}
      {activeEmergencyModal && (
        <div className="doc-modal-overlay" onClick={() => setActiveEmergencyModal(null)}>
          <div className="doc-modal-container" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-head" style={{ background: '#FFF5F5' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Siren size={18} color="#EF4444" />
                  <span>Doctor Response & Clinical Action</span>
                </h3>
                <div style={{ fontSize: 12, color: '#7F1D1D', marginTop: 2 }}>
                  Emergency Case #{activeEmergencyModal.id} · {activeEmergencyModal.residentName}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setActiveEmergencyModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEmergencyResponse}>
              <div className="doc-modal-body">
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: '#991B1B', fontSize: 13.5 }}>
                    {activeEmergencyModal.emergencyType} (Room {activeEmergencyModal.room})
                  </div>
                  <div style={{ fontSize: 12, color: '#7F1D1D', marginTop: 3 }}>
                    Reported issue: {activeEmergencyModal.notes || 'Emergency triggered by patient/staff.'}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Attending Physician / Responder:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={doctor.name}
                    readOnly
                    style={{ background: '#F1F5F9', fontWeight: 600 }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Clinical Action & Resolution Notes:
                  </label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Enter examination notes, vitals review, administered medication or follow-up instructions..."
                    value={clinicalResponseNotes}
                    onChange={(e) => setClinicalResponseNotes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="doc-modal-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setActiveEmergencyModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingResponse}
                  style={{ background: '#DC2626', borderColor: '#DC2626' }}
                >
                  {isSubmittingResponse ? 'Saving...' : 'Submit Clinical Response & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
