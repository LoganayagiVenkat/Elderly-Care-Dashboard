import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, User, Check, Building2, Stethoscope, ChevronDown, ArrowUpDown } from 'lucide-react';

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

/**
 * PatientSearchBar
 * A scalable search, sort, and autocomplete component for resident selection.
 * Replaces horizontal touch pill buttons, allowing facility staff to quickly
 * lookup any resident out of hundreds by Name, ID, Room, or Condition.
 *
 * @param {Array} residents - Scoped residents list
 * @param {string} selectedId - Currently selected resident ID (e.g. 'EC-005')
 * @param {function} onSelectResident - Callback when a resident is selected: (residentId) => void
 * @param {string} [placeholder] - Optional custom placeholder
 * @param {string} [className] - Optional container className
 */
export default function PatientSearchBar({
  residents = [],
  selectedId,
  onSelectResident,
  placeholder = 'Search patient by name (e.g. Anitha, Lakshmi, Govind), ID, room...',
  className = ''
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [sortBy, setSortBy] = useState('name_asc');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedResident = useMemo(() => {
    return residents.find((r) => r.id === selectedId) || residents[0];
  }, [residents, selectedId]);

  // Filtered and sorted residents matching search query
  const filteredResidents = useMemo(() => {
    let list = residents;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = residents.filter((r) => {
        const name = (r.name || '').toLowerCase();
        const id = (r.id || '').toLowerCase();
        const room = (r.room || '').toLowerCase();
        const condition = (r.condition || '').toLowerCase();
        const caregiver = (r.caregiver || '').toLowerCase();
        return (
          name.includes(q) ||
          id.includes(q) ||
          room.includes(q) ||
          condition.includes(q) ||
          caregiver.includes(q)
        );
      });
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'room') return (a.room || '').localeCompare(b.room || '');
      if (sortBy === 'age') return (parseInt(a.age, 10) || 0) - (parseInt(b.age, 10) || 0);
      return 0;
    });

    return sorted;
  }, [residents, query, sortBy]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredResidents]);

  const handleSelect = (resident) => {
    if (!resident) return;
    onSelectResident(resident.id);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredResidents.length));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredResidents.length) % Math.max(1, filteredResidents.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResidents.length > 0) {
        handleSelect(filteredResidents[highlightedIndex] || filteredResidents[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`patient-search-module ${className}`} ref={containerRef}>
      <div className="patient-search-bar-row">
        {/* Search Input Box */}
        <div className="patient-search-input-wrap">
          <Search size={16} className="patient-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="patient-search-input"
            placeholder={placeholder}
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              className="patient-search-clear"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Currently Active Patient Quick Pill */}
        {selectedResident && (
          <div
            className="patient-active-pill"
            onClick={() => {
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            title="Click to change patient"
          >
            <span className="patient-active-label">Selected Patient:</span>
            <span className="identity-tile size-sm" style={{ width: 22, height: 22, fontSize: 10, borderRadius: 5 }}>
              {selectedResident.initials || (selectedResident.name || 'P').slice(0, 2).toUpperCase()}
            </span>
            <strong className="patient-active-name">{selectedResident.name}</strong>
            <span className="patient-active-id">({selectedResident.id})</span>
            <ChevronDown size={14} className="patient-active-caret" />
          </div>
        )}
      </div>

      {/* Dropdown Suggestions List */}
      {isOpen && (
        <div className="patient-search-dropdown">
          <div className="patient-search-dropdown-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              {query.trim() ? (
                <span>
                  Searching for: <strong style={{ color: 'var(--color-forest, #0284C7)' }}>&ldquo;{query}&rdquo;</strong> ({filteredResidents.length} matching)
                </span>
              ) : (
                <span>All Available Residents ({residents.length})</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowUpDown size={12} style={{ color: 'var(--text-muted)' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                title="Sort patient results"
                style={{
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-hairline-strong)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <option value="name_asc">Sort: Name (A-Z)</option>
                <option value="name_desc">Sort: Name (Z-A)</option>
                <option value="room">Sort: Room</option>
                <option value="age">Sort: Age</option>
              </select>
            </div>
          </div>

          <div className="patient-search-results-list">
            {filteredResidents.length === 0 ? (
              <div className="patient-search-empty">
                <User size={24} style={{ opacity: 0.4, margin: '0 auto 6px', display: 'block' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No patient found matching &ldquo;{query}&rdquo;</p>
                <span style={{ fontSize: 11.5, opacity: 0.7 }}>Try searching by first name, room number, or resident ID (e.g. EC-005)</span>
              </div>
            ) : (
              filteredResidents.map((r, index) => {
                const isSelected = r.id === selectedId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={r.id}
                    className={`patient-search-item ${isSelected ? 'active' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="patient-search-item-left">
                      <div className="identity-tile size-sm">
                        {r.initials || (r.name || 'P').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="patient-search-info">
                        <div className="patient-search-name-row">
                          <span className="patient-search-name">{highlightMatch(r.name, query)}</span>
                          <span className="patient-search-id-badge">{highlightMatch(r.id, query)}</span>
                          {r.age && <span className="patient-search-age">{r.age} yrs</span>}
                        </div>
                        <div className="patient-search-details">
                          <span className="patient-detail-tag">
                            <Building2 size={11} style={{ verticalAlign: 'text-bottom', marginRight: 3 }} />
                            {highlightMatch(r.room || 'General', query)}
                          </span>
                          {r.condition && (
                            <span className="patient-detail-tag condition">
                              <Stethoscope size={11} style={{ verticalAlign: 'text-bottom', marginRight: 3 }} />
                              {highlightMatch(r.condition, query)}
                            </span>
                          )}
                          {r.caregiver && (
                            <span className="patient-detail-tag caregiver">
                              Caregiver: {highlightMatch(r.caregiver, query)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="patient-selected-indicator" title="Currently Selected">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
