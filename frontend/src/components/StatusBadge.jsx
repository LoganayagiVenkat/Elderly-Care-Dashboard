const CONFIG = {
  stable: { cls: 'badge-stable', label: 'Stable' },
  attention: { cls: 'badge-attention', label: 'Attention' },
  critical: { cls: 'badge-critical', label: 'Critical' },
  active: { cls: 'badge-stable', label: 'Active' },
  inactive: { cls: 'badge-neutral', label: 'Inactive' },
  paused: { cls: 'badge-attention', label: 'Paused' },
  completed: { cls: 'badge-stable', label: 'Completed' },
  pending: { cls: 'badge-attention', label: 'Pending' },
  upcoming: { cls: 'badge-neutral', label: 'Upcoming' },
  'in-progress': { cls: 'badge-attention', label: 'In Progress' },
  missed: { cls: 'badge-critical', label: 'Missed' },
  confirmed: { cls: 'badge-stable', label: 'Confirmed' },
  reviewed: { cls: 'badge-stable', label: 'Reviewed' },
  'pending review': { cls: 'badge-attention', label: 'Pending Review' },
};

export default function StatusBadge({ status, label }) {
  const cfg = CONFIG[status] || { cls: 'badge-neutral', label: label || status };
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" />
      {label || cfg.label}
    </span>
  );
}
