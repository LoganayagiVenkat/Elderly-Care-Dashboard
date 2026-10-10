import { useState } from 'react';
import { TrendingUp, CalendarCheck, Sparkles, UserCog } from 'lucide-react';
import { reportData } from '../data/dummyData';

export default function Reports() {
  const [range, setRange] = useState('7');
  const data = reportData[range];
  const maxVal = Math.max(...data.adherence);

  const summaryCards = [
    { label: 'Appointment Completion', value: data.appointmentCompletion, icon: CalendarCheck },
    { label: 'Activity Participation', value: data.activityParticipation, icon: Sparkles },
    { label: 'Caregiver Workload Index', value: data.caregiverWorkload, icon: UserCog },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="desc">Trends in medication adherence, appointments, activities and caregiver workload.</p>
        </div>
        <div className="range-toggle">
          {['7', '30', '90'].map((r) => (
            <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>
              {r} Days
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <div>
            <h3><TrendingUp size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Medication Adherence Trend</h3>
            <div className="sub">Percentage of scheduled doses taken on time</div>
          </div>
        </div>
        <div className="panel-body">
          <div className="bar-chart">
            {data.adherence.map((v, i) => (
              <div className="bar-col" key={data.labels[i]}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{v}%</span>
                <div className="bar-fill" style={{ height: `${(v / (maxVal + 8)) * 100}%` }} />
                <span className="bar-label">{data.labels[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3">
        {summaryCards.map((c) => (
          <div className="panel" key={c.label} style={{ padding: 20 }}>
            <div className="stat-icon" style={{ marginBottom: 14 }}><c.icon size={17} /></div>
            <div className="progress-row" style={{ marginBottom: 10 }}>
              <div className="progress-track"><div className="progress-fill terracotta" style={{ width: `${c.value}%` }} /></div>
              <span className="progress-pct">{c.value}%</span>
            </div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
