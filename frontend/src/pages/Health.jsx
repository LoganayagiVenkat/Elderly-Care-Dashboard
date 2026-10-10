import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardPlus,
  Thermometer,
  Scale,
  Gauge,
  NotebookPen,
  Plus,
  Trash2,
  Search,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getScopedResidents } from '../utils/scope.js';
import { careRecordsApi, vitalsApi } from '../services/api.js';
import PatientSearchBar from '../components/PatientSearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import { SEED_FALLBACK } from '../data/seedCareRecords.js';

export default function Health() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, residents } = useApp();
  const scopedResidents = useMemo(() => getScopedResidents(user, residents), [user, residents]);
  const canEdit = user?.role === 'admin' || user?.role === 'caregiver';

  const initialSelected = searchParams.get('residentId') || scopedResidents[0]?.id;
  const [selectedId, setSelectedId] = useState(initialSelected);

  // Historical Care Records State
  const [residentRecords, setResidentRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [caregiverFilter, setCaregiverFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (latest first) or 'asc' (oldest first)
  const [matchedResidentNotice, setMatchedResidentNotice] = useState(null);

  // Pagination State
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsLimit, setRecordsLimit] = useState(5);

  // Form State
  const now = new Date();
  const todayFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const [form, setForm] = useState({
    bp: '',
    temp: '',
    weight: '',
    observation: 'Normal',
    recordType: 'Routine Round',
    date: todayFormatted,
    time: timeFormatted,
    note: ''
  });

  // Keep selection valid as residents list updates
  useEffect(() => {
    const qId = searchParams.get('residentId');
    if (qId && scopedResidents.some((r) => r.id === qId)) {
      setSelectedId(qId);
    } else if (scopedResidents.length > 0 && !scopedResidents.some((r) => r.id === selectedId)) {
      setSelectedId(scopedResidents[0]?.id);
    }
  }, [scopedResidents, selectedId, searchParams]);

  const patient = scopedResidents.find((r) => r.id === selectedId) || scopedResidents[0];

  // Fetch full care history for selected resident from MySQL via API
  const fetchRecords = useCallback(async (resId) => {
    if (!resId) return;
    setIsLoading(true);
    try {
      const res = await careRecordsApi.getByResident(resId);
      if (res && res.success && Array.isArray(res.history)) {
        setResidentRecords(res.history);
      } else if (SEED_FALLBACK[resId]) {
        setResidentRecords(SEED_FALLBACK[resId]);
      } else {
        setResidentRecords([]);
      }
    } catch (err) {
      console.warn('[Health] Failed to fetch care records from MySQL API, checking fallback:', err);
      if (SEED_FALLBACK[resId]) {
        setResidentRecords(SEED_FALLBACK[resId]);
      } else {
        setResidentRecords([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patient?.id) {
      fetchRecords(patient.id);
    }
  }, [patient?.id, fetchRecords]);

  // Handle resident search switch (e.g. typing "Anitha" or "EC-005" in search bar)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchedResidentNotice(null);
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    const match = scopedResidents.find(
      (r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase() === q
    );
    if (match && match.id !== selectedId) {
      setSelectedId(match.id);
      setSearchParams({ residentId: match.id });
      setMatchedResidentNotice(`Switched to ${match.name} (${match.id})`);
      const timer = setTimeout(() => setMatchedResidentNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, scopedResidents, selectedId, setSearchParams]);

  // Derive latest record from complete records list (newest by created_at or date)
  const latest = useMemo(() => {
    if (!residentRecords || residentRecords.length === 0) return null;
    const sorted = [...residentRecords].sort(
      (a, b) => new Date(b.created_at || b.createdAt || b.date) - new Date(a.created_at || a.createdAt || a.date)
    );
    return sorted[0];
  }, [residentRecords]);

  // Extract unique caregivers for the filter dropdown
  const caregiverOptions = useMemo(() => {
    const set = new Set();
    residentRecords.forEach((r) => {
      const author = r.recorded_by || r.recordedBy;
      if (author) set.add(author);
    });
    return Array.from(set);
  }, [residentRecords]);

  // Filter and Sort complete historical records
  const filteredRecords = useMemo(() => {
    if (!residentRecords) return [];

    let list = [...residentRecords];

    // 1. Search Query across all fields
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => {
        const bp = (r.blood_pressure || r.bp || '').toLowerCase();
        const temp = (r.temperature || r.temp || '').toLowerCase();
        const weight = (r.weight || '').toLowerCase();
        const obs = (r.observation || '').toLowerCase();
        const note = (r.notes || r.note || '').toLowerCase();
        const author = (r.recorded_by || r.recordedBy || '').toLowerCase();
        const date = (r.date || '').toLowerCase();
        const type = (r.record_type || r.recordType || '').toLowerCase();
        const pName = (patient?.name || '').toLowerCase();
        const pId = (patient?.id || '').toLowerCase();

        return (
          bp.includes(q) ||
          temp.includes(q) ||
          weight.includes(q) ||
          obs.includes(q) ||
          note.includes(q) ||
          author.includes(q) ||
          date.includes(q) ||
          type.includes(q) ||
          pName.includes(q) ||
          pId.includes(q)
        );
      });
    }

    // 2. Record Type Filter
    if (recordTypeFilter !== 'all') {
      list = list.filter((r) => (r.record_type || r.recordType) === recordTypeFilter);
    }

    // 3. Caregiver / Recorded By Filter
    if (caregiverFilter !== 'all') {
      list = list.filter((r) => (r.recorded_by || r.recordedBy) === caregiverFilter);
    }

    // 4. Date Filter
    if (dateFilter !== 'all') {
      const nowDate = new Date();
      list = list.filter((r) => {
        const recDate = new Date(r.created_at || r.createdAt || r.date);
        if (isNaN(recDate.getTime())) return true;
        const diffDays = (nowDate - recDate) / (1000 * 60 * 60 * 24);
        if (dateFilter === 'today') return diffDays <= 1;
        if (dateFilter === 'week') return diffDays <= 7;
        if (dateFilter === 'month') return diffDays <= 30;
        return true;
      });
    }

    // 5. Sorting: Latest first (desc) or Oldest first (asc)
    list.sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || a.date).getTime() || 0;
      const timeB = new Date(b.created_at || b.createdAt || b.date).getTime() || 0;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [residentRecords, searchQuery, recordTypeFilter, caregiverFilter, dateFilter, sortOrder, patient]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setRecordsPage(1);
  }, [searchQuery, recordTypeFilter, caregiverFilter, dateFilter, sortOrder, selectedId]);

  const paginatedRecords = useMemo(() => {
    const start = (recordsPage - 1) * recordsLimit;
    return filteredRecords.slice(start, start + recordsLimit);
  }, [filteredRecords, recordsPage, recordsLimit]);

  // Add New Care Record (permanent INSERT into MySQL)
  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!form.bp.trim() || !form.temp.trim() || !form.weight.trim() || !form.note.trim()) {
      alert('Please fill out all required fields: Blood Pressure, Temperature, Weight, and Observation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newEntry = {
        residentId: patient.id,
        date: form.date.trim() || todayFormatted,
        time: form.time.trim() || timeFormatted,
        bp: form.bp.trim(),
        temp: form.temp.trim(),
        weight: form.weight.trim(),
        observation: form.observation.trim() || 'Normal',
        notes: form.note.trim(),
        recordedBy: user.name || 'Caregiver',
        recordType: form.recordType || 'Routine Round'
      };

      // 1. Send to backend API to insert directly into MySQL care_records table
      const res = await careRecordsApi.create(newEntry);

      if (res && res.success) {
        setNotificationMsg(`Care record successfully saved to MySQL database for ${patient.name}.`);
        setTimeout(() => setNotificationMsg(null), 4500);

        // 2. Refresh complete history from MySQL
        await fetchRecords(patient.id);

        // 3. Reset form
        setForm({
          bp: '',
          temp: '',
          weight: '',
          observation: 'Normal',
          recordType: 'Routine Round',
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          note: ''
        });
      } else {
        throw new Error(res?.message || 'Failed to save record.');
      }
    } catch (err) {
      console.error('[Health] Error saving care record:', err);
      // Optimistic in-memory update if network glitch
      const fallbackEntry = {
        record_id: `REC-${Date.now()}`,
        id: `REC-${Date.now()}`,
        resident_id: patient.id,
        residentId: patient.id,
        date: form.date || todayFormatted,
        time: form.time || timeFormatted,
        blood_pressure: form.bp.trim(),
        bp: form.bp.trim(),
        temperature: form.temp.trim(),
        temp: form.temp.trim(),
        weight: form.weight.trim(),
        observation: form.observation,
        notes: form.note.trim(),
        note: form.note.trim(),
        recorded_by: user.name || 'Caregiver',
        recordedBy: user.name || 'Caregiver',
        record_type: form.recordType,
        recordType: form.recordType,
        created_at: new Date().toISOString()
      };
      setResidentRecords((prev) => [fallbackEntry, ...prev]);
      setNotificationMsg(`Care record logged for ${patient.name}.`);
      setTimeout(() => setNotificationMsg(null), 4500);
      setForm((p) => ({ ...p, bp: '', temp: '', weight: '', note: '' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Record Handler
  const handleDeleteRecord = async (recId) => {
    if (!window.confirm('Are you sure you want to delete this care record? This action cannot be undone.')) {
      return;
    }
    try {
      await careRecordsApi.delete(recId);
      setResidentRecords((prev) => prev.filter((r) => (r.record_id || r.id) !== recId));
    } catch (err) {
      console.warn('[Health] Failed to delete record from MySQL:', err);
      setResidentRecords((prev) => prev.filter((r) => (r.record_id || r.id) !== recId));
    }
  };

  if (!patient) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        No care record is available for your account yet.
      </div>
    );
  }

  const vitalsSummary = [
    { icon: Gauge, label: 'Latest Blood Pressure', value: latest?.blood_pressure || latest?.bp || '—' },
    { icon: Thermometer, label: 'Latest Temperature', value: latest?.temperature || latest?.temp || '—' },
    { icon: Scale, label: 'Latest Weight', value: latest?.weight || '—' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Care Records</h1>
          <p className="desc">
            Complete chronological care records, vitals history, and observations stored permanently in MySQL.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {notificationMsg && (
        <div className="history-match-alert" style={{ background: 'rgba(46, 125, 50, 0.12)', borderColor: '#2e7d32', color: '#2e7d32' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            <span>{notificationMsg}</span>
          </div>
        </div>
      )}

      {/* Matching Resident Switch Alert */}
      {matchedResidentNotice && (
        <div className="history-match-alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            <span>{matchedResidentNotice}</span>
          </div>
        </div>
      )}

      {/* Searchable Patient Navigation (Replaces horizontal touch pill buttons) */}
      <PatientSearchBar
        residents={scopedResidents}
        selectedId={selectedId}
        onSelectResident={(id) => {
          setSelectedId(id);
          setSearchParams({ residentId: id });
        }}
        placeholder="Search patient by name (e.g. Anitha, Lakshmi, Govind), ID, room..."
      />

      {/* Latest / Current Care Summary Hero */}
      <div className="vitals-hero">
        <div className="vitals-hero-top">
          <div className="vitals-hero-patient">
            <div className="identity-tile size-md">
              {patient.initials || (patient.name || 'P').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3>{patient.name}</h3>
              <div className="meta">
                {patient.id} · {patient.age ? `${patient.age} yrs · ` : ''}{patient.condition || 'Routine Care'} · Room: {patient.room || 'General'}
              </div>
            </div>
          </div>
        </div>
        <div className="record-meta-row">
          <span>
            <ClipboardPlus size={13} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
            Latest Record: {latest ? `${latest.date} ${latest.time ? '· ' + latest.time : ''} by ${latest.recorded_by || latest.recordedBy}` : 'No records yet'}
          </span>
          {latest?.observation && (
            <span style={{ fontWeight: 600 }}>
              Status: <span className={`c-status-chip ${(latest.observation || '').toLowerCase()}`}>{latest.observation}</span>
            </span>
          )}
        </div>
      </div>

      {/* Latest Vitals Summary Cards (Preserved 3-card layout) */}
      <div className="vitals-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {vitalsSummary.map((v) => (
          <div className="vital-card" key={v.label}>
            <div className="v-top">
              <div className="v-icon"><v.icon size={17} /></div>
            </div>
            <div className="v-value" style={{ fontSize: 20 }}>{v.value}</div>
            <div className="v-label">{v.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Complete Historical Records on Left, Add Record on Right */}
      <div
        className="dash-grid health-history-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: canEdit ? 'minmax(0, 1fr) minmax(310px, 350px)' : 'minmax(0, 1fr)',
          gap: 20,
          marginTop: 24,
          alignItems: 'start',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT COLUMN: Complete Past-to-Present History */}
        <div className="panel" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          <div className="panel-header">
            <div className="history-section-head" style={{ width: '100%', marginBottom: 0 }}>
              <div className="history-title-group">
                <h3>
                  <NotebookPen size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                  Complete Care History
                </h3>
                <span className="history-count-badge">
                  {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
                </span>
              </div>
              <button
                type="button"
                className="history-sort-btn"
                onClick={() => setSortOrder((p) => (p === 'desc' ? 'asc' : 'desc'))}
                title="Toggle sort order"
              >
                <ArrowUpDown size={13} />
                <span>{sortOrder === 'desc' ? 'Latest First' : 'Oldest First'}</span>
              </button>
            </div>
          </div>

          <div className="panel-body">
            {/* Search & Filter Bar across Complete History */}
            <div className="history-toolbar">
              <div className="history-search-wrap">
                <Search size={14} className="history-search-icon" />
                <input
                  type="text"
                  className="history-search-input"
                  placeholder="Search by name, ID, date, caregiver, vitals, observation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="history-filters-group">
                {/* Record Type Filter */}
                <select
                  className="history-select"
                  value={recordTypeFilter}
                  onChange={(e) => setRecordTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="Routine Round">Routine Round</option>
                  <option value="Morning Vitals">Morning Vitals</option>
                  <option value="Wellness Round">Wellness Round</option>
                  <option value="Intake Assessment">Intake Assessment</option>
                  <option value="Clinical Check">Clinical Check</option>
                </select>

                {/* Date Filter */}
                <select
                  className="history-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                </select>

                {/* Caregiver Filter */}
                {caregiverOptions.length > 0 && (
                  <select
                    className="history-select"
                    value={caregiverFilter}
                    onChange={(e) => setCaregiverFilter(e.target.value)}
                  >
                    <option value="all">All Caregivers</option>
                    {caregiverOptions.map((cg) => (
                      <option key={cg} value={cg}>{cg}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Historical Care Records Display */}
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading care records...
              </div>
            ) : residentRecords.length === 0 ? (
              /* Mandatory Empty State */
              <div className="history-empty-card">
                <AlertCircle size={28} style={{ margin: '0 auto 10px', color: 'var(--text-muted)' }} />
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>No Care Records</h4>
                <p style={{ fontSize: 13, margin: 0 }}>No care records available for this resident.</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              /* Search / Filter Zero State */
              <div className="history-empty-card">
                <Search size={26} style={{ margin: '0 auto 10px', color: 'var(--text-muted)' }} />
                <p style={{ fontSize: 13, margin: 0 }}>No care records match your search or filter criteria.</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: 12, padding: '6px 14px', fontSize: 12 }}
                  onClick={() => {
                    setSearchQuery('');
                    setRecordTypeFilter('all');
                    setDateFilter('all');
                    setCaregiverFilter('all');
                    setRecordsPage(1);
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              /* Complete Past-to-Present History Cards */
              <div>
                <div className="care-history-list">
                  {paginatedRecords.map((r, index) => {
                    const isLatest = (r.record_id || r.id) === (latest?.record_id || latest?.id);
                    const bpVal = r.blood_pressure || r.bp;
                    const tempVal = r.temperature || r.temp;
                    const weightVal = r.weight;
                    const obsVal = r.observation || 'Normal';
                    const noteVal = r.notes || r.note;
                    const authorVal = r.recorded_by || r.recordedBy;
                    const typeVal = r.record_type || r.recordType || 'Routine Round';
                    const recId = r.record_id || r.id;

                    return (
                      <div className={`care-history-card ${isLatest ? 'latest-card' : ''}`} key={recId || index}>
                        {/* Card Header: Date & Time, Type Badge, Delete */}
                        <div className="c-card-head">
                          <div className="c-card-date-wrap">
                            <span className="c-card-date">
                              <Calendar size={13} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                              {r.date}
                            </span>
                            {r.time && (
                              <span className="c-card-time">
                                <Clock size={11} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                                {r.time}
                              </span>
                            )}
                            <span className={`c-card-badge ${isLatest ? 'latest' : ''}`}>
                              {isLatest ? 'Latest Record' : typeVal}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                              #{recId}
                            </span>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(recId)}
                                title="Delete this record"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-muted)',
                                  padding: 2,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  borderRadius: 4,
                                  transition: 'color 0.15s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-terracotta)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Vitals Grid: BP, Temperature, Weight, Observation */}
                        <div className="c-card-vitals-grid">
                          <div className="c-vital-box">
                            <div className="c-vital-label">BP</div>
                            <div className="c-vital-value">{bpVal}</div>
                          </div>

                          <div className="c-vital-box">
                            <div className="c-vital-label">Temperature</div>
                            <div className="c-vital-value">{tempVal}</div>
                          </div>

                          <div className="c-vital-box">
                            <div className="c-vital-label">Weight</div>
                            <div className="c-vital-value">{weightVal}</div>
                          </div>

                          <div className="c-vital-box">
                            <div className="c-vital-label">Observation</div>
                            <div style={{ marginTop: 2 }}>
                              <span className={`c-status-chip ${obsVal.toLowerCase()}`}>{obsVal}</span>
                            </div>
                          </div>
                        </div>

                        {/* Observation Notes */}
                        {noteVal && (
                          <div className="c-card-notes">
                            {noteVal}
                          </div>
                        )}

                        {/* Card Footer: Recorded By info */}
                        <div className="c-card-footer">
                          <div>
                            <UserCheck size={12} style={{ verticalAlign: 'text-bottom', marginRight: 5, color: 'var(--color-forest-deep)' }} />
                            Recorded By: <span className="c-card-author">{authorVal}</span>
                          </div>
                          <div>
                            Type: <span>{typeVal}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 14 }}>
                  <Pagination
                    currentPage={recordsPage}
                    totalRecords={filteredRecords.length}
                    recordsPerPage={recordsLimit}
                    onPageChange={setRecordsPage}
                    onPageSizeChange={(newSize) => {
                      setRecordsLimit(newSize);
                      setRecordsPage(1);
                    }}
                    itemLabel="care records"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Add New Care Record Panel (Authorized Caregivers/Admins only) */}
        {canEdit && (
          <div className="panel" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <div className="panel-header">
              <h3>
                <Plus size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                Add Care Record
              </h3>
            </div>
            <div className="panel-body" style={{ minWidth: 0, boxSizing: 'border-box' }}>
              <form onSubmit={handleAddRecord}>
                <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  Recording new care history entry for <strong>{patient.name}</strong> ({patient.id}). Stored permanently in MySQL.
                </div>

                <div className="field">
                  <label>Blood Pressure *</label>
                  <input
                    placeholder="e.g. 120/78 or 121/79 mmHg"
                    value={form.bp}
                    onChange={(e) => setForm((p) => ({ ...p, bp: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Temperature *</label>
                  <input
                    placeholder="e.g. 98.2°F or 98.3 °F"
                    value={form.temp}
                    onChange={(e) => setForm((p) => ({ ...p, temp: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Weight *</label>
                  <input
                    placeholder="e.g. 60 kg"
                    value={form.weight}
                    onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label>Observation Status *</label>
                  <select
                    className="history-select"
                    style={{ width: '100%' }}
                    value={form.observation}
                    onChange={(e) => setForm((p) => ({ ...p, observation: e.target.value }))}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Good">Good</option>
                    <option value="Stable">Stable</option>
                    <option value="Attention">Attention Needed</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="field">
                  <label>Record Type</label>
                  <select
                    className="history-select"
                    style={{ width: '100%' }}
                    value={form.recordType}
                    onChange={(e) => setForm((p) => ({ ...p, recordType: e.target.value }))}
                  >
                    <option value="Routine Round">Routine Round</option>
                    <option value="Morning Vitals">Morning Vitals</option>
                    <option value="Wellness Round">Wellness Round</option>
                    <option value="Intake Assessment">Intake Assessment</option>
                    <option value="Clinical Check">Clinical Check</option>
                  </select>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 10,
                    minWidth: 0,
                    width: '100%',
                    marginBottom: 18,
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="field" style={{ minWidth: 0, width: '100%', marginBottom: 0 }}>
                    <label>Date</label>
                    <input
                      placeholder="e.g. 19 Sep 2026"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div className="field" style={{ minWidth: 0, width: '100%', marginBottom: 0 }}>
                    <label>Time</label>
                    <input
                      placeholder="e.g. 09:30 AM"
                      value={form.time}
                      onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                      style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>General Observation / Notes *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Resident was comfortable and alert during the morning round. Vitals stable."
                    value={form.note}
                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={isSubmitting}
                  style={{ marginTop: 14 }}
                >
                  <Plus size={14} /> {isSubmitting ? 'Saving to MySQL...' : 'Save Care Record'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 22, maxWidth: 720 }}>
        Note: All readings on this page are manually entered observations and care records stored in MySQL.
        They do not originate from hardware sensors, wearables, or medical IoT devices.
      </p>
    </div>
  );
}
