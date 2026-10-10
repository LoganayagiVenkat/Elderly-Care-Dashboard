import { useState, useMemo } from 'react';
import { PersonStanding, Flower2, Music2, Leaf, BookOpen, Users, Clock, Play, CheckCircle2 } from 'lucide-react';
import { activities as seedActivities } from '../data/dummyData';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';

const ICONS = { PersonStanding, Flower2, Music2, Leaf, BookOpen, Users };

// Upcoming -> Start Activity -> In Progress -> Complete Activity -> Completed
const NEXT_STATUS = { upcoming: 'in-progress', 'in-progress': 'completed' };
const ACTION_LABEL = { upcoming: 'Start Activity', 'in-progress': 'Complete Activity' };
const ACTIVITIES_KEY = 'eldercare_activities_list';

function loadStoredActivities() {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seedActivities;
}

export default function Activities() {
  const { user } = useApp();
  const canManage = user.role === 'admin' || user.role === 'caregiver';
  const [activities, setActivities] = useState(loadStoredActivities);

  // Pagination for Activities Management Table
  const [actPage, setActPage] = useState(1);
  const [actLimit, setActLimit] = useState(5);
  const actTotalPages = Math.ceil(activities.length / actLimit) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (actPage - 1) * actLimit;
    return activities.slice(start, start + actLimit);
  }, [activities, actPage, actLimit]);

  const advanceStatus = (id) => {
    setActivities((prev) => {
      const next = prev.map((a) => (a.id === id && NEXT_STATUS[a.status] ? { ...a, status: NEXT_STATUS[a.status] } : a));
      try {
        localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Activities</h1>
          <p className="desc">Wellness and recreation programs designed to support physical and cognitive health.</p>
        </div>
      </div>

      <div className="grid-auto" style={{ marginBottom: 26 }}>
        {activities.map((a) => {
          const Icon = ICONS[a.icon] || Users;
          const nextLabel = ACTION_LABEL[a.status];
          return (
            <div className="panel" key={a.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="stat-icon" style={{ width: 42, height: 42 }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="row-name" style={{ fontSize: 14.5 }}>{a.name}</div>
                    <div className="row-sub">{a.type}</div>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="kv-list" style={{ marginTop: 16 }}>
                <div className="kv-row"><span className="k"><Clock size={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Schedule</span><span className="v">{a.schedule}</span></div>
                <div className="kv-row"><span className="k">Duration</span><span className="v">{a.duration}</span></div>
                <div className="kv-row" style={{ borderBottom: 'none' }}><span className="k">Facilitator</span><span className="v">{a.facilitator}</span></div>
              </div>
              {canManage && nextLabel && (
                <button className="btn btn-secondary btn-block" style={{ marginTop: 14 }} onClick={() => advanceStatus(a.id)}>
                  {a.status === 'upcoming' ? <Play size={13} /> : <CheckCircle2 size={13} />} {nextLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-header"><h3>Activity Management</h3></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Activity</th><th>Type</th><th>Schedule</th><th>Duration</th>
                <th>Facilitator</th><th>Participants</th><th>Status</th>{canManage && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedActivities.map((a) => {
                const Icon = ICONS[a.icon] || Users;
                const nextLabel = ACTION_LABEL[a.status];
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={15} color="var(--color-forest-deep)" />
                        <span className="row-name">{a.name}</span>
                      </div>
                    </td>
                    <td>{a.type}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{a.schedule}</td>
                    <td>{a.duration}</td>
                    <td>{a.facilitator}</td>
                    <td>{a.participants}</td>
                    <td><StatusBadge status={a.status} /></td>
                    {canManage && (
                      <td>
                        {nextLabel ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => advanceStatus(a.id)}>{nextLabel}</button>
                        ) : (
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <Pagination
            page={actPage}
            totalPages={actTotalPages}
            total={activities.length}
            limit={actLimit}
            onPageChange={setActPage}
            onLimitChange={setActLimit}
            showInfo={true}
            showPageSize={true}
          />
        </div>
      </div>
    </div>
  );
}
