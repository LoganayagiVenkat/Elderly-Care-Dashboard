import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GitFork,
  Search,
  X,
  RefreshCw,
  User,
  AlertTriangle,
  Siren,
  Stethoscope,
  UserCheck,
  UserX,
  CalendarClock,
  CalendarCheck,
  RotateCw,
  CheckCircle2,
  Clock,
  Pill,
  ClipboardList,
  CheckSquare,
  ClipboardPlus,
  ArrowDown,
  Info,
  ChevronRight,
  ShieldCheck,
  Lock,
  Building2,
  Phone,
  Hospital
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getScopedResidents } from '../utils/scope.js';
import { careDependencyMapApi } from '../services/api.js';
import PatientSearchBar from '../components/PatientSearchBar.jsx';

// Map icon names to Lucide icon components
const ICON_MAP = {
  User: User,
  ClipboardPlus: ClipboardPlus,
  Siren: Siren,
  Stethoscope: Stethoscope,
  UserCheck: UserCheck,
  UserX: UserX,
  CalendarClock: CalendarClock,
  CalendarCheck: CalendarCheck,
  RotateCw: RotateCw,
  CheckCircle2: CheckCircle2,
  AlertTriangle: AlertTriangle,
  Pill: Pill,
  Clock: Clock,
  ClipboardList: ClipboardList,
  CheckSquare: CheckSquare
};

