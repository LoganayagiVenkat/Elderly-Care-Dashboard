import { useState, useMemo } from 'react';
import { Pill, CalendarClock, HeartPulse, UserCog, Siren, Check } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Pagination from '../components/Pagination.jsx';

const ICONS = {
  medication: Pill,
  appointment: CalendarClock,
  health: HeartPulse,
  caregiver: UserCog,
  emergency: Siren,
};

export default function Notifications() {
  const { notificationList, markAsRead, markAllAsRead, removeNotification } = useApp();

  // Pagination for Notifications
  const [notifPage, setNotifPage] = useState(1);
  const [notifLimit, setNotifLimit] = useState(6);
  const notifTotalPages = Math.ceil(notificationList.length / notifLimit) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (notifPage - 1) * notifLimit;
    return notificationList.slice(start, start + notifLimit);
  }, [notificationList, notifPage, notifLimit]);

  const hasUnread = notificationList.some((n) => !(n.isRead || n.read));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p className="desc">Medication reminders, appointments, health alerts and system updates.</p>
        </div>
        {hasUnread && (
          <div className="page-actions">
            <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
              <Check size={14} /> Mark All as Read
            </button>
          </div>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        {paginatedNotifications.map((n) => {
          const Icon = ICONS[n.type] || Pill;
          const isMedication = n.type === 'medication';
          const isUnread = !(n.isRead || n.read);
          return (
            <div key={n.id} className={`notif-item type-${n.type} ${isUnread ? 'unread' : ''}`} style={{ padding: '18px 22px' }}>
              <div className="n-icon"><Icon size={17} /></div>
              <div className="n-body">
                <div className="n-title">{n.title}</div>
                <div className="n-meta">{n.time} · {n.patient}</div>
                <div className="n-desc">{n.detail ? `${n.detail} — ` : ''}{n.desc || n.message}</div>
                {isMedication && n.actionable && isUnread && (
                  <div className="n-actions">
                    <button className="btn btn-terracotta btn-sm" onClick={() => markAsRead(n.id)}>
                      <Check size={13} /> Mark as Taken
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => removeNotification(n.id)}>
                      Remind Later
                    </button>
                  </div>
                )}
                {!isMedication && isUnread && (
                  <div className="n-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => markAsRead(n.id)}>
                      <Check size={13} /> Mark as Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {notificationList.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            You&rsquo;re all caught up — no notifications right now.
          </div>
        )}

        {notificationList.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-hairline)' }}>
            <Pagination
              page={notifPage}
              totalPages={notifTotalPages}
              total={notificationList.length}
              limit={notifLimit}
              onPageChange={setNotifPage}
              onLimitChange={setNotifLimit}
              showInfo={true}
              showPageSize={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
