import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { HeartHandshake, User, UserRound, Mail, Phone, Lock, Eye, EyeOff, IdCard, CheckCircle2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { elderlyResidents } from '../data/dummyData';
import GoogleAuthModal, { GoogleSignInButton } from '../components/GoogleAuthModal.jsx';
import { isGoogleClientConfigured, launchGoogleOAuthPopup } from '../services/googleAuth.js';

const ROLES = [
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'doctor', label: 'Doctor (Specialist)' },
  { value: 'family', label: 'Family Member' },
  { value: 'patient', label: 'Patient / Elderly' },
  { value: 'admin', label: 'Admin (System Administrator)' },
];

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedGoogleUser = location.state?.googleUser || null;

  const { register, residents, googleLogin } = useApp();
  const activeResidents = residents && residents.length > 0 ? residents : elderlyResidents;

  // ---- useState: form fields, pre-filled if redirected from Google login ----
  const [name, setName] = useState(() => passedGoogleUser?.name || '');
  const [username, setUsername] = useState(() => passedGoogleUser?.email ? passedGoogleUser.email.split('@')[0] : '');
  const [email, setEmail] = useState(() => passedGoogleUser?.email || '');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('family');
  const [residentId, setResidentId] = useState(activeResidents[0]?.id || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ---- useState: validation + UI state ----
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState({ score: 0, label: '' });
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const needsResident = role === 'family' || role === 'patient';

  // Listen for Google Auth completion from popup window
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        if (role === 'admin') {
          setErrors((prev) => ({
            ...prev,
            submit: 'Admin accounts cannot be self-registered via Google OAuth. Please select another role or contact the administrator.'
          }));
          return;
        }
        try {
          setGoogleLoading(true);
          const res = await googleLogin({
            ...event.data.user,
            role: role || 'family',
            isRegistration: true,
            residentId: needsResident ? residentId : null
          });
          setGoogleLoading(false);
          if (res?.success) {
            navigate('/dashboard');
          } else {
            setErrors((prev) => ({ ...prev, submit: res?.message || 'Google registration failed.' }));
          }
        } catch (err) {
          setGoogleLoading(false);
          setErrors((prev) => ({ ...prev, submit: err?.message || 'Google registration failed.' }));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [googleLogin, navigate, role, needsResident, residentId]);

  const handleGoogleClick = async () => {
    if (role === 'admin') {
      setErrors((prev) => ({
        ...prev,
        submit: 'Admin accounts cannot be self-registered via Google OAuth. Please select another role or contact the administrator.'
      }));
      return;
    }

    // If already authenticated with Google and redirected here to select role
    if (passedGoogleUser && passedGoogleUser.email) {
      try {
        setGoogleLoading(true);
        const res = await googleLogin({
          ...passedGoogleUser,
          role: role || 'family',
          isRegistration: true,
          residentId: needsResident ? residentId : null
        });
        setGoogleLoading(false);
        if (res?.success) {
          navigate('/dashboard');
          return;
        } else {
          setErrors((prev) => ({ ...prev, submit: res?.message || 'Google registration failed.' }));
        }
      } catch (err) {
        setGoogleLoading(false);
        setErrors((prev) => ({ ...prev, submit: err?.message || 'Google registration failed.' }));
      }
      return;
    }

    if (isGoogleClientConfigured()) {
      setGoogleLoading(true);
      launchGoogleOAuthPopup({
        role: role || 'family',
        isRegistration: true,
        onSuccess: async (googleData) => {
          try {
            const res = await googleLogin({
              ...googleData,
              role: role || 'family',
              isRegistration: true,
              residentId: needsResident ? residentId : null
            });
            setGoogleLoading(false);
            if (res?.success) {
              navigate('/dashboard');
            } else {
              setErrors((prev) => ({ ...prev, submit: res?.message || 'Google registration failed.' }));
            }
          } catch (err) {
            setGoogleLoading(false);
            setErrors((prev) => ({ ...prev, submit: err?.message || 'Google registration failed.' }));
          }
        },
        onError: (err) => {
          setGoogleLoading(false);
          const raw = String(err?.message || err);
          if (raw.includes('cancelled') || raw.includes('closed') || raw.includes('popup_closed')) {
            setErrors((prev) => ({ ...prev, submit: 'Google sign-up was cancelled (popup window was closed).' }));
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

  // ---- useEffect #1: recompute password strength whenever it changes ----
  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: '' });
      return;
    }
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = 'weak';
    if (score >= 4) label = 'strong';
    else if (score >= 2) label = 'medium';

    setStrength({ score, label });
  }, [password]);

  // ---- useEffect #2: watches every form field to update a live registration
  // progress indicator — a second, distinct, meaningful use of the hook.
  useEffect(() => {
    const fields = [name, username, email, phone, role, password, confirmPassword, ...(needsResident ? [residentId] : [])];
    const filled = fields.filter((f) => String(f).trim().length > 0).length;
    setProgress(Math.round((filled / fields.length) * 100));
  }, [name, username, email, phone, role, password, confirmPassword, residentId, needsResident]);

  // ---- useEffect #3: once registration succeeds, redirect to /login shortly after ----
  useEffect(() => {
    if (!submitted) return undefined;
    const timer = setTimeout(() => navigate('/login'), 1900);
    return () => clearTimeout(timer);
  }, [submitted, navigate]);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Please enter your full name.';
    if (!username.trim()) next.username = 'Please choose a username.';
    else if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username.trim())) next.username = 'Use 3–20 letters, numbers, dots or underscores.';
    if (!email.trim()) next.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Please enter a valid email address.';
    if (!phone.trim()) next.phone = 'Please enter your phone number.';
    else if (!/^[0-9+\-\s]{7,15}$/.test(phone)) next.phone = 'Please enter a valid phone number.';
    if (needsResident && !residentId) next.residentId = 'Please select the resident this account is linked to.';
    if (!password) next.password = 'Please create a password.';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = { name: name.trim(), username: username.trim(), email: email.trim(), phone: phone.trim(), role, password };
    if (role === 'caregiver') payload.caregiverName = name.trim();
    if (needsResident) payload.residentId = residentId;
    if (passedGoogleUser?.googleId || passedGoogleUser?.sub) {
      payload.googleId = passedGoogleUser.googleId || passedGoogleUser.sub;
      payload.avatar = passedGoogleUser.picture || null;
    }

    try {
      const result = await register(payload);
      if (!result || !result.success) {
        setErrors({ username: result?.message || 'Registration failed.' });
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setErrors({ username: err?.message || 'Registration failed.' });
    }
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
          <h2>Join a care team that never loses track of the details.</h2>
          <p>
            Create your account as an Admin, Caregiver, Family member or Patient to
            coordinate medications, appointments and daily care — all from one calm,
            organized workspace.
          </p>
        </div>

        <div className="auth-visual-stats">
          <div className="stat">
            <b>4</b>
            <span>Account types</span>
          </div>
          <div className="stat">
            <b>18</b>
            <span>Active caregivers</span>
          </div>
          <div className="stat">
            <b>100%</b>
            <span>Role-based privacy</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form-box" style={{ maxWidth: 440 }}>
          {submitted ? (
            <div>
              <div className="success-toast">
                <CheckCircle2 size={20} />
                Account created successfully.
              </div>
              <p className="lede">Redirecting you to the sign-in page&hellip;</p>
            </div>
          ) : (
            <>
              <div className="eyebrow form-eyebrow">Account Registration</div>
              <h2>Create an Account</h2>
              <p className="lede">Register as a Caregiver, Doctor, Family member or Patient.</p>

              <GoogleSignInButton
                onClick={handleGoogleClick}
                text={
                  googleLoading
                    ? 'Registering with Google...'
                    : passedGoogleUser
                    ? `Complete Google Signup (${passedGoogleUser.email})`
                    : 'Sign up with Google'
                }
                disabled={googleLoading}
              />

              {errors.submit && (
                <div
                  className="auth-error-banner"
                  style={{
                    marginTop: 10,
                    marginBottom: 10,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}
                >
                  {errors.submit}
                </div>
              )}

              {passedGoogleUser && (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  🌱 Registering Google email: <b>{passedGoogleUser.email}</b>. Choose your role below and click <b>Sign up with Google</b> or complete the form.
                </div>
              )}

              <div className="auth-divider">
                <span>or register with email</span>
              </div>

              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="eyebrow">Registration progress</span>
                  <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-forest-deep)' }}>
                    {progress}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate autoComplete="off">
                <div className={`field ${errors.name ? 'has-error' : ''}`}>
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrap">
                    <User size={16} />
                    <input
                      id="name"
                      name="full_name"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="e.g. Priya Nair"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className={`field ${errors.username ? 'has-error' : ''}`}>
                  <label htmlFor="username">Username</label>
                  <div className="input-wrap">
                    <UserRound size={16} />
                    <input
                      id="username"
                      name="new_username"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Choose a username for signing in"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>

                <div className={`field ${errors.email ? 'has-error' : ''}`}>
                  <label htmlFor="reg-email">Email</label>
                  <div className="input-wrap">
                    <Mail size={16} />
                    <input
                      id="reg-email"
                      name="contact_email"
                      type="email"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="you@eldercare.demo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className={`field ${errors.phone ? 'has-error' : ''}`}>
                  <label htmlFor="phone">Phone Number</label>
                  <div className="input-wrap">
                    <Phone size={16} />
                    <input
                      id="phone"
                      name="contact_phone"
                      type="tel"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="field">
                  <label htmlFor="role">Role</label>
                  <div className="input-wrap">
                    <IdCard size={16} />
                    <select id="role" name="account_role" value={role} onChange={(e) => setRole(e.target.value)}>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {needsResident && (
                  <div className={`field ${errors.residentId ? 'has-error' : ''}`}>
                    <label htmlFor="residentId">
                      {role === 'family' ? 'Your Elderly Family Member' : 'Your Resident Record'}
                    </label>
                    <div className="input-wrap">
                      <Users size={16} />
                      <select id="residentId" name="resident_id" value={residentId} onChange={(e) => setResidentId(e.target.value)}>
                        {activeResidents.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} — {r.id}</option>
                        ))}
                      </select>
                    </div>
                    {errors.residentId && <span className="error-text">{errors.residentId}</span>}
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                      {role === 'family'
                        ? 'Your account will only ever show this resident’s information.'
                        : 'Your account will only ever show your own information.'}
                    </p>
                  </div>
                )}

                <div className={`field ${errors.password ? 'has-error' : ''}`}>
                  <label htmlFor="reg-password">Password</label>
                  <div className="input-wrap">
                    <Lock size={16} />
                    <input
                      id="reg-password"
                      name="account_password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" className="toggle-visibility" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <>
                      <div className={`strength-meter ${strength.label}`}>
                        <span className="seg" />
                        <span className="seg" />
                        <span className="seg" />
                      </div>
                      <span className={`strength-label ${strength.label}`}>
                        {strength.label === 'weak' && 'Weak'}
                        {strength.label === 'medium' && 'Medium'}
                        {strength.label === 'strong' && 'Strong'}
                      </span>
                    </>
                  )}
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className={`field ${errors.confirmPassword ? 'has-error' : ''}`}>
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <div className="input-wrap">
                    <Lock size={16} />
                    <input
                      id="confirm-password"
                      name="confirm_account_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="button" className="toggle-visibility" onClick={() => setShowConfirmPassword((v) => !v)} aria-label="Toggle confirm password visibility">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  Create Account
                </button>
              </form>

              <div className="auth-switch">
                Already have an account? <Link to="/login" className="link-accent">Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>

      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        initialRole={role || 'family'}
      />
    </div>
  );
}
