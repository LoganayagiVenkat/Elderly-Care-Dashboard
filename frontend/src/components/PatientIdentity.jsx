export default function PatientIdentity({ initials, name, meta, size = 'md', tone = 'sage' }) {
  const toneClass = tone === 'terracotta' ? 'tone-terracotta' : tone === 'forest' ? 'tone-forest' : '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className={`identity-tile size-${size} ${toneClass}`}>{initials}</div>
      <div>
        <div className="row-name">{name}</div>
        {meta && <div className="row-sub">{meta}</div>}
      </div>
    </div>
  );
}
