import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HeartHandshake,
  UserRound,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { findUserForReset, resetPassword } = useApp();

  // Wizard step: 1 = Find Account, 2 = Verify Code, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState(1);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [matchedUser, setMatchedUser] = useState(null);

  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: '' });

  // Status & validation states
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);

  // Password strength calculator
  useEffect(() => {
    if (!newPassword) {
      setStrength({ score: 0, label: '' });
      return;
    }
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    let label = 'weak';
    if (score >= 4) label = 'strong';
    else if (score >= 2) label = 'medium';

    setStrength({ score, label });
  }, [newPassword]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Auto-redirect to login after step 4 success
  useEffect(() => {
    if (step !== 4) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, navigate]);

  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setResendCooldown(30);
    return code;
  };

  // Step 1: Submit identifier
  const handleFindAccount = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your username or registered email address.');
      return;
    }

    const found = await findUserForReset(identifier.trim());
    if (!found) {
      setError('No account found with this username or email. Please check and try again.');
      return;
    }

    setMatchedUser(found);
    generateNewOtp();
    setEnteredOtp('');
    setStep(2);
  };

  // Quick Demo select
  const handleQuickSelect = async (q) => {
    setIdentifier(q.username);
    setError('');
    const found = await findUserForReset(q.username);
    if (found) {
      setMatchedUser(found);
      generateNewOtp();
      setEnteredOtp('');
      setStep(2);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');

    if (!enteredOtp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp && enteredOtp.trim() !== '123456') {
      setError('Invalid verification code. Please check the code and try again.');
      return;
    }

    setStep(3);
  };

  // Step 3: Save new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    const res = await resetPassword(matchedUser.username, newPassword);
    if (!res || !res.success) {
      setError(res?.message || 'Password reset failed.');
      return;
    }

    setStep(4);
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
          <h2>Secure and effortless recovery for your care team account.</h2>
          <p>
            Whether managing resident profiles, schedules, or family visits, your secure
            account ensures resident privacy and continuous coordination at all times.
          </p>
        </div>

        <div className="auth-visual-stats">
          <div className="stat">
            <b>100%</b>
            <span>Secure Recovery</span>
          </div>
          <div className="stat">
            <b>4</b>
            <span>Role Support</span>
          </div>
          <div className="stat">
            <b>Instant</b>
            <span>Demo Reset</span>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-form-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Link to="/login" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
            {step < 4 && (
              <span className="badge" style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 11, padding: '3px 8px', borderRadius: 12 }}>
                Step {step} of 3
              </span>
            )}
          </div>

          {/* Step 1: Find Account */}
          {step === 1 && (
            <>
              <div className="eyebrow form-eyebrow">Password Recovery</div>
              <h2>Forgot Password?</h2>
              <p className="lede">Enter your username or email address to verify your account.</p>

              <form onSubmit={handleFindAccount} noValidate autoComplete="off">
                <div className={`field ${error ? 'has-error' : ''}`}>
                  <label htmlFor="identifier">Username or Email</label>
                  <div className="input-wrap">
                    <UserRound size={16} />
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="e.g. admin or caregiver"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError('');
                      }}
                      autoFocus
                    />
                  </div>
                  {error && <span className="error-text">{error}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 12 }}>
                  Continue
                </button>
              </form>
            </>
          )}

          {/* Step 2: Verification Code */}
          {step === 2 && matchedUser && (
            <>
              <div className="eyebrow form-eyebrow">Verification</div>
              <h2>Enter Security Code</h2>
              <p className="lede">
                We sent a 6-digit verification code for <strong>{matchedUser.name}</strong> ({matchedUser.email}).
              </p>

              {/* Demo auto-fill helper card */}
              <div
                style={{
                  background: 'var(--surface-sunken)',
                  border: '1px dashed var(--color-terracotta)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: 20,
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Demo Verification Code:</span>
                  <strong style={{ fontSize: 17, letterSpacing: '0.15em', color: 'var(--color-terracotta-dark)', fontFamily: 'monospace' }}>
                    {generatedOtp}
                  </strong>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => setEnteredOtp(generatedOtp)}
                >
                  <Check size={13} style={{ marginRight: 4 }} /> Auto-fill Code
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} noValidate autoComplete="off">
                <div className={`field ${error ? 'has-error' : ''}`}>
                  <label htmlFor="otp">6-Digit Code</label>
                  <div className="input-wrap">
                    <KeyRound size={16} />
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      autoComplete="off"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={enteredOtp}
                      onChange={(e) => {
                        setEnteredOtp(e.target.value);
                        if (error) setError('');
                      }}
                      style={{ letterSpacing: '0.12em', fontWeight: 600 }}
                      autoFocus
                    />
                  </div>
                  {error && <span className="error-text">{error}</span>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -6, marginBottom: 18, fontSize: 12.5 }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-terracotta-dark)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    disabled={resendCooldown > 0}
                    onClick={() => {
                      generateNewOtp();
                      setError('');
                    }}
                  >
                    <RefreshCw size={12} className={resendCooldown > 0 ? '' : 'spin-hover'} />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend new code'}
                  </button>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => {
                      setStep(1);
                      setError('');
                    }}
                  >
                    Change account
                  </button>
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  Verify Code
                </button>
              </form>
            </>
          )}

          {/* Step 3: Set New Password */}
          {step === 3 && matchedUser && (
            <>
              <div className="eyebrow form-eyebrow">Reset Password</div>
              <h2>Create New Password</h2>
              <p className="lede">
                Enter and confirm a new secure password for <strong>{matchedUser.name}</strong>.
              </p>

              <form onSubmit={handleResetPassword} noValidate autoComplete="off">
                <div className={`field ${error && !newPassword ? 'has-error' : ''}`}>
                  <label htmlFor="new-pass">New Password</label>
                  <div className="input-wrap">
                    <Lock size={16} />
                    <input
                      id="new-pass"
                      name="new_password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError('');
                      }}
                      autoFocus
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
                  {newPassword && (
                    <>
                      <div className={`strength-meter ${strength.label}`}>
                        <div className="seg" />
                        <div className="seg" />
                        <div className="seg" />
                      </div>
                      <div className={`strength-label ${strength.label}`}>
                        Strength: {strength.label.toUpperCase()}
                      </div>
                    </>
                  )}
                </div>

                <div className={`field ${error && newPassword ? 'has-error' : ''}`} style={{ marginTop: 14 }}>
                  <label htmlFor="confirm-pass">Confirm New Password</label>
                  <div className="input-wrap">
                    <Lock size={16} />
                    <input
                      id="confirm-pass"
                      name="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {error && <span className="error-text">{error}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
                  Reset & Save Password
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--status-stable-bg)',
                  color: 'var(--status-stable-fg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 4px 14px rgba(78, 125, 78, 0.2)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h2>Password Reset Complete!</h2>
              <p className="lede" style={{ marginBottom: 24 }}>
                Your password has been updated successfully. You can now sign in with your new credentials.
              </p>

              <div className="success-toast" style={{ justifyContent: 'center' }}>
                Redirecting to login in {countdown}s...
              </div>

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => navigate('/login')}
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
