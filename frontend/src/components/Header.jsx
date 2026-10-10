import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, Clock, Palette, Check, User, Database, Search, X, ArrowUpDown, ChevronRight, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import NotificationPanel from './NotificationPanel.jsx';
import { COLOR_THEMES } from '../data/themeConfig.js';

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

const TITLES = {
  '/dashboard': ['Dashboard', 'Overview of today\u2019s care operations'],
  '/elderly': ['Elderly Profiles', 'Resident directory and records'],
  '/health': ['Care Records', 'Manually recorded vitals and wellness observations'],
  '/medications': ['Medications', 'Doses, reminders and adherence'],
  '/appointments': ['Appointments', 'Doctor visits and consultations'],
  '/care-dependency-map': ['Care Dependency Map', 'Visually connect related care events, emergencies, specialist availability, appointments, and clinical follow-ups'],
  '/doctor': ['Doctor Station', 'Physician dashboard and clinical operations'],
  '/caregivers': ['Care Team', 'Staff directory, shifts and care operations'],
  '/care-plans': ['Care Plans', 'Goals, tasks and progress'],
  '/schedule': ['Daily Schedule', 'Facility-wide daily timeline'],
  '/emergency': ['Emergency', 'Contacts and emergency assistance'],
  '/activities': ['Activities', 'Wellness and recreation programs'],
  '/reports': ['Reports', 'Trends across the care operation'],
  '/documents': ['Documents', 'Medical records and paperwork'],
  '/notifications': ['Notifications', 'Reminders and system alerts'],
  '/chatbot': ['Care Assistant', 'Rule-based demo assistant'],
  '/voicemails': ['Voice Mails', 'Voice distress notes, audio memos and recorded updates'],
  '/whatsapp': ['Messages', 'Direct WhatsApp messaging and conversation hub'],
  '/messages': ['Messages', 'Direct WhatsApp messaging and conversation hub'],
  '/settings': ['Settings', 'Preferences and account controls'],
};

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Header({ onOpenMobileSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, settings, setSettings, t, language, user, dbStatus, dbDetails, refreshDbConnection, residents = [], caregivers = [] } = useApp();
  const [panelOpen, setPanelOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalOpen, setGlobalOpen] = useState(false);
  const [globalSortBy, setGlobalSortBy] = useState('relevance');
  const headerSearchRef = useRef(null);
  const headerSearchInputRef = useRef(null);
  const now = useClock();
  const wrapRef = useRef(null);
  const paletteWrapRef = useRef(null);

  const currentTheme = settings?.theme || 'light';
  const currentColorTheme = settings?.colorTheme || 'oceanic';

  const toggleTheme = () => {
    setSettings({ theme: currentTheme === 'dark' ? 'light' : 'dark' });
  };

  const isProfileRoute = location.pathname.startsWith('/elderly/');
  const [rawTitle, rawSubtitle] = isProfileRoute
    ? ['Resident Profile', 'Individual care record']
    : TITLES[location.pathname] || ['ElderCare', ''];

  const title = t(rawTitle);
  const subtitle = t(rawSubtitle);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
      if (paletteWrapRef.current && !paletteWrapRef.current.contains(e.target)) {
        setPaletteOpen(false);
      }
      if (headerSearchRef.current && !headerSearchRef.current.contains(e.target)) {
        setGlobalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        headerSearchInputRef.current?.focus();
        setGlobalOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const globalResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return { residents: [], caregivers: [], navItems: [], total: 0 };

    let matchedResidents = (residents || []).filter((r) =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q) ||
      (r.room || '').toLowerCase().includes(q) ||
      (r.condition || '').toLowerCase().includes(q)
    );

    let matchedCaregivers = (caregivers || []).filter((c) =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );

    const quickPages = [
      { name: 'Dashboard', path: '/dashboard', desc: "Overview of today's operations" },
      { name: 'Elderly Profiles', path: '/elderly', desc: 'Resident directory and records' },
      { name: 'Care Dependency Map', path: '/care-dependency-map', desc: 'Visually connect care events, emergencies and specialists' },
      { name: 'Care Records (Health)', path: '/health', desc: 'Vitals and observations' },
      { name: 'Medications', path: '/medications', desc: 'Doses, reminders and adherence' },
      { name: 'Appointments', path: '/appointments', desc: 'Doctor visits and consultations' },
      { name: 'Doctor Station', path: '/doctor', desc: 'Doctor dashboard and clinical overview' },
      { name: 'Care Team', path: '/caregivers', desc: 'Staff directory, shifts and care operations' },
      { name: 'Messages (WhatsApp)', path: '/whatsapp', desc: 'Conversations and chat history' },
      { name: 'Emergency Support', path: '/emergency', desc: 'SOS and urgent medical assistance' },
      { name: 'Daily Schedule', path: '/schedule', desc: 'Facility daily timeline' },
      { name: 'Documents', path: '/documents', desc: 'Medical records and paperwork' },
    ];

    const matchedPages = quickPages.filter((p) =>
      p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );

    if (globalSortBy === 'name') {
      matchedResidents = [...matchedResidents].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      matchedCaregivers = [...matchedCaregivers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const total = matchedResidents.length + matchedCaregivers.length + matchedPages.length;
    return {
      residents: matchedResidents.slice(0, 4),
      caregivers: matchedCaregivers.slice(0, 3),
      navItems: matchedPages.slice(0, 3),
      total
    };
  }, [globalQuery, residents, caregivers, globalSortBy]);

  const localeMap = {
    ta: 'ta-IN',
    hi: 'hi-IN',
    ml: 'ml-IN',
    te: 'te-IN',
    en: 'en-IN',
  };
  const activeLocale = localeMap[language] || 'en-IN';

  const formattedDate = now.toLocaleDateString(activeLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString(activeLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="icon-btn header-menu-btn" onClick={onOpenMobileSidebar} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <button
          type="button"
          className="header-db-badge"
          onClick={() => {
            if (typeof refreshDbConnection === 'function') {
              refreshDbConnection();
            }
          }}
          title={
            dbStatus === 'connected'
              ? `Connected to MySQL: ${dbDetails?.dbName || 'eldercare_db'} (${dbDetails?.host || 'localhost:3306'}) · Click to refresh`
              : dbStatus === 'connecting'
              ? 'Attempting to connect to MySQL...'
              : 'MySQL is offline · Click to reconnect'
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 20,
            background: dbStatus === 'connected'
              ? 'rgba(34, 197, 94, 0.12)'
              : dbStatus === 'connecting'
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            color: dbStatus === 'connected'
              ? '#16A34A'
              : dbStatus === 'connecting'
              ? '#D97706'
              : '#DC2626',
            border: `1px solid ${
              dbStatus === 'connected'
                ? 'rgba(34, 197, 94, 0.3)'
                : dbStatus === 'connecting'
                ? 'rgba(245, 158, 11, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
            marginLeft: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          <Database size={13} />
          <span>{dbStatus === 'connected' ? 'MySQL Connected' : dbStatus === 'connecting' ? 'Connecting DB...' : 'MySQL Offline'}</span>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: dbStatus === 'connected' ? '#22C55E' : dbStatus === 'connecting' ? '#F59E0B' : '#EF4444',
              display: 'inline-block'
            }}
          />
        </button>
      </div>

      {/* Center Search Bar matching reference image */}
      <div className="header-search-wrap" ref={headerSearchRef} style={{ flex: 1, maxWidth: 520, margin: '0 16px' }}>
        <div className="header-search-box" style={{ background: '#F8FAF9', borderRadius: 24, padding: '8px 16px', border: '1px solid #E2E8E5' }}>
          <Search size={16} style={{ color: '#7E9E8D' }} />
          <input
            ref={headerSearchInputRef}
            type="text"
            placeholder="Search residents, caregivers, or messages..."
            value={globalQuery}
            onChange={(e) => {
              setGlobalQuery(e.target.value);
              setGlobalOpen(true);
            }}
            onFocus={() => setGlobalOpen(true)}
            style={{ fontSize: 13, background: 'transparent', border: 'none', outline: 'none', width: '100%', color: 'var(--text-primary)' }}
          />
          {globalQuery && (
            <button
              type="button"
              onClick={() => setGlobalQuery('')}
              className="icon-btn"
              style={{ padding: 2, width: 20, height: 20 }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        {globalOpen && globalQuery && (
          <div className="header-search-dropdown">
            <div className="header-search-section-title">Search Results ({globalResults.total})</div>
            {globalResults.residents.map((r) => (
              <div
                key={r.id}
                className="header-search-item"
                onClick={() => {
                  navigate(`/elderly/${r.id}`);
                  setGlobalOpen(false);
                }}
                style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <div className="avatar-circle size-sm avatar-mint">{r.initials || r.name?.[0] || 'R'}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Room {r.room} · {r.condition}</div>
                </div>
              </div>
            ))}
            {globalResults.navItems.map((p) => (
              <div
                key={p.path}
                className="header-search-item"
                onClick={() => {
                  navigate(p.path);
                  setGlobalOpen(false);
                }}
                style={{ padding: '8px 14px', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="notif-wrap" ref={wrapRef}>
          <button
            className="icon-btn header-notif-btn"
            onClick={() => setPanelOpen((v) => !v)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
            title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'Notifications'}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  padding: '0 4px',
                  borderRadius: 999,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.45)',
                  border: '2px solid var(--surface-card, #FFFFFF)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {panelOpen && <NotificationPanel onClose={() => setPanelOpen(false)} />}
        </div>

        {/* User initials capsule matching reference image */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="header-user-capsule"
          title="Account Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 8,
            transition: 'background 0.15s ease',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#0F5132',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user?.initials || user?.name?.[0] || 'A'}
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
              {user?.name || 'Admin'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {user?.role ? (user.role === 'admin' ? 'ElderCare' : user.role) : 'ElderCare'}
            </div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />
        </button>

        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {currentTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}