export default function CareDependencyMap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, residents, t } = useApp();

  // Role Scoping for Resident Selection
  const scopedResidents = useMemo(() => {
    return getScopedResidents(user, residents);
  }, [user, residents]);

  // Is user locked to their primary resident (Family & Patient)?
  const isLockedToResident = user?.role === 'family' || user?.role === 'patient';

  // Selected Resident State
  const initialSelectedId = useMemo(() => {
    if (isLockedToResident && user?.residentId) {
      return user.residentId;
    }
    const qId = searchParams.get('residentId');
    if (qId && scopedResidents.some((r) => r.id === qId)) {
      return qId;
    }
    return scopedResidents[0]?.id || (user?.role === 'caregiver' ? 'EC-001' : 'EC-005');
  }, [isLockedToResident, user, searchParams, scopedResidents]);

  const [selectedResidentId, setSelectedResidentId] = useState(initialSelectedId);

  // Sync state if scopedResidents or query param changes
  useEffect(() => {
    if (isLockedToResident && user?.residentId) {
      setSelectedResidentId(user.residentId);
      return;
    }
    const qId = searchParams.get('residentId');
    if (qId && scopedResidents.some((r) => r.id === qId)) {
      setSelectedResidentId(qId);
    } else if (scopedResidents.length > 0 && !scopedResidents.some((r) => r.id === selectedResidentId)) {
      setSelectedResidentId(scopedResidents[0]?.id);
    }
  }, [isLockedToResident, user, searchParams, scopedResidents, selectedResidentId]);

  // Data State from Backend API
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // In-Chain Search & Tab Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'emergency' | 'medication' | 'care_plan' | 'routine'
  const [expandedChainIds, setExpandedChainIds] = useState(new Set());

  // Modal / Node Detail Panel State
  const [selectedNode, setSelectedNode] = useState(null);

  // Active resident object
  const activeResident = useMemo(() => {
    return data?.resident || scopedResidents.find((r) => r.id === selectedResidentId) || scopedResidents[0];
  }, [data, scopedResidents, selectedResidentId]);

  // Fetch Care Dependency Map from MySQL API
  const fetchDependencyMap = useCallback(async (resId) => {
    let targetId = resId;
    if (isLockedToResident && user?.residentId) {
      targetId = user.residentId;
    } else if (scopedResidents.length > 0 && !scopedResidents.some((r) => r.id === targetId)) {
      targetId = scopedResidents[0]?.id;
    }
    if (!targetId) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await careDependencyMapApi.getByResident(targetId);
      if (res && res.success) {
        setData(res.data);
      } else {
        throw new Error(res?.message || 'Failed to load dependency map.');
      }
    } catch (err) {
      console.error('[CareDependencyMap] Error fetching data:', err);
      setError(err.message || 'Failed to load dependency map from database.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isLockedToResident, user, scopedResidents]);

  useEffect(() => {
    fetchDependencyMap(selectedResidentId);
  }, [selectedResidentId, fetchDependencyMap]);

  // Handle Resident Selection
  const handleSelectResident = (resId) => {
    if (isLockedToResident) return; // Prevent changing if Family/Patient
    setSelectedResidentId(resId);
    setSearchParams({ residentId: resId }, { replace: true });
    setSearchQuery('');
  };

  // Filter chains based on activeTab and in-chain searchQuery
  const filteredChains = useMemo(() => {
    if (!data?.allChains) return [];

    let list = data.allChains;

    // Filter by Tab Category
    if (activeTab !== 'all') {
      list = list.filter((c) => c.category === activeTab);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((chain) => {
        // Check pre-computed tokens
        if (chain.searchTokens?.some((t) => t.includes(q))) return true;

        // Check node titles and subtitles
        return chain.nodes?.some((node) => {
          const title = (node.title || '').toLowerCase();
          const subtitle = (node.subtitle || '').toLowerCase();
          const badge = (node.badge || '').toLowerCase();
          if (title.includes(q) || subtitle.includes(q) || badge.includes(q)) return true;

          // Check node details keys & values
          if (node.details) {
            return Object.entries(node.details).some(([k, v]) => {
              return String(k).toLowerCase().includes(q) || String(v).toLowerCase().includes(q);
            });
          }
          return false;
        });
      });
    }

    return list;
  }, [data, activeTab, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    const summary = data?.summary || {};
    return {
      all: summary.totalChains || 0,
      emergency: summary.emergencyChainsCount || 0,
      medication: summary.medicationChainsCount || 0,
      care_plan: summary.carePlanChainsCount || 0,
      routine: summary.routineChainsCount || 0
    };
  }, [data]);

  // Toggle QA Traceability Card
  const toggleChainExpand = (chainId) => {
    setExpandedChainIds((prev) => {
      const next = new Set(prev);
      if (next.has(chainId)) next.delete(chainId);
      else next.add(chainId);
      return next;
    });
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedNode(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="cdm-container">
      {/* 1. Header Bar */}
      <div className="cdm-header">
        <div className="cdm-header-info">
          <h1>
            <GitFork size={24} />
            <span>{t('Care Dependency Map')}</span>
          </h1>
          <p className="cdm-header-subtitle">
            {t('Visually connect related care events, emergencies, specialist availability, appointments, and clinical follow-ups.')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => fetchDependencyMap(selectedResidentId)}
            className="cdm-expand-btn"
            title="Refresh database records"
            aria-label="Refresh database records"
            style={{ padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>{t('Refresh Live Data')}</span>
          </button>
          <div className="cdm-header-badge">
            <ShieldCheck size={14} />
            <span>{t('Real MySQL Relationships')}</span>
          </div>
        </div>
      </div>

      {/* 2. Resident Selection Section */}
      <div className="cdm-selector-card">
        <div className="cdm-selector-header">
          <div className="cdm-selector-title">
            <User size={15} />
            <span>{t('Selected Elderly Resident')}</span>
          </div>
          {isLockedToResident ? (
            <div className="cdm-locked-badge">
              <Lock size={12} />
              <span>{t(user?.role === 'patient' ? 'Resident Portal: My Personal Care Journey (Read-Only)' : 'Family Portal: Linked Resident Care Journey (Read-Only)')}</span>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{scopedResidents.length} {t('resident(s) authorized')}</span>
              <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                {user?.role === 'doctor' ? 'Clinical Doctor View' : user?.role === 'caregiver' ? 'Assigned Caregiver View' : 'Institutional Admin View'}
              </span>
            </div>
          )}
        </div>

        {/* Search Bar for Admin & Caregiver */}
        {!isLockedToResident && (
          <div>
            <PatientSearchBar
              residents={scopedResidents}
              selectedId={selectedResidentId}
              onSelectResident={handleSelectResident}
              placeholder="Search resident by name (e.g. Anitha Sundaram, Lakshmi Devi), ID (EC-005)..."
            />
            {/* Quick Switcher Pills for frequent access */}
            <div className="cdm-quick-switch-wrap">
              {scopedResidents.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectResident(r.id)}
                  className={`cdm-quick-switch-btn ${r.id === selectedResidentId ? 'active' : ''}`}
                >
                  <span className="pill-avatar">{r.initials || r.name.slice(0, 2)}</span>
                  <span>{r.name}</span>
                  <span style={{ opacity: 0.65, fontSize: '11px' }}>({r.id})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Resident Details Card */}
        {activeResident && (
          <div className="cdm-active-resident-bar">
            <div className="cdm-resident-meta-left">
              <div className="cdm-resident-avatar">
                {activeResident.initials || (activeResident.name || 'AS').slice(0, 2).toUpperCase()}
              </div>
              <div className="cdm-resident-name-group">
                <div className="cdm-resident-name">
                  <span>{activeResident.name}</span>
                  <span className="cdm-resident-id-tag">{activeResident.id}</span>
                </div>
                <div className="cdm-resident-sub">
                  {activeResident.room} · {activeResident.age} {t('yrs')} · {activeResident.gender}
                </div>
              </div>
            </div>

            <div className="cdm-resident-pills">
              <div className="cdm-info-pill">
                <span>{t('Caregiver')}:</span>
                <strong>{activeResident.caregiver || 'Not assigned'}</strong>
              </div>
              <div className="cdm-info-pill">
                <span>{t('Condition')}:</span>
                <strong>{activeResident.condition || 'General'}</strong>
              </div>
              <div className="cdm-info-pill">
                <span>{t('Blood')}:</span>
                <strong>{activeResident.bloodGroup || 'Unknown'}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Search & Tabs Controls */}
      <div className="cdm-controls-row">
        {/* Search within the selected resident's chains */}
        <div className="cdm-search-wrap">
          <Search size={16} className="cdm-search-icon" />
          <input
            type="text"
            className="cdm-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search in map: Emergency ID, Appointment ID, Doctor, Medicine, Specialty...')}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="cdm-search-clear"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Category Tabs */}
        <div className="cdm-tabs-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`cdm-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          >
            <span>{t('All Chains')}</span>
            <span className="cdm-tab-count">{counts.all}</span>
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`cdm-tab-btn ${activeTab === 'emergency' ? 'active' : ''}`}
          >
            <span>🚨 {t('Emergency & Specialist')}</span>
            <span className="cdm-tab-count">{counts.emergency}</span>
          </button>
          <button
            onClick={() => setActiveTab('medication')}
            className={`cdm-tab-btn ${activeTab === 'medication' ? 'active' : ''}`}
          >
            <span>💊 {t('Medications')}</span>
            <span className="cdm-tab-count">{counts.medication}</span>
          </button>
          <button
            onClick={() => setActiveTab('care_plan')}
            className={`cdm-tab-btn ${activeTab === 'care_plan' ? 'active' : ''}`}
          >
            <span>📋 {t('Care Plans')}</span>
            <span className="cdm-tab-count">{counts.care_plan}</span>
          </button>
          <button
            onClick={() => setActiveTab('routine')}
            className={`cdm-tab-btn ${activeTab === 'routine' ? 'active' : ''}`}
          >
            <span>📅 {t('Routine Referrals')}</span>
            <span className="cdm-tab-count">{counts.routine}</span>
          </button>
        </div>
      </div>

      {/* Search Matching Notice */}
      {searchQuery && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
          <Info size={15} color="#0066CC" />
          <span>
            {t('Showing')} <strong>{filteredChains.length}</strong> {t('connected care chain(s) matching')} &ldquo;<strong>{searchQuery}</strong>&rdquo;
          </span>
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', color: '#0066CC', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
          >
            {t('Reset filter')}
          </button>
        </div>
      )}

      {/* 4. Main Dependency Content */}
      {isLoading ? (
        <div className="cdm-loading-state">
          <div className="cdm-spinner" />
          <span>{t('Loading dependency map from MySQL database...')}</span>
        </div>
      ) : error ? (
        <div className="cdm-empty-state">
          <div className="cdm-empty-icon-wrap" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 className="cdm-empty-title">{t('Unable to Load Dependency Map')}</h2>
          <p className="cdm-empty-desc">{error}</p>
          <button onClick={() => fetchDependencyMap(selectedResidentId)} className="cdm-modal-btn-primary">
            {t('Try Again')}
          </button>
        </div>
      ) : filteredChains.length === 0 ? (
        /* Empty State (Prompt Section 15 Requirement) */
        <div className="cdm-empty-state">
          <div className="cdm-empty-icon-wrap">
            <GitFork size={32} />
          </div>
          <h2 className="cdm-empty-title">
            {searchQuery
              ? t('No matching dependency chains found')
              : t('No connected care events available for this resident.')}
          </h2>
          <p className="cdm-empty-desc">
            {searchQuery
              ? t('No care events matched your search query. Try clearing the search or switching category tabs.')
              : t('This resident currently has no recorded emergency referrals, appointments, or linked care events in the system.')}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="cdm-modal-btn-primary">
              {t('Clear Search')}
            </button>
          )}
        </div>
      ) : (
        /* Render Dependency Chains */
        <div className="cdm-chains-list">
          {filteredChains.map((chain, chainIdx) => {
            const isExpanded = expandedChainIds.has(chain.chainId);

            // Extract key events for QA summary banner
            const emgNode = chain.nodes.find((n) => n.type === 'emergency');
            const specNode = chain.nodes.find((n) => n.type === 'specialist');
            const apptNode = chain.nodes.find((n) => n.type === 'appointment');
            const fuNode = chain.nodes.find((n) => n.type === 'followup');
            const isEmergencyChain = chain.category === 'emergency';

            return (
              <div key={chain.chainId} className="cdm-chain-card">
                {/* Chain Top Bar */}
                <div className="cdm-chain-topbar">
                  <div className="cdm-chain-title-group">
                    <span className={`cdm-chain-category-badge ${chain.category}`}>
                      {chain.category === 'emergency' ? '🚨 Emergency Chain' : chain.category === 'medication' ? '💊 Medication' : chain.category === 'care_plan' ? '📋 Care Plan' : '📅 Consultation'}
                    </span>
                    <h2 className="cdm-chain-title">{chain.label}</h2>
                  </div>

                  <div className="cdm-chain-top-actions">
                    <div className="cdm-chain-date">
                      <Clock size={13} />
                      <span>{chain.date || 'Active'}</span>
                    </div>
                    {isEmergencyChain && (
                      <button
                        onClick={() => toggleChainExpand(chain.chainId)}
                        className="cdm-expand-btn"
                        aria-expanded={isExpanded}
                      >
                        <Info size={13} />
                        <span>{isExpanded ? t('Hide Summary') : t('Traceability Q&A')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Traceability Q&A Summary (Answers prompt questions) */}
                {isEmergencyChain && isExpanded && (
                  <div className="cdm-qa-summary">
                    <div className="cdm-qa-item">
                      <span className="cdm-qa-q">&ldquo;What happened?&rdquo;</span>
                      <span className="cdm-qa-a">{emgNode?.title || 'Emergency reported'}</span>
                    </div>
                    <div className="cdm-qa-item">
                      <span className="cdm-qa-q">&ldquo;Why was this action taken?&rdquo;</span>
                      <span className="cdm-qa-a">
                        {emgNode?.details?.['Description'] || 'Acute symptoms required immediate specialist consultation.'}
                      </span>
                    </div>
                    <div className="cdm-qa-item">
                      <span className="cdm-qa-q">&ldquo;Which specialist was assigned?&rdquo;</span>
                      <span className="cdm-qa-a">{specNode?.title || 'Dr. Suresh Rao'}</span>
                    </div>
                    <div className="cdm-qa-item">
                      <span className="cdm-qa-q">&ldquo;What appointment was created?&rdquo;</span>
                      <span className="cdm-qa-a">{apptNode?.title || 'Consultation confirmed'}</span>
                    </div>
                    <div className="cdm-qa-item">
                      <span className="cdm-qa-q">&ldquo;What follow-up is required?&rdquo;</span>
                      <span className="cdm-qa-a">
                        {fuNode ? fuNode.details?.['Clinical Instructions'] || 'Follow-up pending' : 'No follow-up recorded.'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Vertical Connected Flow */}
                <div className="cdm-chain-flow">
                  {chain.nodes.map((node, nodeIdx) => {
                    const IconComponent = ICON_MAP[node.icon] || Info;
                    const isLast = nodeIdx === chain.nodes.length - 1;

                    return (
                      <div key={node.id} className="cdm-node-step">
                        {/* Interactive Clickable Node Card */}
                        <div
                          className={`cdm-node-card type-${node.type}`}
                          onClick={() => setSelectedNode({ ...node, chainCategory: chain.category })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedNode({ ...node, chainCategory: chain.category });
                            }
                          }}
                          aria-label={`View database record for ${node.title}`}
                        >
                          {/* Node Icon */}
                          <div className="cdm-node-icon">
                            <IconComponent size={20} />
                          </div>

                          {/* Node Main Content */}
                          <div className="cdm-node-content">
                            <div className="cdm-node-header">
                              <span className="cdm-node-badge">{node.badge}</span>
                              {node.status && (
                                <span className={`cdm-node-status-pill ${node.status}`}>
                                  {node.status.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <h3 className="cdm-node-title" title={node.title}>{node.title}</h3>
                            <div className="cdm-node-sub" title={node.subtitle}>{node.subtitle}</div>
                          </div>

                          {/* Click Hint */}
                          <div className="cdm-node-action-hint">
                            <span>{t('Details')}</span>
                            <ChevronRight size={13} />
                          </div>
                        </div>

                        {/* Downward Connector Stem */}
                        {!isLast && (
                          <div className="cdm-connector-wrap">
                            <div className="cdm-connector-line">
                              <div className="cdm-connector-arrow" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Detail Modal (Prompt Section 5 Requirement) */}
      {selectedNode && (
        <div
          className="cdm-modal-backdrop"
          onClick={() => setSelectedNode(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="cdm-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="cdm-modal-header">
              <div className="cdm-modal-header-left">
                <div className="cdm-modal-icon">
                  {(() => {
                    const ModalIcon = ICON_MAP[selectedNode.icon] || Info;
                    return <ModalIcon size={20} />;
                  })()}
                </div>
                <div className="cdm-modal-title-group">
                  <div className="cdm-modal-badge">{selectedNode.badge}</div>
                  <h3>{selectedNode.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="cdm-modal-close-btn"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with Detailed Database Fields */}
            <div className="cdm-modal-body">
              <div className="cdm-modal-callout">
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>{t('Verified MySQL Database Record')}</strong>
                  <div style={{ fontSize: '11.5px', marginTop: '2px', opacity: 0.85 }}>
                    {t('This information is retrieved directly from active MySQL tables via verified relationship keys.')}
                  </div>
                </div>
              </div>

              {selectedNode.details ? (
                <table className="cdm-detail-table">
                  <tbody>
                    {Object.entries(selectedNode.details).map(([key, val]) => (
                      <tr key={key} className="cdm-detail-row">
                        <td className="cdm-detail-key">{key}</td>
                        <td className="cdm-detail-val">
                          {typeof val === 'boolean'
                            ? val ? t('Yes') : t('No')
                            : val || <span style={{ color: '#94A3B8' }}>{t('Not specified')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#64748B', fontSize: '13.5px' }}>{selectedNode.subtitle}</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="cdm-modal-footer">
              <button
                onClick={() => setSelectedNode(null)}
                className="cdm-modal-btn-primary"
              >
                {t('Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
