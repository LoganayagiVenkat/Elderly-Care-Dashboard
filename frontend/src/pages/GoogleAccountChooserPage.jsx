import { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, ArrowLeft } from 'lucide-react';
import { GoogleIcon } from '../components/GoogleAuthModal.jsx';
import '../styles/googleDarkChooser.css';

export default function GoogleAccountChooserPage() {
  const [accounts, setAccounts] = useState(() => {
    try {
      const raw = localStorage.getItem('eldercare_saved_google_accounts');
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          return saved.filter((a) => (a.email || '').toLowerCase() !== 'jeyakirthikavjk@gmail.com');
        }
      }
    } catch {}
    return [];
  });

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showOtherForm, setShowOtherForm] = useState(() => accounts.length === 0);
  const [otherName, setOtherName] = useState('');
  const [otherEmail, setOtherEmail] = useState('');
  const [otherRole, setOtherRole] = useState('caregiver');
  const [otherError, setOtherError] = useState('');

  useEffect(() => {
    document.title = 'Sign in - Google Accounts';
  }, []);

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setLoading(true);

    const payload = {
      name: account.name,
      email: account.email.trim().toLowerCase(),
      picture: account.picture || null,
      role: account.role || 'caregiver',
      initials: account.initials || account.name.slice(0, 2).toUpperCase()
    };

    // Save to local storage for persistence
    try {
      const raw = localStorage.getItem('eldercare_saved_google_accounts');
      const list = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((a) => (a.email || '').toLowerCase() !== payload.email);
      localStorage.setItem('eldercare_saved_google_accounts', JSON.stringify([payload, ...filtered]));
    } catch {}

    setTimeout(() => {
      setSuccess(true);

      // Communicate with parent window
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_SUCCESS',
              user: payload
            },
            '*'
          );
        } catch (err) {
          console.warn('[Google Popup] postMessage error:', err);
        }
      } else {
        // Also write directly to localStorage so parent can pick up if postMessage failed
        localStorage.setItem('eldercare_pending_google_login', JSON.stringify(payload));
      }

      setTimeout(() => {
        window.close();
      }, 500);
    }, 700);
  };

  const handleOtherSubmit = (e) => {
    e.preventDefault();
    if (!otherName.trim()) {
      setOtherError('Enter your name');
      return;
    }
    if (!otherEmail.trim() || !otherEmail.includes('@')) {
      setOtherError('Enter a valid Google email address');
      return;
    }

    const cleanEmail = otherEmail.trim().toLowerCase();
    const cleanName = otherName.trim();
    const newAcc = {
      name: cleanName,
      email: cleanEmail,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=1a73e8&color=fff&bold=true`,
      initials: cleanName.slice(0, 2).toUpperCase(),
      role: otherRole || 'caregiver'
    };

    handleSelectAccount(newAcc);
  };

  return (
    <div className="google-dark-window">
      {/* Top Chrome Address / Origin Bar Replica */}
      <div className="google-dark-topbar">
        <div className="google-dark-origin">
          <svg className="google-tune-icon" viewBox="0 0 24 24" width="14" height="14">
            <path
              d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"
              fill="#9aa0a6"
            />
          </svg>
          <span className="google-dark-url">
            accounts.google.com/v3/signin/accountchooser
          </span>
        </div>
      </div>

      <div className="google-dark-card">
        {/* Loading Progress Bar */}
        {loading && (
          <div className="google-dark-progress">
            <div className="google-dark-progress-bar" />
          </div>
        )}

        {/* Brand Header */}
        <div className="google-dark-brand">
          <GoogleIcon className="google-dark-glogo" />
          <span>Sign in with Google</span>
        </div>

        {/* Big Heading */}
        <h1 className="google-dark-title">Choose an account</h1>
        <p className="google-dark-sub">
          to continue to <span className="google-dark-appname">ElderCare</span>
        </p>

        {/* Accounts List */}
        {!showOtherForm ? (
          <div className="google-dark-list">
            {accounts.map((acc) => (
              <div
                key={acc.email}
                className={`google-dark-item ${selectedAccount?.email === acc.email ? 'selected' : ''}`}
                onClick={() => !loading && handleSelectAccount(acc)}
                role="button"
                tabIndex={0}
              >
                <div className="google-dark-avatar-wrap">
                  {acc.picture ? (
                    <img
                      src={acc.picture}
                      alt={acc.name}
                      className="google-dark-avatar-img"
                    />
                  ) : (
                    <div className="google-dark-avatar-init">
                      {acc.initials || acc.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="google-dark-meta">
                  <div className="google-dark-name">{acc.name}</div>
                  <div className="google-dark-email">{acc.email}</div>
                </div>
              </div>
            ))}

            {/* Use another account row */}
            <div
              className="google-dark-item use-another"
              onClick={() => !loading && setShowOtherForm(true)}
              role="button"
              tabIndex={0}
            >
              <div className="google-dark-avatar-wrap">
                <div className="google-dark-avatar-icon">
                  <UserPlus size={18} color="#9aa0a6" />
                </div>
              </div>
              <div className="google-dark-meta">
                <div className="google-dark-name">Use another account</div>
              </div>
            </div>
          </div>
        ) : (
          <form className="google-dark-other-form" onSubmit={handleOtherSubmit}>
            {accounts.length > 0 && (
              <button
                type="button"
                className="google-dark-back-btn"
                onClick={() => setShowOtherForm(false)}
              >
                <ArrowLeft size={16} /> Back to saved accounts
              </button>
            )}

            <div className="google-dark-field">
              <label>Google Email (Gmail)</label>
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={otherEmail}
                onChange={(e) => setOtherEmail(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="google-dark-field">
              <label>Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                required
              />
            </div>

            <div className="google-dark-field">
              <label>Select Role in ElderCare</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {[
                  { role: 'caregiver', label: 'Caregiver' },
                  { role: 'doctor', label: 'Doctor' },
                  { role: 'family', label: 'Family' },
                  { role: 'patient', label: 'Resident' },
                  { role: 'admin', label: 'Admin' }
                ].map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setOtherRole(r.role)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: otherRole === r.role ? '#8ab4f8' : '#3c4043',
                      background: otherRole === r.role ? 'rgba(138, 180, 248, 0.15)' : 'transparent',
                      color: otherRole === r.role ? '#8ab4f8' : '#bdc1c6',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: otherRole === r.role ? 600 : 400
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {otherError && <div className="google-dark-error">{otherError}</div>}

            <button type="submit" className="google-dark-next-btn" style={{ marginTop: '16px' }}>
              Sign In with Google
            </button>
          </form>
        )}

        {/* Footer Notice */}
        <div className="google-dark-footer">
          To continue, Google will share your name, email address, language preference, and profile picture with ElderCare.
        </div>
      </div>
    </div>
  );
}
