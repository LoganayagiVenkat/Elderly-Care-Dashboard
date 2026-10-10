import { useState, useMemo, useEffect } from 'react';
import {
  Siren, Phone, ShieldAlert, CheckCircle2, Clock, CheckCheck,
  Send, Users, MessageSquare, ExternalLink, Paperclip, AlertTriangle, X
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { communicationApi } from '../services/api.js';
import Pagination from '../components/Pagination.jsx';
import '../styles/emergency.css';

// Initial Emergency Directory list matching Reference Mockup
const INITIAL_EMERGENCY_CONTACTS = [
  {
    id: 'EC-01',
    name: 'Arjun Sundaram',
    role: 'family',
    phone: '+91 98940 22011',
    badge: 'Primary',
    badgeType: 'pill-primary',
    initials: 'AS',
    avatarClass: 'avatar-sand',
  },
  {
    id: 'EC-02',
    name: 'Ramesh Devi',
    role: 'family',
    phone: '+91 98410 22311',
    badge: 'Secondary',
    badgeType: 'pill-secondary',
    initials: 'RD',
    avatarClass: 'avatar-teal',
  },
  {
    id: 'EC-03',
    name: 'Kavitha Raman',
    role: 'family',
    phone: '+91 91234 55678',
    badge: null,
    badgeType: null,
    initials: 'KN',
    avatarClass: 'avatar-mint',
  },
  {
    id: 'EC-04',
    name: 'Dr. Meera',
    role: 'doctor',
    phone: '+91 90031 44556',
    badge: 'Doctor',
    badgeType: 'pill-doctor',
    initials: 'SM',
    avatarClass: 'avatar-blue',
  },
  {
    id: 'EC-05',
    name: 'Dr. Vignesh',
    role: 'doctor',
    phone: '+91 97856 11223',
    badge: 'Doctor',
    badgeType: 'pill-doctor',
    initials: 'VS',
    avatarClass: 'avatar-blue',
  },
  {
    id: 'EC-06',
    name: 'Caregiver Team Lead',
    role: 'caregiver',
    phone: '+91 94441 88900',
    badge: 'Caregiver',
    badgeType: 'pill-caregiver',
    initials: 'CN',
    avatarClass: 'avatar-purple',
  },
  {
    id: 'EC-07',
    name: 'Dr. Kavya Menon',
    role: 'doctor',
    phone: '+91 98400 12345',
    badge: 'Doctor',
    badgeType: 'pill-doctor',
    initials: 'KM',
    avatarClass: 'avatar-blue',
  },
  {
    id: 'EC-08',
    name: 'Priya Nair',
    role: 'caregiver',
    phone: '+91 98400 11223',
    badge: 'Caregiver',
    badgeType: 'pill-caregiver',
    initials: 'PN',
    avatarClass: 'avatar-purple',
  },
];

const EMERGENCY_TEMPLATES = [
  {
    id: 'medical_emergency',
    label: 'Medical Emergency',
    pillClass: 'pill-med',
    text: 'This is an emergency. Please call us immediately.',
  },
  {
    id: 'fall_alert',
    label: 'Fall Alert',
    pillClass: 'pill-fall',
    text: 'Fall alert: Patient has fallen. Assistance requested immediately.',
  },
  {
    id: 'unresponsive',
    label: 'Unresponsive',
    pillClass: 'pill-unresp',
    text: 'Patient unresponsive. Need immediate clinical assistance.',
  },
  {
    id: 'hospital_transfer',
    label: 'Hospital Transfer',
    pillClass: 'pill-hosp',
    text: 'Initiating urgent hospital transfer. Please contact facility desk.',
  },
  {
    id: 'urgent_assistance',
    label: 'Urgent Assistance',
    pillClass: 'pill-med',
    text: 'Requesting immediate assistance in Room 3.',
  },
];

export default function Emergency() {
  const { user, activeEmergencies = [], resolveEmergency } = useApp();

  // Column 1: Directory State
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState('all');
  const [contactsPage, setContactsPage] = useState(1);
  const contactsLimit = 6;

  // Column 2: Composer State
  const [composerMode, setComposerMode] = useState('contacts'); // 'contacts' | 'manual'
  const [selectedContactId, setSelectedContactId] = useState(INITIAL_EMERGENCY_CONTACTS[0].id);
  const [manualCountryCode, setManualCountryCode] = useState('+91');
  const [manualPhone, setManualPhone] = useState('');
  const [manualRecipientName, setManualRecipientName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('medical_emergency');
  const [customMessage, setCustomMessage] = useState(EMERGENCY_TEMPLATES[0].text);
  const [dispatchSending, setDispatchSending] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState(null);

  // Column 3: Recent Emergency Messages State (from MySQL Backend)
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentLogsPage, setRecentLogsPage] = useState(1);
  const [recentLogsTotalPages, setRecentLogsTotalPages] = useState(1);
  const [recentLogsTotal, setRecentLogsTotal] = useState(0);
  const [recentLogsLoading, setRecentLogsLoading] = useState(false);

  // Filtered Emergency Contacts
  const filteredContacts = useMemo(() => {
    return INITIAL_EMERGENCY_CONTACTS.filter((c) => {
      const matchRole =
        directoryRoleFilter === 'all' ||
        (directoryRoleFilter === 'doctors' && c.role === 'doctor') ||
        (directoryRoleFilter === 'family' && c.role === 'family') ||
        (directoryRoleFilter === 'caregivers' && c.role === 'caregiver');

      const matchQ =
        !directorySearch.trim() ||
        c.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
        c.phone.includes(directorySearch);

      return matchRole && matchQ;
    });
  }, [directoryRoleFilter, directorySearch]);

  const totalContactsPages = Math.ceil(filteredContacts.length / contactsLimit) || 1;
  const paginatedContacts = useMemo(() => {
    const start = (contactsPage - 1) * contactsLimit;
    return filteredContacts.slice(start, start + contactsLimit);
  }, [filteredContacts, contactsPage, contactsLimit]);

  // Load Recent Emergency Logs from Backend
  const fetchRecentLogs = async () => {
    try {
      setRecentLogsLoading(true);
      const res = await communicationApi.getEmergencyLogs({
        page: recentLogsPage,
        limit: 5,
      });

      if (res?.success) {
        setRecentLogs(res.data || []);
        setRecentLogsTotalPages(res.pagination?.totalPages || 1);
        setRecentLogsTotal(res.pagination?.total || (res.data || []).length);
      }
    } catch (err) {
      console.warn('Failed to load emergency logs:', err);
    } finally {
      setRecentLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentLogs();
  }, [recentLogsPage]);

  // Template switch handler
  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setCustomMessage(template.text);
  };

  // Select contact from directory into composer
  const handleSelectContactForMessage = (c) => {
    setComposerMode('contacts');
    setSelectedContactId(c.id);
  };

  // Dispatch Emergency Message via WhatsApp
  const handleDispatchEmergency = async (e) => {
    if (e) e.preventDefault();
    setDispatchNotice(null);

    let phone = '';
    let name = '';
    let role = 'family';

    if (composerMode === 'contacts') {
      const contact = INITIAL_EMERGENCY_CONTACTS.find((c) => c.id === selectedContactId);
      if (!contact) {
        setDispatchNotice({ type: 'error', text: 'Please choose a contact.' });
        return;
      }
      phone = contact.phone;
      name = contact.name;
      role = contact.role;
    } else {
      const clean = manualPhone.replace(/[^\d]/g, '');
      if (clean.length < 7) {
        setDispatchNotice({ type: 'error', text: 'Please enter a valid phone number with country code.' });
        return;
      }
      phone = `${manualCountryCode} ${clean}`;
      name = manualRecipientName.trim() || `Emergency Contact (${clean.slice(-4)})`;
    }

    if (!customMessage.trim()) {
      setDispatchNotice({ type: 'error', text: 'Please enter an emergency message.' });
      return;
    }

    const templateObj = EMERGENCY_TEMPLATES.find((t) => t.id === selectedTemplateId);
    const category = templateObj ? templateObj.label : 'Medical Emergency';

    try {
      setDispatchSending(true);
      const res = await communicationApi.dispatchEmergency({
        recipientName: name,
        recipientPhone: phone,
        contactRole: role,
        templateId: selectedTemplateId,
        category,
        message: customMessage.trim(),
      });

      if (res?.success) {
        setDispatchNotice({
          type: 'success',
          text: `Emergency alert dispatched to ${name} (${phone}).`,
        });

        // Open WhatsApp Web if Click-to-Chat protocol
        if (res.waLink) {
          window.open(res.waLink, '_blank');
        }

        // Refresh recent logs table
        await fetchRecentLogs();
      } else {
        setDispatchNotice({ type: 'error', text: res?.message || 'Failed to dispatch alert.' });
      }
    } catch (err) {
      setDispatchNotice({ type: 'error', text: err.message || 'Dispatch error.' });
    } finally {
      setDispatchSending(false);
    }
  };

  return (
    <div className="emergency-page-container">
      {/* Active System Emergency Banner (if any facility alert is active) */}
      {activeEmergencies.length > 0 && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 12,
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Siren size={20} style={{ color: '#DC2626' }} />
            <div>
              <span style={{ fontWeight: 700, color: '#991B1B', fontSize: 13.5 }}>
                Active Facility Emergency: {activeEmergencies[0].residentName || 'Resident SOS'}
              </span>
              <span style={{ color: '#7F1D1D', fontSize: 12.5, marginLeft: 8 }}>
                "{activeEmergencies[0].reason || 'Assistance requested immediately'}"
              </span>
            </div>
          </div>
          <button
            type="button"
            className="category-pill-btn"
            style={{ background: '#DC2626', color: '#FFFFFF', borderColor: '#DC2626' }}
            onClick={() => resolveEmergency(activeEmergencies[0].id)}
          >
            Mark Resolved
          </button>
        </div>
      )}

      {/* 3-COLUMN LAYOUT MATCHING MOCKUP PAGE 2 */}
      <div className="emergency-page-grid">
        {/* ================= COLUMN 1: EMERGENCY CONTACTS ================= */}
        <div className="emergency-card">
          <div className="emergency-card-header">
            <div className="emergency-card-title">
              <span className="emergency-title-icon-red">
                <Siren size={18} />
              </span>
              <h3>Emergency Contacts</h3>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ padding: '12px 18px 8px' }}>
            <div className="chat-search-bar">
              <Search size={15} style={{ color: '#7E9E8D' }} />
              <input
                type="text"
                placeholder="Search emergency contacts..."
                value={directorySearch}
                onChange={(e) => {
                  setDirectorySearch(e.target.value);
                  setContactsPage(1);
                }}
              />
              {directorySearch && (
                <button
                  type="button"
                  onClick={() => setDirectorySearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} style={{ color: '#94A3B8' }} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="chat-filters-row">
            <button
              type="button"
              className={`category-pill-btn ${directoryRoleFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setDirectoryRoleFilter('all');
                setContactsPage(1);
              }}
            >
              All <span className="pill-count">8</span>
            </button>
            <button
              type="button"
              className={`category-pill-btn ${directoryRoleFilter === 'doctors' ? 'active' : ''}`}
              onClick={() => {
                setDirectoryRoleFilter('doctors');
                setContactsPage(1);
              }}
            >
              Doctors <span className="pill-count">2</span>
            </button>
            <button
              type="button"
              className={`category-pill-btn ${directoryRoleFilter === 'family' ? 'active' : ''}`}
              onClick={() => {
                setDirectoryRoleFilter('family');
                setContactsPage(1);
              }}
            >
              Family <span className="pill-count">4</span>
            </button>
            <button
              type="button"
              className={`category-pill-btn ${directoryRoleFilter === 'caregivers' ? 'active' : ''}`}
              onClick={() => {
                setDirectoryRoleFilter('caregivers');
                setContactsPage(1);
              }}
            >
              Caregivers <span className="pill-count">2</span>
            </button>
          </div>

          {/* Contacts List */}
          <ul className="emergency-contacts-list">
            {paginatedContacts.map((c) => (
              <li key={c.id} className="emergency-contact-item">
                <div className="emergency-contact-info-wrap">
                  <div className={`avatar-circle size-sm ${c.avatarClass}`}>
                    {c.initials}
                  </div>
                  <div className="emergency-contact-details">
                    <div className="emergency-contact-name-row">
                      <span className="emergency-contact-name">
                        {c.name} ({c.role?.charAt(0).toUpperCase() + c.role?.slice(1)})
                      </span>
                      {c.badge && (
                        <span className={`pill-badge ${c.badgeType}`}>
                          {c.badge}
                        </span>
                      )}
                    </div>
                    <div className="emergency-contact-phone">{c.phone}</div>
                  </div>
                </div>

                <div className="emergency-contact-actions">
                  <a
                    href={`tel:${c.phone}`}
                    className="emergency-icon-action-btn call"
                    title={`Call ${c.name}`}
                    aria-label={`Call ${c.name}`}
                  >
                    <Phone size={14} />
                  </a>
                  <button
                    type="button"
                    className="emergency-icon-action-btn whatsapp"
                    title={`Select ${c.name} for emergency message`}
                    onClick={() => handleSelectContactForMessage(c)}
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Bottom Pagination matching mockup */}
          <div style={{ borderTop: '1px solid #E2E8E5', marginTop: 'auto' }}>
            <Pagination
              page={contactsPage}
              totalPages={totalContactsPages}
              onPageChange={(p) => setContactsPage(p)}
              compact={true}
            />
          </div>
        </div>

        {/* ================= COLUMN 2: SEND EMERGENCY MESSAGE ================= */}
        <div className="emergency-card">
          <div className="emergency-card-header">
            <div className="emergency-card-title">
              <span className="emergency-title-icon-red">
                <Siren size={18} />
              </span>
              <div>
                <h3>Send Emergency Message</h3>
                <span style={{ fontSize: 11.5, color: '#64748B', display: 'block', marginTop: 1 }}>
                  Select a contact or enter a phone number to send an emergency message.
                </span>
              </div>
            </div>
          </div>

          <form className="emergency-composer-body" onSubmit={handleDispatchEmergency}>
            {dispatchNotice && (
              <div
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  background: dispatchNotice.type === 'error' ? '#FDE8E8' : '#DEF7EC',
                  color: dispatchNotice.type === 'error' ? '#DC2626' : '#03543F',
                  border: `1px solid ${dispatchNotice.type === 'error' ? '#F87171' : '#31C48D'}`,
                }}
              >
                {dispatchNotice.text}
              </div>
            )}

            {/* Toggle tabs: Select from Contacts | Enter Phone Number */}
            <div className="composer-toggle-tabs">
              <button
                type="button"
                className={`composer-toggle-tab ${composerMode === 'contacts' ? 'active' : ''}`}
                onClick={() => setComposerMode('contacts')}
              >
                <Users size={14} />
                <span>Select from Contacts</span>
              </button>
              <button
                type="button"
                className={`composer-toggle-tab ${composerMode === 'manual' ? 'active' : ''}`}
                onClick={() => setComposerMode('manual')}
              >
                <Phone size={14} />
                <span>Enter Phone Number</span>
              </button>
            </div>

            {/* Contact selector OR Manual Phone Input */}
            {composerMode === 'contacts' ? (
              <div className="composer-field-group">
                <label className="composer-label">Choose Contact *</label>
                <select
                  className="composer-select"
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  required
                >
                  {INITIAL_EMERGENCY_CONTACTS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role?.charAt(0).toUpperCase() + c.role?.slice(1)}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="composer-field-group">
                <label className="composer-label">Phone Number *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={manualCountryCode}
                    onChange={(e) => setManualCountryCode(e.target.value)}
                    className="composer-select"
                    style={{ width: 100 }}
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+65">+65 (SG)</option>
                  </select>
                  <input
                    type="tel"
                    className="composer-input"
                    placeholder="e.g. 98940 22011"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    style={{ flex: 1 }}
                    required
                  />
                </div>
                <input
                  type="text"
                  className="composer-input"
                  placeholder="Recipient Name (Optional)"
                  value={manualRecipientName}
                  onChange={(e) => setManualRecipientName(e.target.value)}
                  style={{ marginTop: 6 }}
                />
              </div>
            )}

            {/* Template Pills matching mockup */}
            <div className="composer-field-group">
              <label className="composer-label">Message Template (Optional)</label>
              <div className="template-pills-wrap">
                {EMERGENCY_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className={`template-pill ${selectedTemplateId === tmpl.id ? `active ${tmpl.pillClass}` : ''}`}
                    onClick={() => handleSelectTemplate(tmpl)}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Area */}
            <div className="composer-field-group">
              <label className="composer-label">Custom Message</label>
              <textarea
                className="composer-textarea"
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                required
              />
            </div>

            {/* Bottom Actions Row */}
            <div className="composer-actions-row">
              <button
                type="button"
                className="chat-action-btn"
                title="Attach Document or Image"
                aria-label="Attach File"
              >
                <Paperclip size={16} />
              </button>

              <button
                type="submit"
                className="btn-send-whatsapp"
                disabled={dispatchSending}
              >
                <MessageSquare size={16} />
                <span>{dispatchSending ? 'Sending...' : 'Send via WhatsApp'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ================= COLUMN 3: RECENT EMERGENCY MESSAGES ================= */}
        <div className="emergency-card">
          <div className="emergency-card-header">
            <div className="emergency-card-title">
              <span className="emergency-title-icon-clock">
                <Clock size={17} />
              </span>
              <h3>Recent Emergency Messages</h3>
            </div>
          </div>

          <ul className="recent-emergency-list">
            {recentLogsLoading && recentLogs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                Loading recent messages...
              </div>
            ) : recentLogs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                No recent emergency messages dispatched.
              </div>
            ) : (
              recentLogs.map((log) => {
                const initials = (log.recipientName || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <li key={log.id} className="recent-emergency-item">
                    <div className="avatar-circle size-sm avatar-coral">
                      {initials}
                    </div>

                    <div className="recent-emergency-info">
                      <div className="recent-emergency-top">
                        <span className="recent-emergency-name">{log.recipientName}</span>
                        {log.category && (
                          <span className="recent-emergency-tag">{log.category}</span>
                        )}
                      </div>

                      <div className="recent-emergency-msg">{log.message}</div>

                      <div className="recent-emergency-meta">
                        <span>{log.timestamp || 'Today'}</span>
                        <span className="chat-checkmarks">
                          <CheckCheck size={14} />
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Bottom Pagination for Recent Messages matching mockup */}
          <div style={{ borderTop: '1px solid #E2E8E5', marginTop: 'auto' }}>
            <Pagination
              page={recentLogsPage}
              totalPages={recentLogsTotalPages}
              onPageChange={(p) => setRecentLogsPage(p)}
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
