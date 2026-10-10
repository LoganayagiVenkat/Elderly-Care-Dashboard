import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Stethoscope, User, Clock, ChevronLeft, ChevronRight, CalendarCheck,
  CalendarDays, CheckCircle2, AlertCircle, Plus, X, Heart, FlaskConical,
  Activity, ArrowRight, Trash2, Calendar, ShieldCheck, Check, Settings,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { scopeByResident } from '../utils/scope.js';
import { elderlyResidents } from '../data/dummyData.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import { specialistsApi } from '../services/api.js';
import {
  toISODate, isSameDay, startOfMonth, addMonths, addDays,
  monthLabel, weekdayShort, getMonthGrid, getWeekDays, WEEKDAY_HEADERS,
} from '../utils/dateUtils.js';

function timeToMinutes(label) {
  if (!label) return 0;
  const [time, meridiem] = label.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function getSpecialtyClass(type = '') {
  const lower = type.toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return 'cardiology';
  if (lower.includes('nephro') || lower.includes('kidney')) return 'nephrology';
  if (lower.includes('diabet') || lower.includes('sugar')) return 'diabetes';
  if (lower.includes('bone') || lower.includes('ortho')) return 'bone';
  if (lower.includes('physio')) return 'physio';
  if (lower.includes('derma') || lower.includes('skin')) return 'dermatology';
  return 'general';
}

function getSpecialtyIcon(type = '') {
  const lower = type.toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return Heart;
  if (lower.includes('diabet') || lower.includes('sugar')) return FlaskConical;
  if (lower.includes('bone') || lower.includes('ortho')) return Activity;
  if (lower.includes('physio')) return CalendarCheck;
  return Stethoscope;
}

const DEFAULT_SPECIALISTS = [
  { id: 'DOC-01', name: 'Dr. Suresh Rao', specialty: 'Dermatology', title: 'Consultant Dermatologist', hospital: 'Apollo City Hospital & Dermatology Clinic' },
  { id: 'DOC-02', name: 'Dr. Kavya Menon', specialty: 'Cardiology', title: 'Chief Interventional Cardiologist', hospital: 'Fortis Heart Center' },
  { id: 'DOC-03', name: 'Dr. Arvind Rao', specialty: 'Pulmonology', title: 'Consultant Pulmonologist', hospital: 'Chest & Lung Specialty Institute' },
  { id: 'DOC-04', name: 'Dr. Sunita Bhatt', specialty: 'Neurology', title: 'Senior Neurologist', hospital: 'Neuro Care Medical Center' },
  { id: 'DOC-05', name: 'Dr. Rajesh Sharma', specialty: 'Orthopedics', title: 'Senior Orthopedic Surgeon', hospital: 'Bone & Joint Clinic' },
  { id: 'DOC-06', name: 'Dr. Meenakshi Iyer', specialty: 'Ophthalmology', title: 'Consultant Eye Surgeon', hospital: 'Aravind Eye Center' },
  { id: 'DOC-07', name: 'Dr. Preeti Deshmukh', specialty: 'Gastroenterology', title: 'Consultant Gastroenterologist', hospital: 'Digestive Health Institute' },
  { id: 'DOC-08', name: 'Dr. Vivek Murthy', specialty: 'General Medicine', title: 'Emergency Physician', hospital: 'ElderCare Emergency Medical Wing' }
];

export default function Appointments() {
  const { user, appointments: allAppointmentsFromContext, addAppointment, deleteAppointment, residents, t } = useApp();
  const activeResidents = residents && residents.length > 0 ? residents : elderlyResidents;
  const isAdmin = user?.role === 'admin';

  // Deduplicated Appointments
  const appointments = useMemo(() => {
    const scoped = scopeByResident(user, allAppointmentsFromContext || [], 'patientId');
    const seenApptIds = new Set();
    const seenEmergencyIds = new Set();
    const seenEmergencyEventKeys = new Set();
    const deduplicated = [];

    for (const a of scoped) {
      if (!a || !a.id) continue;
      if (seenApptIds.has(a.id)) continue;
      seenApptIds.add(a.id);

      // Deduplicate emergency referral appointments:
      // For ONE emergency event, show ONLY ONE specialist referral appointment
      if (a.emergencyId) {
        if (seenEmergencyIds.has(a.emergencyId)) {
          continue;
        }
        seenEmergencyIds.add(a.emergencyId);
      }

      const isEmergency = a.emergencyId || (a.type && a.type.toLowerCase().includes('emergency'));
      if (isEmergency) {
        const emgKey = `emg-${a.patientId || a.patient}-${a.specialty || a.type}-${a.date}`;
        if (seenEmergencyEventKeys.has(emgKey)) {
          continue;
        }
        seenEmergencyEventKeys.add(emgKey);
      }

      deduplicated.push(a);
    }

    return deduplicated;
  }, [user, allAppointmentsFromContext]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [view, setView] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  // Specialists Directory & Availability State
  const [specialistsList, setSpecialistsList] = useState(DEFAULT_SPECIALISTS);
  const [selectedDoctorId, setSelectedDoctorId] = useState('DOC-01');
  const [weekOverview, setWeekOverview] = useState([]);
  const [doctorSlotsData, setDoctorSlotsData] = useState({ slots: [], isWorkingDay: false, message: '' });
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Admin Availability Management State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminAvailabilityList, setAdminAvailabilityList] = useState([]);
  const [adminDoctorId, setAdminDoctorId] = useState('DOC-01');
  const [adminDay, setAdminDay] = useState('Monday');
  const [adminStart, setAdminStart] = useState('10:00 AM');
  const [adminEnd, setAdminEnd] = useState('01:00 PM');
  const [adminStatus, setAdminStatus] = useState('available');
  const [adminFeedback, setAdminFeedback] = useState('');

  // New appointment form state
  const [formPatient, setFormPatient] = useState(() => activeResidents[0]?.name || 'Lakshmi Devi');
  const [formDoctor, setFormDoctor] = useState('Dr. Suresh Rao');
  const [formDoctorId, setFormDoctorId] = useState('DOC-01');
  const [formType, setFormType] = useState('Dermatology Consultation');
  const [formDate, setFormDate] = useState(() => toISODate(new Date()));
  const [formTime, setFormTime] = useState('10:00 AM');
  const [modalSlots, setModalSlots] = useState([]);
  const [modalLoadingSlots, setModalLoadingSlots] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected Date Formatting
  const selectedISO = toISODate(selectedDate);
  const apptsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)));
    return map;
  }, [appointments]);

  const visibleAppointments = apptsByDate[selectedISO] || [];

  // Appointments Pagination
  const [apptPage, setApptPage] = useState(1);
  const apptLimit = 4;

  useEffect(() => {
    setApptPage(1);
  }, [selectedISO]);

  const apptTotalPages = Math.ceil(visibleAppointments.length / apptLimit) || 1;
  const paginatedAppointments = useMemo(() => {
    const start = (apptPage - 1) * apptLimit;
    return visibleAppointments.slice(start, start + apptLimit);
  }, [visibleAppointments, apptPage, apptLimit]);

  const selectedLabel = selectedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isSelectedToday = isSameDay(selectedDate, new Date());
  const isSelectedTomorrow = isSameDay(selectedDate, addDays(new Date(), 1));

  // Summary Metrics
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const uniqueDoctorsCount = new Set(appointments.map((a) => a.doctor)).size;

  // Selected Doctor Object
  const selectedDoctorObj = useMemo(() => {
    return specialistsList.find((d) => d.id === selectedDoctorId) || specialistsList[0] || DEFAULT_SPECIALISTS[0];
  }, [specialistsList, selectedDoctorId]);

  // Load Specialists from backend
  const loadSpecialists = useCallback(async () => {
    try {
      const res = await specialistsApi.getAll();
      if (res && res.data && res.data.length > 0) {
        setSpecialistsList(res.data);
      }
    } catch {
      setSpecialistsList(DEFAULT_SPECIALISTS);
    }
  }, []);

  useEffect(() => {
    loadSpecialists();
  }, [loadSpecialists]);

  // Load Week View for Selected Doctor
  const loadWeekView = useCallback(async (docId) => {
    try {
      const res = await specialistsApi.getWeekView({ doctorId: docId });
      if (res && res.data && res.data.week) {
        setWeekOverview(res.data.week);
      }
    } catch {
      setWeekOverview([]);
    }
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      loadWeekView(selectedDoctorId);
    }
  }, [selectedDoctorId, loadWeekView]);

  // Load 30-min Slots for Selected Doctor and Date
  const loadDoctorSlots = useCallback(async (docId, dateStr) => {
    if (!docId || !dateStr) return;
    setLoadingSlots(true);
    try {
      const res = await specialistsApi.getSlots(docId, dateStr);
      if (res && res.data) {
        setDoctorSlotsData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load slots:', err);
      setDoctorSlotsData({ slots: [], isWorkingDay: false, message: 'Unable to load slots' });
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorSlots(selectedDoctorId, selectedISO);
  }, [selectedDoctorId, selectedISO, loadDoctorSlots]);

  // Load Modal Slots when formDoctorId or formDate changes
  useEffect(() => {
    if (!isModalOpen) return;
    let cancelled = false;
    setModalLoadingSlots(true);
    setFormError('');

    specialistsApi.getSlots(formDoctorId, formDate)
      .then((res) => {
        if (!cancelled && res && res.data) {
          const slots = res.data.slots || [];
          setModalSlots(slots);
          // If current formTime is not available or is booked, select first available slot
          const currentSlot = slots.find((s) => s.time === formTime);
          if (!currentSlot || currentSlot.isBooked) {
            const firstOpen = slots.find((s) => !s.isBooked);
            if (firstOpen) setFormTime(firstOpen.time);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setModalSlots([]);
      })
      .finally(() => {
        if (!cancelled) setModalLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isModalOpen, formDoctorId, formDate, formTime]);

  // Load Admin Availability List
  const loadAdminAvailability = useCallback(async () => {
    try {
      const res = await specialistsApi.getAvailability();
      if (res && res.data) {
        setAdminAvailabilityList(res.data);
      }
    } catch (err) {
      console.warn('Failed to load admin availability:', err);
    }
  }, []);

  useEffect(() => {
    if (isAdminModalOpen) {
      loadAdminAvailability();
    }
  }, [isAdminModalOpen, loadAdminAvailability]);

  // Navigation Handlers
  const goToday = () => {
    const todayDate = new Date();
    setCurrentMonth(startOfMonth(todayDate));
    setSelectedDate(todayDate);
  };

  const goPrev = () => {
    if (view === 'month') setCurrentMonth((m) => addMonths(m, -1));
    else setSelectedDate((d) => addDays(d, view === 'week' ? -7 : -1));
  };

  const goNext = () => {
    if (view === 'month') setCurrentMonth((m) => addMonths(m, 1));
    else setSelectedDate((d) => addDays(d, view === 'week' ? 7 : 1));
  };

  const monthCells = useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
  const todayDateObj = new Date();

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    if (date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(startOfMonth(date));
    }
  };

  // Delete Consultation
  const handleDeleteAppointment = async (appt) => {
    const isEmergency = Boolean(appt.emergencyId || (appt.type && appt.type.toLowerCase().includes('emergency')));
    const confirmMsg = isEmergency
      ? `Are you sure you want to delete this Emergency Referral consultation for ${appt.patient} with ${appt.doctor}?`
      : `Are you sure you want to delete this consultation for ${appt.patient} with ${appt.doctor}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteAppointment(appt.id);
      setActionFeedback(`✓ Consultation for ${appt.patient} was successfully deleted.`);
      setTimeout(() => setActionFeedback(''), 3500);
      loadDoctorSlots(selectedDoctorId, selectedISO);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
    }
  };

  // Click slot chip to prefill and open booking modal
  const handleSelectSlotForBooking = (slot) => {
    if (slot.isBooked) return;
    setFormDoctor(selectedDoctorObj.name);
    setFormDoctorId(selectedDoctorObj.id);
    setFormType(`${selectedDoctorObj.specialty} Consultation`);
    setFormDate(selectedISO);
    setFormTime(slot.time);
    setFormError('');
    setIsModalOpen(true);
  };

  // Create Appointment Submission
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setFormError('');

    const matchedPatient = activeResidents.find((r) => r.name === formPatient);
    const apptPayload = {
      patient: formPatient,
      patientId: matchedPatient ? matchedPatient.id : 'EC-001',
      doctor: formDoctor,
      doctorId: formDoctorId,
      type: formType,
      specialty: selectedDoctorObj.specialty || 'General',
      date: formDate,
      time: formTime,
      status: 'confirmed',
    };

    try {
      const res = await addAppointment(apptPayload);
      if (res && res.success) {
        setIsModalOpen(false);
        setActionFeedback(`✓ Consultation scheduled successfully with ${formDoctor} on ${formDate} at ${formTime}.`);
        setTimeout(() => setActionFeedback(''), 4000);
        loadDoctorSlots(selectedDoctorId, selectedISO);
      }
    } catch (err) {
      setFormError(err.message || 'This specialist slot is already booked. Please choose another available slot.');
    }
  };

  // Admin: Add Availability Rule
  const handleAddAvailability = async (e) => {
    e.preventDefault();
    setAdminFeedback('');
    try {
      const res = await specialistsApi.addAvailability({
        doctor_id: adminDoctorId,
        day_of_week: adminDay,
        start_time: adminStart,
        end_time: adminEnd,
        slot_duration_minutes: 30,
        status: adminStatus
      });
      if (res && res.success) {
        setAdminFeedback(`✓ Availability schedule added for ${adminDay}.`);
        loadAdminAvailability();
        loadWeekView(selectedDoctorId);
        loadDoctorSlots(selectedDoctorId, selectedISO);
        setTimeout(() => setAdminFeedback(''), 3500);
      }
    } catch (err) {
      setAdminFeedback(`Error: ${err.message}`);
    }
  };

  // Admin: Toggle Availability Status
  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'available' ? 'unavailable' : 'available';
    try {
      await specialistsApi.updateAvailability(item.id, { status: nextStatus });
      loadAdminAvailability();
      loadWeekView(selectedDoctorId);
      loadDoctorSlots(selectedDoctorId, selectedISO);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Admin: Delete Availability Rule
  const handleDeleteAvailability = async (id) => {
    if (!window.confirm('Delete this availability schedule?')) return;
    try {
      await specialistsApi.deleteAvailability(id);
      loadAdminAvailability();
      loadWeekView(selectedDoctorId);
      loadDoctorSlots(selectedDoctorId, selectedISO);
    } catch (err) {
      alert(`Failed to delete availability: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1>{t('Appointments')}</h1>
          <p className="desc">Consultations, specialist checkups, and wellness visits across the facility.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAdminModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}
            >
              <Settings size={15} />
              Manage Availability
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setFormDoctor(selectedDoctorObj.name);
              setFormDoctorId(selectedDoctorObj.id);
              setFormType(`${selectedDoctorObj.specialty} Consultation`);
              setFormDate(selectedISO);
              setFormError('');
              setIsModalOpen(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <Plus size={16} />
            {t('Schedule Consultation')}
          </button>
        </div>
      </div>

      {/* Top 4 Quick Statistics Cards */}
      <div className="appointments-stats">
        <div className="appt-stat-card">
          <div className="appt-stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            <CalendarDays size={20} />
          </div>
          <div>
            <div className="appt-stat-value">{totalCount}</div>
            <div className="appt-stat-label">Total Scheduled Visits</div>
          </div>
        </div>

        <div className="appt-stat-card">
          <div className="appt-stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="appt-stat-value">{confirmedCount}</div>
            <div className="appt-stat-label">Confirmed Consultations</div>
          </div>
        </div>

        <div className="appt-stat-card">
          <div className="appt-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="appt-stat-value">{pendingCount}</div>
            <div className="appt-stat-label">Pending Follow-ups</div>
          </div>
        </div>

        <div className="appt-stat-card">
          <div className="appt-stat-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <div className="appt-stat-value">{uniqueDoctorsCount} Specialists</div>
            <div className="appt-stat-label">Verified Weekly Schedules</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: SPECIALIST AVAILABILITY & WEEKLY SLOTS SCHEDULE */}
      {/* ========================================================= */}
      <div className="spec-avail-panel">
        <div className="spec-avail-header">
          <div className="spec-avail-title">
            <Stethoscope size={20} style={{ color: '#0284C7' }} />
            <span>SPECIALIST AVAILABILITY SCHEDULE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)' }}>Specialist:</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-hairline-strong, #CBD5E1)',
                  background: 'var(--surface-card)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {specialistsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} · {doc.specialty}
                  </option>
                ))}
              </select>
            </div>

            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                background: '#E0F2FE',
                color: '#0284C7'
              }}
            >
              {selectedDoctorObj.specialty}
            </span>

            {isAdmin && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setAdminDoctorId(selectedDoctorId);
                  setIsAdminModalOpen(true);
                }}
                style={{ fontSize: 12, padding: '4px 8px' }}
                title="Edit weekly availability rules"
              >
                <Settings size={13} />
                Edit Hours
              </button>
            )}
          </div>
        </div>

        {/* Doctor Summary Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDoctorObj.name}</span>
          <span>·</span>
          <span>{selectedDoctorObj.title || 'Consultant Specialist'}</span>
          <span>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>{selectedDoctorObj.hospital || 'Affiliated Medical Wing'}</span>
        </div>

        {/* Weekly Availability Overview Grid (Monday to Sunday) */}
        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Weekly Consulting Hours (Monday – Sunday)
        </div>
        <div className="spec-week-grid">
          {weekOverview.map((item) => {
            const isDaySelected = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }) === item.day;
            return (
              <div
                key={item.day}
                className={`spec-day-card ${item.hasAvailability ? 'has-hours' : 'no-hours'} ${isDaySelected ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="spec-day-name">{item.day.slice(0, 3)}</span>
                  {isDaySelected && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#0284C7', background: '#BAE6FD', padding: '1px 4px', borderRadius: 3 }}>
                      Active
                    </span>
                  )}
                </div>
                <div className="spec-day-hours">
                  {item.hasAvailability ? (
                    item.schedules.map((s) => (
                      <div key={s.id} style={{ fontSize: 11, fontWeight: 600, color: '#0F766E', marginTop: 2 }}>
                        {s.start_time} - {s.end_time}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                      No {selectedDoctorObj.specialty}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 30-Minute Time Slots for Selected Date */}
        <div style={{ borderTop: '1px dashed var(--border-hairline, #E2E8F0)', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} style={{ color: '#0284C7' }} />
              <span>Available 30-Min Slots for {selectedLabel}</span>
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Click an open slot to schedule instantly. Booked slots cannot be selected.
            </span>
          </div>

          {loadingSlots ? (
            <div style={{ padding: '16px 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Checking specialist schedule & existing bookings...
            </div>
          ) : !doctorSlotsData.isWorkingDay || doctorSlotsData.slots.length === 0 ? (
            <div style={{ padding: '14px 16px', background: 'var(--surface-sunken, #F8FAFC)', borderRadius: 8, fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong>{selectedDoctorObj.name}</strong> has no scheduled availability on this day ({selectedDate.toLocaleDateString('en-IN', { weekday: 'long' })}).
              </div>
              <span style={{ fontSize: 11.5, color: '#0284C7', fontWeight: 600 }}>
                Please select an active day from the schedule above.
              </span>
            </div>
          ) : (
            <div className="spec-slots-grid">
              {doctorSlotsData.slots.map((slot) => {
                return (
                  <button
                    key={slot.time}
                    type="button"
                    className={`spec-slot-chip ${slot.isBooked ? 'booked' : ''}`}
                    onClick={() => handleSelectSlotForBooking(slot)}
                    disabled={slot.isBooked}
                    title={slot.isBooked ? `Already booked for ${slot.bookedPatient || 'another patient'}` : `Select ${slot.time} with ${selectedDoctorObj.name}`}
                  >
                    <Clock size={12} />
                    <span>{slot.time}</span>
                    {slot.isBooked && (
                      <span className="spec-slot-badge-booked">BOOKED</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: MASTER-DETAIL SIDE-BY-SIDE GRID LAYOUT         */}
      {/* ========================================================= */}
      <div className="appointments-layout">
        {/* Left Column: Calendar Engine */}
        <div className="panel" style={{ padding: 20 }}>
          <div className="cal-toolbar">
            <div className="cal-nav">
              <button className="btn btn-ghost btn-sm" onClick={goPrev} aria-label="Previous">
                <ChevronLeft size={16} />
              </button>
              <span className="cal-month-label">
                {view === 'month' ? monthLabel(currentMonth) : selectedLabel}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={goNext} aria-label="Next">
                <ChevronRight size={16} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={goToday} style={{ marginLeft: 6 }}>
                Today
              </button>
            </div>

            <div className="cal-view-toggle">
              {['month', 'week', 'day'].map((v) => (
                <button
                  key={v}
                  className={view === v ? 'active' : ''}
                  onClick={() => setView(v)}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {view === 'month' && (
            <div className="month-grid">
              {WEEKDAY_HEADERS.map((w) => (
                <div className="weekday-head" key={w}>
                  {w}
                </div>
              ))}

              {monthCells.map(({ date, inMonth }) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, todayDateObj);
                const dateISO = toISODate(date);
                const dayAppts = apptsByDate[dateISO] || [];

                return (
                  <div
                    key={date.toISOString()}
                    className={`month-cell ${inMonth ? '' : 'outside'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectDate(date)}
                  >
                    <div className="cell-top-bar">
                      <span className="cell-day-num">{date.getDate()}</span>
                      {dayAppts.length > 0 && (
                        <span className="cell-badge">{dayAppts.length}</span>
                      )}
                    </div>

                    <div className="cell-pills">
                      {dayAppts.slice(0, 3).map((a) => {
                        const Icon = getSpecialtyIcon(a.type);
                        const specialtyClass = getSpecialtyClass(a.specialty || a.type);
                        return (
                          <div key={a.id} className={`cal-pill ${specialtyClass}`}>
                            <Icon size={10} style={{ flexShrink: 0 }} />
                            <span className="truncate">{a.patient.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                      {dayAppts.length > 3 && (
                        <div className="cal-pill-more">+{dayAppts.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'week' && (
            <div className="week-grid">
              {getWeekDays(selectedDate).map((day) => {
                const isToday = isSameDay(day, todayDateObj);
                const isSelected = isSameDay(day, selectedDate);
                const dateISO = toISODate(day);
                const dayAppts = apptsByDate[dateISO] || [];

                return (
                  <div
                    key={day.toISOString()}
                    className={`week-col ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectDate(day)}
                  >
                    <div className={`week-col-head ${isToday ? 'today' : ''}`}>
                      <div className="week-col-dayname">{weekdayShort(day)}</div>
                      <div className="week-col-daynum">{day.getDate()}</div>
                    </div>
                    <div className="week-col-body">
                      {dayAppts.map((a) => {
                        const Icon = getSpecialtyIcon(a.type);
                        return (
                          <div key={a.id} className={`week-event-card ${getSpecialtyClass(a.specialty || a.type)}`}>
                            <div className="week-event-time">{a.time}</div>
                            <div className="week-event-title truncate">{a.patient}</div>
                            <div className="week-event-doctor truncate">
                              <Icon size={10} style={{ display: 'inline', marginRight: 3 }} />
                              {a.doctor}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'day' && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span>Viewing consultations for <strong>{selectedLabel}</strong>. Use the arrows above to browse other dates.</span>
            </div>
          )}
        </div>

        {/* Right Column: Day Consultations Hub */}
        <div className="cal-agenda-panel">
          <div className="cal-agenda-header">
            <div>
              <div className="cal-agenda-date">{selectedLabel}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {visibleAppointments.length} consultation{visibleAppointments.length !== 1 ? 's' : ''} scheduled
              </div>
            </div>
            {isSelectedToday ? (
              <span className="cal-agenda-tag today">Today</span>
            ) : isSelectedTomorrow ? (
              <span className="cal-agenda-tag other">Tomorrow</span>
            ) : (
              <span className="cal-agenda-tag other">Selected</span>
            )}
          </div>

          <div className="cal-agenda-body">
            {actionFeedback && (
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #6EE7B7',
                  color: '#065F46',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                <span>{actionFeedback}</span>
              </div>
            )}

            {visibleAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#94A3B8' }}>
                  <CalendarCheck size={22} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  No consultations
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.4, marginBottom: 16 }}>
                  There are no medical visits scheduled on this date.
                </div>
                {!isSelectedToday && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={goToday}
                    style={{ fontSize: 12 }}
                  >
                    Jump to Today ({apptsByDate[toISODate(new Date())]?.length || 0} visits)
                  </button>
                )}
              </div>
            ) : (
              paginatedAppointments.map((a) => {
                const Icon = getSpecialtyIcon(a.type);
                const matchedResident = activeResidents.find((r) => r.name === a.patient);
                const initials = matchedResident ? matchedResident.initials : a.patient.slice(0, 2).toUpperCase();

                return (
                  <div className="appt-card-item" key={a.id} style={{ overflow: 'hidden', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                    <div className="appt-card-top">
                      <div className="appt-card-time">
                        <Clock size={13} />
                        <span>{a.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StatusBadge status={a.status} label={a.status === 'confirmed' ? 'Confirmed' : a.status === 'pending' ? 'Pending' : a.status} />
                        <button
                          type="button"
                          className="appt-delete-btn"
                          onClick={() => handleDeleteAppointment(a)}
                          title={a.emergencyId ? "Delete emergency referral" : "Delete consultation"}
                          aria-label="Delete consultation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Patient Name and Avatar Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, width: '100%' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#E0F2FE',
                          color: '#0284C7',
                          fontWeight: 700,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="appt-card-title" style={{ wordBreak: 'break-word' }}>{a.patient}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-forest, #0284C7)', fontWeight: 600 }}>
                          {a.type}
                        </div>
                      </div>
                    </div>

                    {/* Emergency Referral Banner */}
                    {a.emergencyId && (
                      <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                        <div
                          style={{
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FCA5A5',
                            borderRadius: 6,
                            padding: '6px 9px',
                            fontSize: 11,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            wordBreak: 'break-word',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: 13, lineHeight: 1 }}>🚨</span>
                            <div style={{ minWidth: 0 }}>
                              EMERGENCY REFERRAL: <strong>{(a.specialty || 'Specialist').toUpperCase()}</strong>{' '}
                              <span style={{ opacity: 0.85, fontFamily: 'var(--font-mono)' }}>(#{a.emergencyId})</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(a)}
                            style={{
                              background: '#DC2626',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 4,
                              padding: '3px 8px',
                              fontSize: 10.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              flexShrink: 0,
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#B91C1C')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#DC2626')}
                            title="Delete Emergency Referral"
                          >
                            <Trash2 size={11} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Doctor Info */}
                    <div className="appt-card-meta" style={{ flexWrap: 'wrap', gap: 6, minWidth: 0, width: '100%' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                        <Stethoscope size={13} style={{ color: '#64748B', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{a.doctor}</span> {a.specialty ? `· ${a.specialty}` : ''}
                      </span>
                    </div>

                    {/* Reason / Notes */}
                    {a.reason && (
                      <div
                        style={{
                          fontSize: 11.5,
                          lineHeight: 1.45,
                          color: 'var(--text-secondary)',
                          background: a.emergencyId ? 'rgba(239, 68, 68, 0.04)' : 'var(--surface-sunken, #F8FAFC)',
                          borderLeft: a.emergencyId ? '3px solid #EF4444' : '3px solid var(--border-hairline-strong, #CBD5E1)',
                          padding: '7px 10px',
                          borderRadius: '0 6px 6px 0',
                          wordBreak: 'break-word',
                          fontStyle: a.emergencyId ? 'italic' : 'normal',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        {a.reason}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {visibleAppointments.length > apptLimit && (
              <div style={{ marginTop: 10, borderTop: '1px solid #E2E8E5', paddingTop: 8 }}>
                <Pagination
                  compact={true}
                  page={apptPage}
                  totalPages={apptTotalPages}
                  total={visibleAppointments.length}
                  limit={apptLimit}
                  onPageChange={setApptPage}
                />
              </div>
            )}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setFormDoctor(selectedDoctorObj.name);
                setFormDoctorId(selectedDoctorObj.id);
                setFormType(`${selectedDoctorObj.specialty} Consultation`);
                setFormDate(selectedISO);
                setFormError('');
                setIsModalOpen(true);
              }}
              style={{
                marginTop: 6,
                border: '1px dashed var(--border-hairline-strong)',
                borderRadius: 8,
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              <Plus size={14} />
              Book consultation for this date
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SCHEDULE CONSULTATION MODAL (WITH DYNAMIC AVAILABILITY)   */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="doc-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="doc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarCheck size={18} style={{ color: '#0284C7' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Schedule Consultation</h3>
              </div>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment}>
              <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #F87171',
                      color: '#991B1B',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <AlertTriangle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Resident</label>
                  <select
                    value={formPatient}
                    onChange={(e) => setFormPatient(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                  >
                    {activeResidents.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} (Room {r.room})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Attending Specialist</label>
                  <select
                    value={formDoctorId}
                    onChange={(e) => {
                      const docId = e.target.value;
                      setFormDoctorId(docId);
                      const matched = specialistsList.find((d) => d.id === docId);
                      if (matched) {
                        setFormDoctor(matched.name);
                        setFormType(`${matched.specialty} Consultation`);
                      }
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                  >
                    {specialistsList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} · {doc.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Consultation Type</label>
                  <input
                    type="text"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                    required
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Consultation Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                    required
                  />
                </div>

                {/* Dynamic Available 30-Min Slots Selector */}
                <div className="field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Available 30-Min Slot</label>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Selected: <strong>{formTime}</strong>
                    </span>
                  </div>

                  {modalLoadingSlots ? (
                    <div style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)' }}>Loading slots...</div>
                  ) : modalSlots.length === 0 ? (
                    <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 11.5, color: '#991B1B' }}>
                      No available slots on this date. Doctor has no active schedule for this day. Please choose another date.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto', padding: '4px 0' }}>
                      {modalSlots.map((slot) => {
                        const isChosen = formTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.isBooked}
                            onClick={() => setFormTime(slot.time)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: slot.isBooked ? 'not-allowed' : 'pointer',
                              border: isChosen ? '2px solid #0284C7' : '1px solid var(--border-hairline-strong, #CBD5E1)',
                              background: isChosen ? '#E0F2FE' : slot.isBooked ? '#F1F5F9' : 'var(--surface-card)',
                              color: isChosen ? '#0369A1' : slot.isBooked ? '#94A3B8' : 'var(--text-primary)',
                              opacity: slot.isBooked ? 0.7 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span>{slot.time}</span>
                            {slot.isBooked && (
                              <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626' }}>BOOKED</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="doc-modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalSlots.length === 0 || (modalSlots.find((s) => s.time === formTime)?.isBooked)}
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADMIN: MANAGE SPECIALIST AVAILABILITY MODAL               */}
      {/* ========================================================= */}
      {isAdminModalOpen && (
        <div className="doc-modal-overlay" onClick={() => setIsAdminModalOpen(false)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="doc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} style={{ color: '#0284C7' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Admin: Manage Specialist Availability</h3>
              </div>
              <button className="icon-btn" onClick={() => setIsAdminModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
              {adminFeedback && (
                <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  {adminFeedback}
                </div>
              )}

              {/* Add New Availability Rule Form */}
              <form onSubmit={handleAddAvailability} style={{ background: 'var(--surface-sunken, #F8FAFC)', padding: 14, borderRadius: 8, border: '1px solid var(--border-hairline)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 10 }}>
                  Add Availability Schedule
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Specialist</label>
                    <select
                      value={adminDoctorId}
                      onChange={(e) => setAdminDoctorId(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', fontSize: 12.5 }}
                    >
                      {specialistsList.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Day of Week</label>
                    <select
                      value={adminDay}
                      onChange={(e) => setAdminDay(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', fontSize: 12.5 }}
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Start Time</label>
                    <input
                      type="text"
                      placeholder="10:00 AM"
                      value={adminStart}
                      onChange={(e) => setAdminStart(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', fontSize: 12.5 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>End Time</label>
                    <input
                      type="text"
                      placeholder="01:00 PM"
                      value={adminEnd}
                      onChange={(e) => setAdminEnd(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', fontSize: 12.5 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Status</label>
                    <select
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', fontSize: 12.5 }}
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  <Plus size={14} />
                  Save Schedule to MySQL
                </button>
              </form>

              {/* Existing Availability Rules Table */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Existing Schedules ({adminAvailabilityList.length})
                </div>

                <div style={{ border: '1px solid var(--border-hairline)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-sunken)', textAlign: 'left', borderBottom: '1px solid var(--border-hairline)' }}>
                        <th style={{ padding: '8px 12px' }}>Doctor</th>
                        <th style={{ padding: '8px 12px' }}>Day</th>
                        <th style={{ padding: '8px 12px' }}>Hours</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminAvailabilityList.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.doctor_name}</td>
                          <td style={{ padding: '8px 12px' }}>{item.day_of_week}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>{item.start_time} - {item.end_time}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: item.status === 'available' ? '#DCFCE7' : '#F1F5F9',
                                color: item.status === 'available' ? '#16A34A' : '#64748B'
                              }}
                            >
                              {item.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              style={{ background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer', fontSize: 11, fontWeight: 600, marginRight: 8 }}
                            >
                              Toggle
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAvailability(item.id)}
                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="doc-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsAdminModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
