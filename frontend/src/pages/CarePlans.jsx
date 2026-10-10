import { useState, useEffect, useMemo } from 'react';
import { CalendarClock, UserCog } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { scopeByResident } from '../utils/scope.js';
import Pagination from '../components/Pagination.jsx';

export default function CarePlans() {
  const { user, carePlans: allCarePlans, toggleCarePlanTask } = useApp();
  const carePlans = useMemo(() => scopeByResident(user, allCarePlans || [], 'residentId'), [user, allCarePlans]);
  const [animated, setAnimated] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const paginatedPlans = useMemo(() => {
    const start = (page - 1) * limit;
    return carePlans.slice(start, start + limit);
  }, [carePlans, page, limit]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Care Plans</h1>
          <p className="desc">Individual goals, daily tasks and progress tracked for every resident.</p>
        </div>
      </div>

      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {paginatedPlans.map((p) => (
          <div className="plan-card" key={p.id}>
            <div className="p-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="identity-tile size-md">{p.initials}</div>
                <div>
                  <div className="p-title">{p.patient}</div>
                  <div className="row-sub">{p.goal}</div>
                </div>
              </div>
            </div>

            <div className="progress-row" style={{ marginBottom: 16 }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: animated ? `${p.progress}%` : '0%', transition: 'width 0.3s ease' }} />
              </div>
              <span className="progress-pct">{p.progress}%</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              {p.tasks.map((t) => (
                <div
                  className={`plan-task ${t.done ? 'done' : ''}`}
                  key={t.label}
                  onClick={() => toggleCarePlanTask(p.id, t.label)}
                  role="checkbox"
                  aria-checked={t.done}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleCarePlanTask(p.id, t.label);
                    }
                  }}
                  title={`Click to mark as ${t.done ? 'pending' : 'completed'}`}
                >
                  <span className="chk">{t.done ? '✓' : ''}</span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', borderTop: '1px solid var(--border-hairline)', paddingTop: 12 }}>
              <span><UserCog size={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />{p.caregiver}</span>
              <span><CalendarClock size={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Review {p.reviewDate}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <Pagination
          currentPage={page}
          totalRecords={carePlans.length}
          recordsPerPage={limit}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setLimit(newSize);
            setPage(1);
          }}
          itemLabel="care plans"
        />
      </div>
    </div>
  );
}
