import { Link } from 'react-router-dom';
import { Clock, User, Network, ChevronRight, X, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function RecentlyAccessedWidget({ title = 'Recently Accessed Records', maxItems = 6, showClear = true }) {
  const { recentlyAccessed = [], clearRecentlyAccessed } = useApp();

  if (!recentlyAccessed || recentlyAccessed.length === 0) {
    return null;
  }

  const items = recentlyAccessed.slice(0, maxItems);

  return (
    <div className="recently-accessed-card" style={{
      background: 'var(--surface-card, #FFFFFF)',
      border: '1px solid var(--border-hairline, rgba(0,0,0,0.08))',
      borderRadius: 14,
      padding: '16px 20px',
      marginBottom: 20,
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          <Clock size={15} style={{ color: 'var(--color-brand-primary, #0D9488)' }} />
          <span>{title}</span>
          <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--surface-sunken, #F1F5F9)', padding: '2px 8px', borderRadius: 999, color: 'var(--text-muted)' }}>
            {items.length} items
          </span>
        </div>

        {showClear && items.length > 0 && (
          <button
            onClick={clearRecentlyAccessed}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11.5,
              fontWeight: 500,
              color: 'var(--text-muted, #64748B)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              borderRadius: 6
            }}
            title="Clear recently accessed history"
          >
            <X size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 10
      }}>
        {items.map((item) => {
          const isMap = item.type === 'map';
          return (
            <Link
              key={`${item.type}-${item.id}`}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                background: 'var(--surface-sunken, #F8FAFC)',
                border: '1px solid var(--border-hairline, rgba(0,0,0,0.05))',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.18s ease',
              }}
              className="recent-access-chip"
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isMap ? 'rgba(99, 102, 241, 0.12)' : 'rgba(13, 148, 136, 0.12)',
                color: isMap ? '#4F46E5' : '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isMap ? <Network size={16} /> : <User size={16} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>{item.subtitle || 'Profile'}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(item.timestamp)}</span>
                </div>
              </div>

              <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.6, flexShrink: 0 }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
