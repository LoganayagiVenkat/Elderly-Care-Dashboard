import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCog, Calendar, Pill, ArrowUpRight, ArrowRight, Sun, ChevronRight, Activity, AlertTriangle, ArrowRightLeft, GitFork } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { elderlyResidents, appointments, medications } from '../../data/dummyData';
import { calculateAllCaregiverWorkloads, detectWorkloadImbalance, WORKLOAD_LEVELS } from '../../utils/workloadUtils.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { residents, caregivers = [], careTasks = [], carePlans = [], emergencyAlerts = [] } = useApp();
  const currentResidents = residents || elderlyResidents;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(t);
  }, []);

  const workloads = useMemo(() => {
    return calculateAllCaregiverWorkloads(caregivers, {
      residents: currentResidents,
      careTasks,
      carePlans,
      appointments,
      medications,
      emergencyAlerts,
      now,
    });
  }, [caregivers, currentResidents, careTasks, carePlans, appointments, medications, emergencyAlerts, now]);

  const imbalance = useMemo(() => {
    return detectWorkloadImbalance(workloads);
  }, [workloads]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const formattedBannerDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  const formattedBannerTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toUpperCase();

  const todaysScheduleItems = [
    {
      time: '07:30 AM',
      title: 'Morning Check',
      room: 'Room 101 \u2022 Meena R.',
      status: 'Completed',
      statusClass: 'status-completed',
      dotColor: '#10B981',
    },
    {
      time: '09:00 AM',
      title: 'Medication',
      room: 'Room 103 \u2022 Kumar S.',
      status: 'Upcoming',
      statusClass: 'status-upcoming',
      dotColor: '#0284C7',
    },
    {
      time: '11:00 AM',
      title: 'Physiotherapy',
      room: 'Room 105 \u2022 Ramesh K.',
      status: 'Scheduled',
      statusClass: 'status-scheduled',
      dotColor: '#F59E0B',
    },
  ];

  return (
    <div className="dashboard-view">
      {/* Hero Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-content">
          <div className="w-date">
            <Sun size={14} className="sun-icon" />
            <span>{formattedBannerDate}</span>
            <span>•</span>
            <span>{formattedBannerTime}</span>
          </div>
          <h1>
            {greeting}, <span className="highlight">Care Team</span>
          </h1>
          <p>
            System-wide overview across the residency &mdash; {currentResidents.length} residents under active care with {medications.length} doses scheduled today.
          </p>
        </div>

        <div className="welcome-banner-visuals">
          <div className="welcome-quote-text">
            Caring<br />
            Today <span className="accent-for">for</span><br />
            Brighter<br />
            Tomorrows <span className="heart-icon">♡</span>
          </div>

          <div className="welcome-banner-photo">
            <img src="/caregiver-hands.jpg" alt="Caregiver holding elderly hands" />
            <div className="welcome-banner-photo-overlay" />
            <span className="welcome-banner-tag">PEOPLE CARE PEOPLE &mdash;</span>
          </div>
        </div>
      </div>

      {/* Top 3 Stat Cards with bottom-right corner waves */}
      <div className="grid-3">
        {/* Card 1: Total Residents */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{currentResidents.length}</div>
            <div className="stat-label">Total Residents</div>
            <div className="stat-delta">
              <ArrowUpRight size={13} />
              +1 this month
            </div>
          </div>
          <svg className="stat-wave" viewBox="0 0 100 60" fill="none">
            <path d="M0 60C30 50 50 35 70 45C85 52 95 38 100 30V60H0Z" fill="#E0F2FE" />
          </svg>
        </div>

        {/* Card 2: Active Caregivers */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <UserCog size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{caregivers.filter((c) => c.status === 'active').length}</div>
            <div className="stat-label">Active Caregivers</div>
            <div className="stat-delta">
              <ArrowUpRight size={13} />
              All shifts covered
            </div>
          </div>
          <svg className="stat-wave" viewBox="0 0 100 60" fill="none">
            <path d="M0 60C30 50 50 35 70 45C85 52 95 38 100 30V60H0Z" fill="#DCFCE7" />
          </svg>
        </div>

        {/* Card 3: Today's Appointments */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{appointments.length}</div>
            <div className="stat-label">Today's Appointments</div>
            <div className="stat-delta">
              <ArrowUpRight size={13} />
              {appointments.length} scheduled
            </div>
          </div>
          <svg className="stat-wave" viewBox="0 0 100 60" fill="none">
            <path d="M0 60C30 50 50 35 70 45C85 52 95 38 100 30V60H0Z" fill="#FEF3C7" />
          </svg>
        </div>
      </div>

      {/* Care Team Workload Status Overview Widget */}
      <div
        className="panel"
        style={{
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
          background: '#FFFFFF',
          border: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#E8F1EE',
              color: '#2F6F5E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Care Team Workload Balancer
              </h4>
              {imbalance.hasImbalance && (
                <span style={{ fontSize: 11, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                  Imbalance Detected
                </span>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Active load distribution: <strong>{workloads.filter((w) => w.level === 'HIGH').length} High</strong> ·{' '}
              <strong>{workloads.filter((w) => w.level === 'MODERATE').length} Moderate</strong> ·{' '}
              <strong>{workloads.filter((w) => w.level === 'LOW').length} Low</strong> workload staff
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => navigate('/care-dependency-map')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <GitFork size={13} />
            <span>Care Dependency Map</span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => navigate('/doctor')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>Doctor Station</span>
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => navigate('/caregivers?tab=workload')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>Open Workload Balancer</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dash-grid">
        {/* Left Column: Today's Care Schedule */}
        <div className="panel" style={{ borderRadius: 16 }}>
          <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Today's Care Schedule</h3>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>Facility-wide timeline for 6 Sept</div>
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/schedule')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <span>View full schedule</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="panel-body" style={{ padding: '0 24px 20px' }}>
            <div className="timeline-custom-list">
              {todaysScheduleItems.map((item) => (
                <div className="timeline-item-row" key={item.title}>
                  <div className="timeline-dot-line">
                    <div className="timeline-dot-pill" style={{ background: item.dotColor }} />
                    <div className="timeline-time-text">{item.time}</div>
                    <div>
                      <div className="timeline-title-text">{item.title}</div>
                      <div className="timeline-room-text">{item.room}</div>
                    </div>
                  </div>
                  <div>
                    <span className={`timeline-badge ${item.statusClass}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Medication Summary & Quote Card */}
        <div className="stack-gap">
          {/* Medication Summary */}
          <div className="panel" style={{ borderRadius: 16 }}>
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pill size={18} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Medication Summary</h3>
              </div>
              <button
                className="icon-btn"
                onClick={() => navigate('/medications')}
                aria-label="View medications"
                style={{ width: 32, height: 32, border: 'none', background: 'transparent' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="panel-body" style={{ padding: '10px 22px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 16 }}>
                {/* Donut Chart Ring */}
                <div
                  style={{
                    position: 'relative',
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    background: 'conic-gradient(#10B981 0% 67%, #F59E0B 67% 85%, #E2E8F0 85% 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius: '50%',
                      background: 'var(--surface-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>67%</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>6 of 9 doses</span>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ color: 'var(--text-primary)', width: 56 }}>Taken</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>6</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                    <span style={{ color: 'var(--text-primary)', width: 56 }}>Pending</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>3</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                    <span style={{ color: 'var(--text-primary)', width: 56 }}>Missed</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspirational Quote Card */}
          <div
            style={{
              background: '#EBF3FB',
              border: '1px solid var(--border-hairline)',
              borderRadius: 16,
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 }}>
              <span style={{ fontSize: 26, color: '#0066CC', fontWeight: 800, lineHeight: 1 }}>❝</span>
              <div style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: 15, color: '#0F172A', fontWeight: 600 }}>
                Better Care<br />
                Happier Lives &mdash;
              </div>
            </div>

            {/* Decorative botanical leaves on the right */}
            <svg width="60" height="50" viewBox="0 0 60 50" fill="none" style={{ opacity: 0.45, zIndex: 1 }}>
              <path d="M60 50C45 40 40 25 45 10C50 2 58 0 60 0C60 15 55 35 60 50Z" fill="#0284C7" />
              <path d="M45 45C32 38 28 22 35 12C40 5 45 4 45 4C45 16 40 32 45 45Z" fill="#38BDF8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
