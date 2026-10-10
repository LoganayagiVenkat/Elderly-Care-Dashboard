import { NavLink, useNavigate } from 'react-router-dom';
import { Heart, HeartHandshake, LogOut, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getNavSections, ROLE_LABELS } from '../data/roleConfig.js';

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const { user, unreadCount, unreadVoicemailCount, logout, t } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navSections = getNavSections(user?.role || 'admin');

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <button className="sidebar-collapse-btn" onClick={onToggleCollapse} aria-label="Toggle sidebar">
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="sidebar-brand">
        <div className="brand-mark">
          <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="9" fill="rgba(232, 245, 238, 0.16)" stroke="rgba(209, 231, 221, 0.4)" strokeWidth="1.2" />
            <path d="M18 10C14.8 6.5 10.2 8.5 10.2 13.5C10.2 18 18 25 18 25C18 25 25.8 18 25.8 13.5C25.8 8.5 21.2 6.5 18 10Z" fill="#22C55E" opacity="0.9" />
            <circle cx="18" cy="14" r="2.6" fill="#FBBF24" />
          </svg>
        </div>
        <div className="brand-text">
          <h1>ElderCare</h1>
          <span style={{ fontSize: '11px', color: '#B4CEBF', letterSpacing: '0.02em', fontWeight: 500, display: 'block', marginTop: '2px' }}>
            Care Today, Brighter Tomorrows
          </span>
        </div>
      </div>

      <nav className="sidebar-scroll">
        {navSections.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-section-label">{t(section.label)}</div>
            {section.items.map((item) => {
              const to = item.to === '/elderly/:me' ? `/elderly/${user?.residentId || ''}` : item.to;
              return (
                <NavLink
                  key={item.label}
                  to={to}
                  onClick={onCloseMobile}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={17} />
                  <span className="label">{t(item.label)}</span>
                  {item.badgeKey === 'unread' && unreadCount > 0 && (
                    <span className="badge-count">{unreadCount}</span>
                  )}
                  {item.badgeKey === 'voicemails' && unreadVoicemailCount > 0 && (
                    <span className="badge-count" style={{ background: '#059669' }}>{unreadVoicemailCount}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="identity-tile size-sm" style={{ background: '#0F5132', color: '#FFFFFF', borderRadius: '50%', fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.2)' }}>
            {user?.initials || user?.name?.[0] || 'A'}
          </div>
          <div className="u-info">
            <div className="name" style={{ color: '#FFFFFF', fontWeight: 600 }}>{user?.name || 'Admin'}</div>
            <div className="role" style={{ color: '#B4CEBF' }}>{t(ROLE_LABELS[user?.role] || 'ElderCare')}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>{t('Sign Out')}</span>
        </button>
      </div>
    </aside>
  );
}
