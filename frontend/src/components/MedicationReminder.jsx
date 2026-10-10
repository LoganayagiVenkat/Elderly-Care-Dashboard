import { useEffect, useRef, useMemo } from 'react';
import { Pill, X, Clock, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { isReminderForUser } from '../utils/scope.js';

function playMedicationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playNote = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    // Gentle pleasant chime (C5 -> E5)
    playNote(523.25, 0, 0.25);
    playNote(659.25, 0.12, 0.35);
  } catch { }
}

/**
 * Renders any active medication reminder popups strictly scoped to the logged-in user.
 * - Admin NEVER receives medication reminder popups ("adminke vara koodathu").
 * - Patient receives reminders sent for them (by Admin, Caregiver, Family, or scheduled by Patient).
 * - Caregiver receives reminders sent by Admin for their assigned residents.
 * - Family receives reminders sent by Admin for their resident.
 */
export default function MedicationReminder() {
  const { user, reminderQueue, dismissReminder, markAsRead, residents } = useApp();
  const chimedIdsRef = useRef(new Set());

  // Filter reminderQueue strictly by role and resident mapping
  const visibleReminders = useMemo(() => {
    if (!user || user.role === 'admin') return [];
    return reminderQueue.filter((r) => isReminderForUser(r, user, residents));
  }, [user, reminderQueue, residents]);

  // Play gentle chime when a new visible reminder arrives
  useEffect(() => {
    if (visibleReminders.length > 0) {
      let hasNew = false;
      visibleReminders.forEach((r) => {
        if (!chimedIdsRef.current.has(r.id)) {
          chimedIdsRef.current.add(r.id);
          hasNew = true;
        }
      });
      if (hasNew) {
        playMedicationChime();
      }
    }
  }, [visibleReminders]);

  if (visibleReminders.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 95,
        right: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 9999,
        width: 360,
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      {visibleReminders.map((r) => {
        const senderBadge =
          r.senderRole === 'admin'
            ? 'From Facility Admin'
            : r.senderRole === 'caregiver'
              ? 'From Caregiver'
              : r.senderRole === 'family'
                ? 'From Family'
                : 'Personal Medication Alarm';

        return (
          <div
            key={r.id}
            className="panel animate-fade-in"
            style={{
              boxShadow: '0 12px 32px rgba(180, 83, 9, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
              borderColor: '#FCD34D',
              borderWidth: 1.5,
              borderRadius: 14,
              overflow: 'hidden',
              background: '#FFFDF7',
            }}
          >
            <div style={{ display: 'flex', gap: 12, padding: '16px 18px', background: '#FFFBEB' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #D97706, #B45309)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(180, 83, 9, 0.3)',
                }}
              >
                <Pill size={20} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#B45309',
                    }}
                  >
                    {senderBadge}
                  </span>
                  <span style={{ fontSize: 11.5, color: '#92400E', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> {r.time}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4, color: '#1E293B' }}>
                  {r.medicine || r.patient}
                </div>

                <div style={{ fontSize: 13, color: '#475569', marginTop: 3, lineHeight: 1.4 }}>
                  {r.detail || r.desc}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn-sm"
                    style={{
                      background: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 600,
                      padding: '6px 14px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                    onClick={() => {
                      markAsRead(r.id);
                      dismissReminder(r.id);
                    }}
                  >
                    <UserCheck size={14} /> Mark as Taken
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 12.5,
                    }}
                    onClick={() => dismissReminder(r.id)}
                  >
                    Remind Later
                  </button>
                </div>
              </div>

              <button
                onClick={() => dismissReminder(r.id)}
                aria-label="Dismiss"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  flexShrink: 0,
                  padding: 2,
                  marginTop: -2,
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
