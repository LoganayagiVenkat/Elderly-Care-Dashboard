import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, ShieldCheck, Key, CheckCircle2, ArrowRight, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import {
  getGoogleClientId,
  setGoogleClientId,
  isGoogleClientConfigured,
  launchGoogleOAuthPopup
} from '../services/googleAuth.js';
import '../styles/googleAuth.css';

// Official Multi-Color Google "G" Logo SVG
export function GoogleIcon({ className = 'google-icon-svg', style }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '20px',
        height: '20px',
        minWidth: '20px',
        minHeight: '20px',
        maxWidth: '20px',
        maxHeight: '20px',
        flexShrink: 0,
        display: 'block',
        ...style
      }}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function GoogleAuthModal({ isOpen, onClose, initialRole = 'caregiver' }) {
  const navigate = useNavigate();
  const { googleLogin } = useApp();

  const [activeTab, setActiveTab] = useState('oauth'); // 'oauth' | 'direct'
  const [clientIdInput, setClientIdInput] = useState(() => getGoogleClientId());
  const [isConfigured, setIsConfigured] = useState(() => isGoogleClientConfigured());
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Direct login state
  const [directEmail, setDirectEmail] = useState('');
  const [directName, setDirectName] = useState('');
  const [directRole, setDirectRole] = useState(initialRole || 'caregiver');

  useEffect(() => {
    if (isOpen) {
      const current = getGoogleClientId();
      setClientIdInput(current);
      setIsConfigured(Boolean(current));
      setErrorMsg('');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  // Launch official Google OAuth popup
  const handleLaunchGoogleOAuth = async () => {
    const activeId = clientIdInput.trim() || getGoogleClientId();
    if (!activeId) {
      setErrorMsg('Please enter your Google OAuth Web Client ID first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Save active Client ID to localStorage
    setGoogleClientId(activeId);
    setIsConfigured(true);

    try {
      await launchGoogleOAuthPopup({
        role: initialRole || 'caregiver',
        isRegistration: false,
        onSuccess: async (googleUser) => {
          try {
            const res = await googleLogin({ ...googleUser, isRegistration: false });
            if (res && res.success) {
              setLoading(false);
              onClose();
              navigate('/dashboard');
            } else if (res?.code === 'UNREGISTERED_ACCOUNT') {
              setLoading(false);
              setErrorMsg(res.message || 'This Google account is not registered in ElderCare. Please register your account first.');
            } else {
              setLoading(false);
              setErrorMsg(res?.message || 'Google sign-in completed but login failed.');
            }
          } catch (err) {
            setLoading(false);
            if (err?.code === 'UNREGISTERED_ACCOUNT' || err?.data?.code === 'UNREGISTERED_ACCOUNT') {
              setErrorMsg(err.message || 'This Google account is not registered in ElderCare. Please register your account first.');
            } else {
              setErrorMsg(err?.message || 'Sign-in session creation failed.');
            }
          }
        },
        onError: (err) => {
          setLoading(false);
          const raw = String(err?.message || err);
          if (raw.includes('popup_closed') || raw.includes('closed') || raw.includes('cancelled')) {
            setErrorMsg('Google login window was closed.');
          } else {
            setErrorMsg(raw || 'Failed to initialize Google login.');
          }
        }
      });
    } catch (err) {
      setLoading(false);
      setErrorMsg(err?.message || 'Failed to launch Google popup.');
    }
  };

  // Direct email login (immediate access)
  const handleDirectSubmit = async (e) => {
    e.preventDefault();
    if (!directEmail.trim() || !directEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const cleanEmail = directEmail.trim().toLowerCase();
    const cleanName = directName.trim() || cleanEmail.split('@')[0];

    const payload = {
      name: cleanName,
      email: cleanEmail,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=1a73e8&color=fff&bold=true`,
      role: directRole || initialRole || 'caregiver',
      initials: cleanName.slice(0, 2).toUpperCase()
    };

    try {
      const res = await googleLogin(payload);
      if (res && res.success) {
        setLoading(false);
        onClose();
        navigate('/dashboard');
      } else {
        setLoading(false);
        setErrorMsg(res?.message || 'Login failed.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err?.message || 'Login failed.');
    }
  };

  const handleSaveClientId = () => {
    if (!clientIdInput.trim()) {
      setErrorMsg('Please enter a valid Google Client ID.');
      return;
    }
    setGoogleClientId(clientIdInput.trim());
    setIsConfigured(true);
    setSavedSuccess(true);
    setErrorMsg('');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="google-modal-backdrop" onClick={() => !loading && onClose()}>
      <div className="google-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="google-modal-header">
          <button
            type="button"
            className="google-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="google-modal-logo">
            <GoogleIcon style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }} />
          </div>
          <h3>Real-Time Google Sign-In</h3>
          <p>
            Connect ElderCare with your <b>official Google Account</b>
          </p>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="google-modal-tabs">
          <button
            type="button"
            className={`google-tab-btn ${activeTab === 'oauth' ? 'active' : ''}`}
            onClick={() => { setActiveTab('oauth'); setErrorMsg(''); }}
          >
            <ShieldCheck size={16} /> Official Google OAuth
          </button>
          <button
            type="button"
            className={`google-tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
            onClick={() => { setActiveTab('direct'); setErrorMsg(''); }}
          >
            <Mail size={16} /> Quick Email Access
          </button>
        </div>

        {/* Tab 1: Official Google OAuth */}
        {activeTab === 'oauth' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#3c4043' }}>
                Google Cloud OAuth Status:
              </span>
              <span className={`google-status-pill ${isConfigured ? 'configured' : 'unconfigured'}`}>
                {isConfigured ? '🟢 OAuth Ready' : '⚠️ Client ID Needed'}
              </span>
            </div>

            {/* If Client ID is ready, show 1-click launch button */}
            {isConfigured ? (
              <div style={{ background: '#f8fafd', padding: '16px', borderRadius: '10px', border: '1px solid #d2e3fc', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#1a73e8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  ✅ Your Google OAuth Client ID is active. Clicking below will open Google&apos;s <b>official popup window (accounts.google.com)</b> showing all real-time Google accounts currently logged in to your browser!
                </p>

                <button
                  type="button"
                  className="google-oauth-launch-btn"
                  onClick={handleLaunchGoogleOAuth}
                  disabled={loading}
                >
                  <GoogleIcon />
                  <span>{loading ? 'Opening Google...' : 'Open Official Google Account Selector'}</span>
                  <ExternalLink size={16} />
                </button>
              </div>
            ) : null}

            {/* Client ID Configuration Section */}
            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px', border: '1px solid #dadce0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Key size={16} color="#1a73e8" />
                <label style={{ fontSize: 13, fontWeight: 600, color: '#202124' }}>
                  {isConfigured ? 'Update Google OAuth Web Client ID:' : 'Enter Google OAuth Web Client ID:'}
                </label>
              </div>
              <p style={{ fontSize: 12, color: '#5f6368', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                Google&apos;s security strictly requires a free Client ID to open your browser&apos;s real-time accounts from <code>localhost:5173</code>.
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. 123456789-abcdefg.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    fontSize: '12.5px',
                    fontFamily: 'monospace',
                    border: '1px solid #dadce0',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  className="google-btn-save-id"
                  onClick={handleSaveClientId}
                >
                  Save ID
                </button>
              </div>

              {savedSuccess && (
                <div style={{ color: '#137333', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontWeight: 500 }}>
                  <CheckCircle2 size={14} /> Client ID saved successfully!
                </div>
              )}

              {!isConfigured && (
                <button
                  type="button"
                  className="google-oauth-launch-btn"
                  onClick={handleLaunchGoogleOAuth}
                  disabled={loading || !clientIdInput.trim()}
                  style={{ marginTop: 14 }}
                >
                  <GoogleIcon />
                  <span>Save & Open Real Google Popup</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {/* 3-Step Setup Instructions */}
              <div style={{ marginTop: 16, borderTop: '1px solid #e0e0e0', paddingTop: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#5f6368', textTransform: 'uppercase', marginBottom: 8 }}>
                  How to get a Client ID in 2 minutes (Free from Google):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#3c4043', lineHeight: 1.4 }}>
                  <div>1. Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#1a73e8', textDecoration: 'underline' }}>console.cloud.google.com/apis/credentials</a></div>
                  <div>2. Click <b>Create Credentials → OAuth client ID</b> (Application type: <b>Web application</b>).</div>
                  <div>3. Under <b>Authorized JavaScript origins</b>, add: <code style={{ background: '#e8eaed', padding: '1px 5px', borderRadius: 3 }}>http://localhost:5173</code> and <code style={{ background: '#e8eaed', padding: '1px 5px', borderRadius: 3 }}>http://127.0.0.1:5173</code></div>
                  <div>4. Under <b>Authorized redirect URIs</b>, add: <code style={{ background: '#e8eaed', padding: '1px 5px', borderRadius: 3 }}>http://localhost:5173</code> and <code style={{ background: '#e8eaed', padding: '1px 5px', borderRadius: 3 }}>http://127.0.0.1:5173</code></div>
                  <div>5. Copy Client ID to <code style={{ background: '#e8eaed', padding: '1px 5px', borderRadius: 3 }}>frontend/.env</code> and Client Secret to <code style={{ background: '#e8eaed', padding: '1px 5px', borderRadius: 3 }}>backend/.env</code>.</div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#fce8e6', color: '#c5221f', borderRadius: 6, fontSize: 12.5, fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Direct Email Access (Zero setup needed) */}
        {activeTab === 'direct' && (
          <form onSubmit={handleDirectSubmit} style={{ padding: '20px' }}>
            <p style={{ fontSize: 13, color: '#5f6368', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Want instant access without configuring Google Cloud? Enter your Google / institutional email below to log in directly:
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3c4043', marginBottom: 4 }}>
                Google Email Address:
              </label>
              <input
                type="email"
                placeholder="e.g. 24104073@nec.edu.in or yourname@gmail.com"
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid #dadce0',
                  borderRadius: 6,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3c4043', marginBottom: 4 }}>
                Your Name:
              </label>
              <input
                type="text"
                placeholder="e.g. Anand Kumar"
                value={directName}
                onChange={(e) => setDirectName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid #dadce0',
                  borderRadius: 6,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3c4043', marginBottom: 6 }}>
                Select Role in ElderCare:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { role: 'caregiver', label: 'Caregiver' },
                  { role: 'doctor', label: 'Doctor' },
                  { role: 'family', label: 'Family Member' },
                  { role: 'patient', label: 'Resident' },
                  { role: 'admin', label: 'Admin' }
                ].map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setDirectRole(r.role)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 16,
                      border: '1px solid',
                      borderColor: directRole === r.role ? '#1a73e8' : '#dadce0',
                      background: directRole === r.role ? '#e8f0fe' : '#ffffff',
                      color: directRole === r.role ? '#1a73e8' : '#3c4043',
                      fontSize: 12,
                      fontWeight: directRole === r.role ? 600 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fce8e6', color: '#c5221f', borderRadius: 6, fontSize: 12.5 }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                background: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Logging in...' : 'Sign In with This Email'}
            </button>
          </form>
        )}

        <div className="google-modal-footer">
          To continue, Google shares your name, email address, language preference, and profile picture with ElderCare.
        </div>
      </div>
    </div>
  );
}

// Reusable "Continue with Google" Button (Horizontal & Standard Google Design)
export function GoogleSignInButton({ onClick, text = 'Continue with Google', disabled = false }) {
  return (
    <button
      type="button"
      className="btn-google"
      onClick={onClick}
      disabled={disabled}
      id="btn-continue-with-google"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        minHeight: '44px',
        height: '44px',
        padding: '10px 18px',
        backgroundColor: '#ffffff',
        color: '#3c4043',
        border: '1px solid #dadce0',
        borderRadius: '8px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(60, 64, 67, 0.08)',
        marginBottom: '16px',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      <GoogleIcon />
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#3c4043', letterSpacing: '0.2px' }}>
        {text}
      </span>
    </button>
  );
}
