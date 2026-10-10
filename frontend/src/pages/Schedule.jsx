import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { dailySchedule } from '../data/dummyData';
import { isSameDay, addDays, toISODate } from '../utils/dateUtils.js';

function parseTimeToMinutes(label) {
  const [time, meridian] = label.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (meridian === 'PM' && h !== 12) h += 12;
  if (meridian === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export default function Schedule() {
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isToday = isSameDay(selectedDate, now);
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedMidnight = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const isPast = selectedMidnight < nowMidnight;
  const isFuture = selectedMidnight > nowMidnight;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const withStatus = dailySchedule.map((item, i) => {
    const itemMinutes = parseTimeToMinutes(item.time);
    const nextMinutes = i < dailySchedule.length - 1 ? parseTimeToMinutes(dailySchedule[i + 1].time) : 24 * 60;
    
    let state = 'upcoming';
    if (isToday) {
      if (nowMinutes >= itemMinutes && nowMinutes < nextMinutes) state = 'current';
      else if (nowMinutes >= nextMinutes) state = 'done';
    } else if (isPast) {
      state = 'done';
    } else {
      state = 'upcoming';
    }
    return { ...item, state };
  });

  const selectedFormatted = selectedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const liveTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const goOffset = (delta) => setSelectedDate((d) => addDays(d, delta));
  const goToday = () => setSelectedDate(new Date());

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Daily Schedule</h1>
          <p className="desc">Facility-wide timeline of care activities, meals and medication rounds for each day.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="eyebrow mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} color="var(--color-forest)" />
            Live time · {liveTime}
          </span>
        </div>
      </div>

      <div className="panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => goOffset(-1)} aria-label="Previous day">
              <ChevronLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
              <Calendar size={16} color="var(--color-forest)" />
              <span>{selectedFormatted}</span>
              {isToday && <span className="badge badge-stable" style={{ fontSize: 11 }}>Today</span>}
              {isPast && <span className="badge badge-neutral" style={{ fontSize: 11 }}>Past Day</span>}
              {isFuture && <span className="badge badge-attention" style={{ fontSize: 11 }}>Upcoming Day</span>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => goOffset(1)} aria-label="Next day">
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className={`btn btn-sm ${isToday ? 'btn-primary' : 'btn-secondary'}`}
              onClick={goToday}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={13} /> Jump to Today
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Schedule Timeline</h3>
            <div className="sub">
              {isToday ? 'Real-time schedule for today — current activity highlighted' : `Scheduled itinerary for ${selectedFormatted}`}
            </div>
          </div>
          {isToday && (
            <span className="mono" style={{ fontSize: 12, color: 'var(--color-forest)', fontWeight: 600 }}>
              ● Live Clock Active
            </span>
          )}
        </div>
        <div className="panel-body">
          <div className="timeline">
            {withStatus.map((item) => (
              <div className={`timeline-item ${item.state === 'done' ? 'is-done' : item.state === 'current' ? 'is-current' : ''}`} key={item.title}>
                <div className="timeline-dot" />
                <div className="timeline-time">
                  {item.time}
                  {item.state === 'current' && (
                    <span className="badge badge-attention" style={{ marginLeft: 10 }}>Happening Now</span>
                  )}
                  {item.state === 'done' && isToday && (
                    <span style={{ marginLeft: 10, fontSize: 11.5, color: 'var(--text-muted)' }}>Completed</span>
                  )}
                </div>
                <div className="timeline-title">{item.title}</div>
                <div className="timeline-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

