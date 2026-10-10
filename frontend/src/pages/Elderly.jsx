import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, MapPin, Plus, UserPlus, X, AlertCircle, CheckCircle2, Trash2, ArrowUpDown, GitFork } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getScopedResidents } from '../utils/scope.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PatientIdentity from '../components/PatientIdentity.jsx';
import Pagination from '../components/Pagination.jsx';

const SORT_LABELS = {
  name: 'Name (A → Z)',
  name_desc: 'Name (Z → A)',
  age_asc: 'Age (Youngest First)',
  age_desc: 'Age (Oldest First)',
  room: 'Room Number',
  status: 'Health Status (Critical First)',
  id: 'Resident ID',
};

function highlightMatch(text = '', query = '') {
  if (!query || !query.trim() || !text) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const INITIAL_FORM_STATE = {
  name: '',
  age: '',
  gender: 'Male',
  room: '',
  caregiver: '',
  status: 'stable',
  phone: '',
  emergencyContact: '',
  notes: '',
};

export default function Elderly() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, residents, addResident, deleteResident, caregivers = [] } = useApp();

  const caregiverOptions = useMemo(() => {
    const names = (caregivers || []).map((c) => c.name).filter(Boolean);
    return names.length > 0
      ? Array.from(new Set(names))
      : ['Priya Nair', 'Anand Raj', 'Deepa Suresh', 'Kavitha Reddy', 'Suresh Babu', 'Vikram Menon'];
  }, [caregivers]);

  const elderlyResidents = useMemo(() => getScopedResidents(user, residents), [user, residents]);

  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [caregiverFilter, setCaregiverFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchWrapRef = useRef(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  // Modal & form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setQuery(q);
    }
  }, [searchParams]);

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = elderlyResidents.filter((r) => {
      const matchesQuery =
        !q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.id || '').toLowerCase().includes(q) ||
        (r.room || '').toLowerCase().includes(q) ||
        (r.condition || '').toLowerCase().includes(q) ||
        (r.caregiver || '').toLowerCase().includes(q) ||
        (r.phone || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesGender = genderFilter === 'all' || r.gender === genderFilter;
      const matchesCaregiver = caregiverFilter === 'all' || r.caregiver === caregiverFilter;
      return matchesQuery && matchesStatus && matchesGender && matchesCaregiver;
    });

    const statusPriority = { critical: 3, attention: 2, stable: 1 };

    list.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'age_asc') {
        return (parseInt(a.age, 10) || 0) - (parseInt(b.age, 10) || 0);
      }
      if (sortBy === 'age_desc') {
        return (parseInt(b.age, 10) || 0) - (parseInt(a.age, 10) || 0);
      }
      if (sortBy === 'room') {
        return (a.room || '').localeCompare(b.room || '');
      }
      if (sortBy === 'status') {
        return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      }
      if (sortBy === 'id') {
        return (a.id || '').localeCompare(b.id || '');
      }
      return 0;
    });

    return list;
  }, [query, statusFilter, genderFilter, caregiverFilter, sortBy, elderlyResidents]);

  // Reset to page 1 whenever filters or query change
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, genderFilter, caregiverFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / limit) || 1;
  const paginatedResidents = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredAndSorted.slice(start, start + limit);
  }, [filteredAndSorted, page, limit]);

  const handleOpenModal = () => {
    setFormData({
      ...INITIAL_FORM_STATE,
      caregiver: caregiverOptions[0] || 'Priya Nair',
    });
    setError('');
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }
    const ageNum = parseInt(formData.age, 10);
    if (!formData.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 130) {
      setError('Please enter a valid age between 1 and 130.');
      return;
    }
    if (!formData.gender) {
      setError('Please select a gender.');
      return;
    }
    if (!formData.room.trim()) {
      setError('Room assignment is required (e.g. Willow Room 3).');
      return;
    }
    if (!formData.caregiver) {
      setError('Please assign a caregiver.');
      return;
    }
    if (!formData.status) {
      setError('Please select a status.');
      return;
    }
    if (!formData.emergencyContact.trim()) {
      setError('Emergency Contact details are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        age: ageNum,
        gender: formData.gender,
        room: formData.room.trim(),
        caregiver: formData.caregiver,
        status: formData.status,
        phone: formData.phone.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        notes: formData.notes.trim(),
        condition: formData.notes.trim() || 'General Geriatric Care',
        bloodGroup: 'O+',
      };

      const created = await addResident(payload);

      setIsAddModalOpen(false);
      setFormData(INITIAL_FORM_STATE);
      setSuccessMessage(`Resident ${created.name} (${created.id}) added successfully.`);

      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('[Elderly] Error adding resident:', err);
      setError(err.message || 'Unable to add resident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [residentToDelete, setResidentToDelete] = useState(null);

  const handleConfirmDelete = async () => {
    if (!residentToDelete) return;
    try {
      await deleteResident(residentToDelete.id);
      setSuccessMessage(`✓ Resident "${residentToDelete.name}" (${residentToDelete.id}) deleted successfully.`);
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('[Elderly] Error deleting resident:', err);
      setError(err.message || 'Unable to delete resident. Please try again.');
    } finally {
      setResidentToDelete(null);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1>Elderly Profiles</h1>
          <p className="desc">Professional patient directory for every resident currently under ElderCare&rsquo;s supervision.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="eyebrow mono">{filteredAndSorted.length} of {elderlyResidents.length} residents</span>
          {user?.role === 'admin' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <Plus size={16} />
              <span>Add Elderly</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#065F46',
          border: '1px solid #A7F3D0',
          borderRadius: 10,
          marginBottom: 18,
          fontSize: 13.5,
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', display: 'flex' }}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search & Filter & Sort Toolbar */}
      <div className="toolbar">
        {/* Search input with live dropdown below */}
        <div className="search-box-wrapper" ref={searchWrapRef}>
          <div className="search-box">
            <Search size={15} />
            <input
              placeholder="Search by name, ID, room, condition..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsDropdownOpen(false);
              }}
              aria-label="Search residents"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setQuery('');
                  setIsDropdownOpen(false);
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Instant Dropdown below the search box */}
          {isDropdownOpen && query.trim() && (
            <div className="search-suggestions-dropdown">
              <div className="search-dropdown-header">
                <span>
                  Searching for: <strong>&ldquo;{query}&rdquo;</strong>
                </span>
                <span className="search-count-badge">
                  {filteredAndSorted.length} match{filteredAndSorted.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {filteredAndSorted.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                    No resident found matching &ldquo;{query}&rdquo;
                  </p>
                  <span style={{ fontSize: 11.5 }}>
                    Try searching by first name, room (e.g. Willow), or ID (e.g. EC-001)
                  </span>
                </div>
              ) : (
                filteredAndSorted.slice(0, 6).map((r) => (
                  <div
                    key={r.id}
                    className="search-dropdown-item"
                    onClick={() => {
                      navigate(`/elderly/${r.id}`);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="search-dropdown-item-info">
                      <div className="identity-tile size-sm">
                        {r.initials || (r.name || 'P').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {highlightMatch(r.name, query)}
                          <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                            ({highlightMatch(r.id, query)})
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                          <span>Room: {highlightMatch(r.room, query)}</span>
                          {r.condition && <span>• {highlightMatch(r.condition, query)}</span>}
                          <span>• {r.age} yrs</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))
              )}

              {filteredAndSorted.length > 6 && (
                <div
                  style={{
                    padding: '8px 14px',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--color-forest, #0284C7)',
                    fontWeight: 600,
                    background: 'var(--surface-sunken)',
                    borderTop: '1px solid var(--border-hairline)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  View all {filteredAndSorted.length} matching residents below ↓
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sorting Dropdown Control */}
        <div className="sort-control-wrap">
          <ArrowUpDown size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sort residents list"
            style={{ fontWeight: 600, minWidth: 170 }}
          >
            <option value="name">Sort: Name (A → Z)</option>
            <option value="name_desc">Sort: Name (Z → A)</option>
            <option value="age_asc">Sort: Age (Youngest)</option>
            <option value="age_desc">Sort: Age (Oldest)</option>
            <option value="room">Sort: Room Number</option>
            <option value="status">Sort: Health Status (Critical First)</option>
            <option value="id">Sort: Resident ID</option>
          </select>
        </div>

        {/* Filters */}
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="stable">Stable</option>
          <option value="attention">Attention</option>
          <option value="critical">Critical</option>
        </select>
        <select className="filter-select" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="all">All Genders</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </select>
        <select className="filter-select" value={caregiverFilter} onChange={(e) => setCaregiverFilter(e.target.value)}>
          <option value="all">All Caregivers</option>
          {caregiverOptions.map((cg) => (
            <option key={cg} value={cg}>{cg}</option>
          ))}
        </select>
      </div>

      {/* Active Search & Sort Feedback Banner */}
      {query.trim() && (
        <div className="search-active-banner">
          <div className="search-active-pill">
            <Search size={14} style={{ color: 'var(--color-forest, #0284C7)' }} />
            <span>
              Searching for: <strong>&ldquo;{query}&rdquo;</strong>
            </span>
            <span className="search-count-badge">
              {filteredAndSorted.length} resident{filteredAndSorted.length !== 1 ? 's' : ''} found
            </span>
            <button
              type="button"
              className="search-clear-chip"
              onClick={() => {
                setQuery('');
                setIsDropdownOpen(false);
              }}
              title="Clear search query"
            >
              <X size={12} />
              <span>Clear Search</span>
            </button>
          </div>

          <div className="sort-status-info">
            <ArrowUpDown size={13} style={{ color: 'var(--color-forest, #0284C7)' }} />
            <span>
              Sorted by: <strong>{SORT_LABELS[sortBy] || 'Name'}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Residents Grid */}
      <div className="grid-auto">
        {paginatedResidents.map((r) => (
          <div
            className="panel"
            key={r.id}
            style={{ padding: 20, cursor: 'pointer', transition: 'box-shadow 0.15s ease' }}
            onClick={() => navigate(`/elderly/${r.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <PatientIdentity initials={r.initials} name={highlightMatch(r.name, query)} meta={highlightMatch(r.id, query)} size="lg" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {user?.role === 'admin' && (
                  <button
                    type="button"
                    title={`Delete ${r.name}`}
                    style={{
                      border: 'none',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setResidentToDelete(r);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '16px 0 12px', flexWrap: 'wrap' }}>
              <StatusBadge status={r.status} />
              <span className="badge badge-neutral">{r.age} Years · {r.gender}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MapPin size={13} /> {highlightMatch(r.room, query)}
            </div>
            <div className="kv-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="k">Caregiver</span>
              <span className="v">{highlightMatch(r.caregiver, query)}</span>
            </div>
            <div className="kv-row" style={{ borderTop: '1px solid var(--border-hairline)' }}>
              <span className="k">Last Assessment</span>
              <span className="v">{r.lastAssessment || 'Today'}</span>
            </div>
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/care-dependency-map?residentId=${r.id}`);
                }}
                style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', color: 'var(--color-primary)' }}
                title={`Open ${r.name}'s Care Dependency Map`}
              >
                <GitFork size={13} />
                <span>Dependency Map</span>
              </button>
            </div>
          </div>
        ))}
        {filteredAndSorted.length === 0 && (
          <div className="panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <Search size={32} style={{ opacity: 0.35, margin: '0 auto 12px', display: 'block' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              No residents match your search
            </h3>
            <p style={{ fontSize: 13, maxWidth: 440, margin: '0 auto 16px' }}>
              {query.trim() ? (
                <>No resident found matching &ldquo;<strong>{query}</strong>&rdquo; with the current filters.</>
              ) : (
                <>No resident records match the selected status, gender, or caregiver filters.</>
              )}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
                setGenderFilter('all');
                setCaregiverFilter('all');
                setSortBy('name');
              }}
            >
              Reset All Filters & Search
            </button>
          </div>
        )}
      </div>

      {/* Pagination Component */}
      {filteredAndSorted.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredAndSorted.length}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            showInfo={true}
            showPageSize={true}
          />
        </div>
      )}

      {/* Add Elderly Modal */}
      {isAddModalOpen && (
        <div className="doc-modal-overlay" onClick={() => !isSubmitting && setIsAddModalOpen(false)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="doc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={18} style={{ color: 'var(--color-forest, #0284C7)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add New Elderly Resident</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => !isSubmitting && setIsAddModalOpen(false)}
                aria-label="Close modal"
                disabled={isSubmitting}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="doc-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <AlertCircle size={16} color="#DC2626" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kumar Raj"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Age *</label>
                    <input
                      type="number"
                      placeholder="76"
                      min="1"
                      max="130"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                      required
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Room Assignment *</label>
                    <input
                      type="text"
                      placeholder="e.g. Willow Room 3"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                      required
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Health Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                      required
                    >
                      <option value="stable">Stable</option>
                      <option value="attention">Attention</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Assigned Caregiver *</label>
                    <select
                      value={formData.caregiver}
                      onChange={(e) => setFormData({ ...formData, caregiver: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                      required
                    >
                      {caregiverOptions.map((cg) => (
                        <option key={cg} value={cg}>{cg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98410 33445"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                    />
                  </div>
                </div>

                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Emergency Contact *</label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar · Son · +91 99400 11876"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4 }}
                    required
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>General Notes</label>
                  <textarea
                    rows="2"
                    placeholder="Medical history, dietary needs, mobility or special preferences..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-hairline)', background: 'var(--surface-card)', marginTop: 4, resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="doc-modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                      <span>Adding Resident...</span>
                    </>
                  ) : (
                    <span>Add Resident</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Resident Confirmation Modal */}
      {residentToDelete && (
        <div className="doc-modal-overlay" onClick={() => setResidentToDelete(null)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="doc-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={20} style={{ color: '#DC2626' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#DC2626' }}>
                  Delete Elderly Resident
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setResidentToDelete(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-main, #334155)', lineHeight: 1.5 }}>
                Are you sure you want to permanently remove <strong>{residentToDelete.name}</strong> ({residentToDelete.id}) from the facility?
              </p>
              <div
                style={{
                  marginTop: 14,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#991B1B',
                  lineHeight: 1.4,
                }}
              >
                ⚠️ This will remove the resident from all pages, care plans, and directories across the system.
              </div>
            </div>

            <div className="doc-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setResidentToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '8px 16px', borderRadius: 8 }}
                onClick={handleConfirmDelete}
              >
                <Trash2 size={15} /> Delete Resident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
