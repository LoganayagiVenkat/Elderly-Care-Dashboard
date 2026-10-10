import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartHandshake, UserRound, Lock, Eye, EyeOff, Shield, UserCog, Users, HeartPulse, Stethoscope } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import GoogleAuthModal, { GoogleSignInButton } from '../components/GoogleAuthModal.jsx';
import { isGoogleClientConfigured, launchGoogleOAuthPopup } from '../services/googleAuth.js';

const QUICK_LOGINS = [
  { role: 'admin', label: 'Admin', username: 'admin', desc: 'System Admin', icon: Shield },
  { role: 'caregiver', label: 'Caregiver', username: 'caregiver', desc: 'Senior Nurse', icon: UserCog },
  { role: 'doctor', label: 'Doctor (Specialist)', username: 'doctor', desc: 'Chief Cardiologist', icon: Stethoscope },
  { role: 'family', label: 'Family', username: 'family', desc: 'Resident Guardian', icon: Users },
  { role: 'patient', label: 'Resident', username: 'patient', desc: 'Senior Resident', icon: HeartPulse },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, googleLogin } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [unregisteredGoogleUser, setUnregisteredGoogleUser] = useState(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  // Listen for Google Auth completion from popup window
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        try {
          setError('');
          setUnregisteredGoogleUser(null);
          setLoading(true);
          const res = await googleLogin({ ...event.data.user, isRegistration: false });
          setLoading(false);
          if (res?.success) {
            navigate('/dashboard');
          } else if (res?.code === 'UNREGISTERED_ACCOUNT') {
            setUnregisteredGoogleUser(res.googleUser || event.data.user);
            setError(res.message || 'This Google account is not registered. Please create an account first.');
          }
        } catch (err) {
          setLoading(false);
          if (err?.code === 'UNREGISTERED_ACCOUNT' || err?.data?.code === 'UNREGISTERED_ACCOUNT') {
            setUnregisteredGoogleUser(err.data?.googleUser || event.data.user);
            setError(err.message || 'This Google account is not registered. Please create an account first.');
          } else {
            setError(err?.message || 'Google sign-in failed.');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [googleLogin, navigate]);

  const handleGoogleClick = () => {
    setError('');
    setUnregisteredGoogleUser(null);
    if (isGoogleClientConfigured()) {
      launchGoogleOAuthPopup({
        role: selectedRole || 'caregiver',
        isRegistration: false,
        onSuccess: async (googleData) => {
          try {
            setLoading(true);
            const res = await googleLogin({ ...googleData, isRegistration: false });
            setLoading(false);
            if (res?.success) {
              navigate('/dashboard');
            } else if (res?.code === 'UNREGISTERED_ACCOUNT') {
              setUnregisteredGoogleUser(res.googleUser || googleData);
              setError(res.message || 'This Google account is not registered. Please create an account first.');
            } else {
              setError(res?.message || 'Google sign-in failed.');
            }
          } catch (err) {
            setLoading(false);
            if (err?.code === 'UNREGISTERED_ACCOUNT' || err?.data?.code === 'UNREGISTERED_ACCOUNT') {
              setUnregisteredGoogleUser(err.data?.googleUser || googleData);
              setError(err.message || 'This Google account is not registered. Please create an account first.');
            } else {
              setError(err?.message || 'Google sign-in failed.');
            }
          }
        },
        onError: (err) => {
          setLoading(false);
          const raw = String(err?.message || err);
          if (raw.includes('cancelled') || raw.includes('closed') || raw.includes('popup_closed')) {
            setError('Google sign-in was cancelled (popup window was closed).');
          } else {
            console.warn('[Google OAuth Error]', err);
            setGoogleModalOpen(true);
          }
        }
      });
      return;
    }
    setGoogleModalOpen(true);
  };

  const attemptLogin = async (loginUsername, loginPassword) => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('Please enter both your username and password to continue.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await login(loginUsername, loginPassword, remember);
      if (!result || !result.success) {
        setError(result?.message || 'Incorrect username or password. Please try again.');
        setLoading(false);
        return;
      }
      setError('');
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed. Please check connection and credentials.');
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    attemptLogin(username, password);
  };

  const handleRoleSelect = (quick) => {
    setSelectedRole(quick.role);
    setUsername(quick.username);
    setPassword(quick.username); // autofill demo password so Sign In works immediately!
    setError('');
  };

  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <div className="auth-visual-top">
          <div className="brand-mark">
            <HeartHandshake size={22} />
          </div>
          <div>
            <h1>ElderCare</h1>
            <span>Elderly Care Management System</span>
          </div>
        </div>

        <div className="auth-visual-mid">
          <span className="quote-mark">&ldquo;</span>
          <h2>Coordinated, compassionate care — organized in one place.</h2>
          <p>
            ElderCare brings resident profiles, medication schedules, care records and
            caregiver coordination together in a single, dependable workspace built for
            admins, caregivers, families and residents alike.
          </p>
        </div>

        <div className="auth-visual-stats">
          <div className="stat">
            <b>6</b>
            <span>Residents in care</span>
          </div>
          <div className="stat">
            <b>4</b>
            <span>Role-based dashboards</span>
          </div>
          <div className="stat">
            <b>92%</b>
            <span>Weekly adherence</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form-box">
          <div className="eyebrow form-eyebrow">Care Team Access</div>
          <h2>Welcome Back</h2>
          <p className="lede">Sign in to continue to your care management dashboard.</p>

          <GoogleSignInButton
            onClick={handleGoogleClick}
            text={loading ? 'Authenticating with Google...' : 'Continue with Google'}
            disabled={loading}
          />

          {error && (
            <div
              className="auth-error-banner"
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 13,
                lineHeight: 1.4,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 500 }}>{error}</div>
              {unregisteredGoogleUser && (
                <div>
                  <button
                    type="button"
                    onClick={() => navigate('/register', { state: { googleUser: unregisteredGoogleUser } })}
                    style={{
                      background: 'var(--color-primary, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Register Google Account ({unregisteredGoogleUser.email}) &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="auth-divider">
            <span>or continue with username</span>
          </div>

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className={`field ${!unregisteredGoogleUser && error ? 'has-error' : ''}`}>
              <label htmlFor="username">Username</label>
              <div className="input-wrap">
                <UserRound size={16} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className={`field ${!unregisteredGoogleUser && error ? 'has-error' : ''}`}>
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!unregisteredGoogleUser && error && <span className="error-text">{error}</span>}
            </div>

            <div className="auth-row-between">
              <label className="checkbox-row">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <Link to="/forgot-password" className="link-accent">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Sign In
            </button>
          </form>

          <div className="quick-login-block">
            <div className="eyebrow" style={{ margin: '20px 0 10px' }}>Select Role</div>
            <div className="quick-login-grid">
              {QUICK_LOGINS.map((q) => (
                <button
                  key={q.role}
                  type="button"
                  className={`quick-login-chip ${selectedRole === q.role ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(q)}
                >
                  <q.icon size={14} />
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="auth-switch">
            Don&rsquo;t have an account? <Link to="/register" className="link-accent">Create an account</Link>
          </div>
        </div>
      </div>

      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        initialRole={selectedRole || 'caregiver'}
      />
    </div>
  );
}
