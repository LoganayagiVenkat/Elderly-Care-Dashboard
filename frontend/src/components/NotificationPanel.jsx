import { useNavigate } from 'react-router-dom';
import { Pill, CalendarClock, HeartPulse, UserCog, Siren, Check } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const ICONS = {
  medication: Pill,
  appointment: CalendarClock,
  health: HeartPulse,
  caregiver: UserCog,
  emergency: Siren,
};

export default function NotificationPanel({ onClose }) {
  const { notificationList, markAsRead, markAllAsRead } = useApp();
  const navigate = useNavigate();

  const recent = notificationList.slice(0, 6);

  return (
    <div className="notif-panel">
      <div className="notif-panel-head">
        <h4>Notifications</h4>
        <button className="link-accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={markAllAsRead}>
          Mark all read
        </button>
      </div>
      <div className="notif-list">
        {recent.length === 0 && (
          <div style={{ padding: '30px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            You're all caught up.
          </div>
        )}
        {recent.map((n) => {
          const Icon = ICONS[n.type] || Pill;
          const isUnread = !(n.isRead || n.read);
          const isEmergency = n.type === 'emergency';
          return (
            <div key={n.id} className={`notif-item type-${n.type} ${isUnread ? 'unread' : ''}`}>
              <div className="n-icon">
                <Icon size={16} />
              </div>
              <div className="n-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div className="n-title">{n.title}</div>
                  {isEmergency && (
                    <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                      SOS Active
                    </span>
                  )}
                </div>
                <div className="n-meta">{n.time} · {n.patient}</div>
                <div className="n-desc">{n.detail ? `${n.detail} — ` : ''}{n.desc || n.message}</div>
                <div className="n-actions" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {isEmergency && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: 11, padding: '3px 8px', background: '#DC2626', borderColor: '#DC2626' }}
                        onClick={() => {
                          navigate('/emergency');
                          onClose();
                        }}
                      >
                        <Siren size={11} /> View SOS
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => {
                          navigate('/appointments');
                          onClose();
                        }}
                      >
                        <CalendarClock size={11} /> View Specialist
                      </button>
                    </>
                  )}
                  {isUnread && (
                    <button type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => markAsRead(n.id)}>
                      <Check size={12} /> Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="notif-panel-foot">
        <button
          className="link-accent"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}
