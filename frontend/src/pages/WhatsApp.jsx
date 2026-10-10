import { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Phone, Search, Plus, Paperclip, Smile,
  MoreVertical, CheckCheck, X, User, ExternalLink, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { communicationApi } from '../services/api.js';
import Pagination from '../components/Pagination.jsx';
import '../styles/chat.css';

// Predefined avatar color generator based on name
function getAvatarClass(name = '') {
  const classes = ['avatar-mint', 'avatar-coral', 'avatar-teal', 'avatar-purple', 'avatar-blue', 'avatar-sand'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return classes[sum % classes.length];
}

export default function WhatsApp() {
  const { user } = useApp();

  // State
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');

  // Filters & Pagination for Left Panel
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 6;

  // New Message Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newCountryCode, setNewCountryCode] = useState('+91');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientRole, setNewRecipientRole] = useState('Family');
  const [newMessageText, setNewMessageText] = useState('');
  const [modalError, setModalError] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Conversations from Backend MySQL
  const fetchConversations = async (keepSelection = false) => {
    try {
      setLoading(true);
      const res = await communicationApi.getConversations({
        page,
        limit,
        role: activeCategory,
        q: searchQuery,
      });

      if (res?.success) {
        setConversations(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || (res.data || []).length);

        if (!keepSelection || !selectedConv) {
          if (res.data && res.data.length > 0) {
            setSelectedConv(res.data[0]);
          }
        } else {
          // Keep current if still exists
          const found = res.data.find((c) => c.phone === selectedConv?.phone);
          if (found) setSelectedConv(found);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [page, activeCategory]);

  // Handle Search Debounce / Trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchConversations();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Messages when Selected Conversation changes
  useEffect(() => {
    if (!selectedConv?.phone) return;
    let isMounted = true;

    async function loadMessages() {
      try {
        setMessagesLoading(true);
        const res = await communicationApi.getMessages(selectedConv.phone);
        if (isMounted && res?.success) {
          setMessages(res.data || []);
          setTimeout(scrollToBottom, 50);
        }
      } catch (err) {
        console.warn('Failed to load message history:', err);
      } finally {
        if (isMounted) setMessagesLoading(false);
      }
    }

    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [selectedConv?.phone]);

  // Send Chat Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await communicationApi.sendMessage({
        phone: selectedConv.phone,
        text,
        recipientName: selectedConv.name,
        recipientRole: selectedConv.role,
        senderName: user?.name || 'ElderCare Staff',
        senderRole: user?.role || 'admin',
      });

      if (res?.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setTimeout(scrollToBottom, 50);

        // If WhatsApp click-to-chat fallback is provided and user is using desktop
        if (res.waLink && !res.deliveryMethod?.includes('Twilio')) {
          // Open WhatsApp web in background or new tab if Twilio not active
          window.open(res.waLink, '_blank');
        }

        // Refresh conversation snippets
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle Key Down in Textarea / Input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle New Message Modal Submission (Supports ANY phone number)
  const handleCreateNewMessage = async (e) => {
    e.preventDefault();
    setModalError('');

    const cleanDigits = newPhoneNumber.replace(/[^\d]/g, '');
    if (cleanDigits.length < 7) {
      setModalError('Please enter a valid phone number with at least 7 digits.');
      return;
    }

    const fullPhone = `${newCountryCode} ${cleanDigits}`;
    const recipientName = newRecipientName.trim() || `Contact ${cleanDigits.slice(-4)}`;
    const msgText = newMessageText.trim() || 'Hello! Reaching out from ElderCare.';

    try {
      setSending(true);
      const res = await communicationApi.sendMessage({
        phone: fullPhone,
        text: msgText,
        recipientName,
        recipientRole: newRecipientRole.toLowerCase(),
        senderName: user?.name || 'ElderCare Staff',
        senderRole: user?.role || 'admin',
      });

      if (res?.success) {
        setModalOpen(false);
        setNewPhoneNumber('');
        setNewRecipientName('');
        setNewMessageText('');

        const newConv = {
          id: fullPhone,
          phone: fullPhone,
          name: recipientName,
          role: newRecipientRole.toLowerCase(),
          initials: recipientName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(),
          lastMessage: msgText,
          lastTimestamp: 'Just now',
          unreadCount: 0,
        };

        // Open WhatsApp web if Click-to-Chat fallback
        if (res.waLink && !res.deliveryMethod?.includes('Twilio')) {
          window.open(res.waLink, '_blank');
        }

        setSelectedConv(newConv);
        await fetchConversations(true);
      } else {
        setModalError(res?.message || 'Could not send message.');
      }
    } catch (err) {
      setModalError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: totalCount || 12,
      family: 4,
      caregivers: 3,
      doctors: 2,
    };
  }, [totalCount]);

  return (
    <div className="chat-page-container">
      <div className="chat-page-layout">
        {/* ================= LEFT PANEL: CONVERSATIONS LIST ================= */}
        <div className="chat-sidebar">
          {/* Header */}
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-title">
              <div className="chat-whatsapp-icon">
                <MessageSquare size={17} />
              </div>
              <h2>Messages</h2>
            </div>
            <button
              type="button"
              className="btn-new-message"
              onClick={() => {
                setModalError('');
                setModalOpen(true);
              }}
            >
              <Plus size={15} />
              <span>New Message</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="chat-search-section">
            <div className="chat-search-bar">
              <Search size={15} style={{ color: '#7E9E8D' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} style={{ color: '#94A3B8' }} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills matching mockup */}
          <div className="chat-filters-row">
            <button
              type="button"
              className={`category-pill-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('all');
                setPage(1);
              }}
            >
              All <span className="pill-count">{categoryCounts.all}</span>
            </button>
            <button
              type="button"
              className={`category-pill-btn ${activeCategory === 'family' ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('family');
                setPage(1);
              }}
            >
              Family <span className="pill-count">{categoryCounts.family}</span>
            </button>
            <button
              type="button"
              className={`category-pill-btn ${activeCategory === 'caregivers' ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('caregivers');
                setPage(1);
              }}
            >
              Caregivers <span className="pill-count">{categoryCounts.caregivers}</span>
            </button>
            <button
              type="button"
              className={`category-pill-btn ${activeCategory === 'doctors' ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('doctors');
                setPage(1);
              }}
            >
              Doctors <span className="pill-count">{categoryCounts.doctors}</span>
            </button>
          </div>

          {/* Conversation Items List */}
          <ul className="chat-conv-list">
            {loading && conversations.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                No conversations found.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.phone === c.phone;
                const avatarClass = getAvatarClass(c.name);

                return (
                  <li
                    key={c.id || c.phone}
                    className={`chat-conv-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedConv(c)}
                  >
                    <div className={`avatar-circle ${avatarClass}`}>
                      {c.initials || c.name?.[0] || 'U'}
                    </div>

                    <div className="chat-conv-info">
                      <div className="chat-conv-header">
                        <div className="chat-conv-name-row">
                          <span className="chat-conv-name">{c.name}</span>
                          <span className="chat-conv-role">
                            • {c.role?.charAt(0).toUpperCase() + c.role?.slice(1)}
                          </span>
                        </div>
                        <span className="chat-conv-time">{c.lastTimestamp}</span>
                      </div>

                      <div className="chat-conv-snippet-row">
                        <span className="chat-conv-snippet">{c.lastMessage}</span>
                        {c.unreadCount > 0 && (
                          <span className="chat-unread-badge">{c.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Bottom Pagination for Left Panel matching mockup < 1 [2] 3 4 5 > */}
          <div className="chat-sidebar-footer">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              compact={true}
            />
          </div>
        </div>

        {/* ================= RIGHT PANEL: SELECTED CONVERSATION ================= */}
        <div className="chat-main">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="chat-main-header">
                <div className="chat-header-contact">
                  <div className={`avatar-circle size-md ${getAvatarClass(selectedConv.name)}`}>
                    {selectedConv.initials || selectedConv.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="chat-header-name">{selectedConv.name}</h3>
                    <div className="chat-header-sub">
                      <span>{selectedConv.role?.charAt(0).toUpperCase() + selectedConv.role?.slice(1)}</span>
                      <span>•</span>
                      <span>{selectedConv.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <button
                    type="button"
                    className="chat-action-btn"
                    title="Search Messages"
                    aria-label="Search Messages"
                  >
                    <Search size={16} />
                  </button>
                  <a
                    href={`tel:${selectedConv.phone}`}
                    className="chat-action-btn"
                    title="Call Contact"
                    aria-label="Call Contact"
                  >
                    <Phone size={16} />
                  </a>
                  <button
                    type="button"
                    className="chat-action-btn"
                    title="More Options"
                    onClick={() => {
                      const clean = selectedConv.phone.replace(/[^\d]/g, '');
                      window.open(`https://wa.me/${clean}`, '_blank');
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Message History */}
              <div className="chat-messages-area">
                <div className="chat-date-separator">Today</div>

                {messagesLoading ? (
                  <div style={{ textAlign: 'center', color: '#64748B', fontSize: 13, padding: 20 }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748B', fontSize: 13, padding: 30 }}>
                    No messages yet. Send a message to start the conversation.
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isOutbound = m.direction === 'outbound' || m.senderId === 'SYSTEM';

                    return (
                      <div
                        key={m.id || idx}
                        className={`chat-bubble-row ${isOutbound ? 'outbound' : 'inbound'}`}
                      >
                        <div className={`chat-bubble ${isOutbound ? 'outbound' : 'inbound'}`}>
                          <div className="chat-bubble-text">{m.text}</div>
                          <div className="chat-bubble-meta">
                            <span>{m.timestamp || '09:20 AM'}</span>
                            {isOutbound && (
                              <span className="chat-checkmarks">
                                <CheckCheck size={14} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form className="chat-input-bar" onSubmit={handleSendMessage}>
                <button
                  type="button"
                  className="chat-action-btn"
                  title="Attach File"
                  aria-label="Attach File"
                >
                  <Paperclip size={17} />
                </button>

                <input
                  type="text"
                  className="chat-input-field"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />

                <button
                  type="button"
                  className="chat-action-btn"
                  title="Insert Emoji"
                  onClick={() => setInputText((prev) => prev + ' 😊')}
                >
                  <Smile size={17} />
                </button>

                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!inputText.trim() || sending}
                  title="Send Message (Enter)"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#64748B', padding: 40 }}>
              <MessageSquare size={42} style={{ color: '#0F5132', opacity: 0.5, marginBottom: 12 }} />
              <h3 style={{ fontSize: 17, color: '#111827', margin: 0 }}>Select a Conversation</h3>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                Choose a contact from the list or click New Message to message any number.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= NEW MESSAGE MODAL (ANY PHONE NUMBER) ================= */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Compose New Message</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewMessage}>
              <div className="modal-body">
                {modalError && (
                  <div style={{ background: '#FDE8E8', color: '#DC2626', padding: '8px 12px', borderRadius: 8, fontSize: 12.5 }}>
                    {modalError}
                  </div>
                )}

                <div className="composer-field-group">
                  <label className="composer-label">Phone Number *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value)}
                      className="composer-select"
                      style={{ width: 100 }}
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+65">+65 (SG)</option>
                      <option value="+971">+971 (UAE)</option>
                    </select>
                    <input
                      type="tel"
                      className="composer-input"
                      placeholder="e.g. 98765 43210"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      style={{ flex: 1 }}
                      required
                    />
                  </div>
                  <span style={{ fontSize: 11, color: '#7E9E8D' }}>
                    You can enter any valid phone number, even if it is not saved in contacts.
                  </span>
                </div>

                <div className="composer-field-group">
                  <label className="composer-label">Recipient Name (Optional)</label>
                  <input
                    type="text"
                    className="composer-input"
                    placeholder="e.g. Radha Pillai"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                  />
                </div>

                <div className="composer-field-group">
                  <label className="composer-label">Category / Role</label>
                  <select
                    className="composer-select"
                    value={newRecipientRole}
                    onChange={(e) => setNewRecipientRole(e.target.value)}
                  >
                    <option value="Family">Family Member</option>
                    <option value="Caregiver">Caregiver</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Other">Other / Emergency</option>
                  </select>
                </div>

                <div className="composer-field-group">
                  <label className="composer-label">Message *</label>
                  <textarea
                    className="composer-textarea"
                    placeholder="Type your message here..."
                    rows={4}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="category-pill-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-new-message"
                  disabled={sending}
                >
                  <Send size={15} />
                  <span>{sending ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
