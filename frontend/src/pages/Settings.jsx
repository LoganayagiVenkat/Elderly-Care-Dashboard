import { useState, useEffect } from 'react';
import {
  User, Bell, Globe, Palette, ShieldCheck, SlidersHorizontal, Sun, Moon, Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { ROLE_LABELS } from '../data/roleConfig.js';
import { COLOR_THEMES } from '../data/themeConfig.js';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'language', label: 'Language & Region', icon: Globe },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'privacy', label: 'Privacy & Security', icon: ShieldCheck },
  { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
];

export default function Settings() {
  const { user, settings, setSettings, updateProfile, resetPassword, t } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [toggles, setToggles] = useState(settings?.toggles || {
    medication: true,
    appointment: true,
    health: true,
    emergency: true,
  });

  // Profile edit state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileStatus, setProfileStatus] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password edit state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  const currentTheme = settings?.theme || 'light';
  const currentColorTheme = settings?.colorTheme || 'emerald';
  const currentLanguage = settings?.language || 'en';

  const handleThemeChange = (newTheme) => {
    setSettings({ theme: newTheme });
  };

  const handleColorThemeChange = (newColorTheme) => {
    setSettings({ colorTheme: newColorTheme });
  };

  const handleLanguageChange = (newLang) => {
    setSettings({ language: newLang });
  };

  const toggle = (key) => {
    setToggles((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setSettings({ toggles: updated });
      return updated;
    });
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!profileName.trim()) {
      setProfileStatus({ type: 'error', message: 'Full name cannot be empty.' });
      return;
    }
    setIsSavingProfile(true);
    setProfileStatus(null);
    try {
      const res = await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
      });
      if (res?.success) {
        setProfileStatus({
          type: 'success',
          message: 'Changes saved successfully! Profile has been updated.'
        });
        setTimeout(() => {
          setProfileStatus((curr) => curr?.type === 'success' ? null : curr);
        }, 4000);
      } else {
        setProfileStatus({ type: 'error', message: res?.message || 'Failed to save changes.' });
      }
    } catch (err) {
      setProfileStatus({ type: 'error', message: err?.message || 'Error saving changes.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 4 characters.' });
      return;
    }
    setIsSavingPassword(true);
    setPasswordStatus(null);
    try {
      const res = await resetPassword(user?.username, newPassword);
      if (res?.success) {
        setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => {
          setPasswordStatus((curr) => curr?.type === 'success' ? null : curr);
        }, 4000);
      } else {
        setPasswordStatus({ type: 'error', message: res?.message || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err?.message || 'Error updating password.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const roleTone = user?.role === 'admin'
    ? 'tone-terracotta'
    : user?.role === 'caregiver'
    ? 'tone-forest'
    : user?.role === 'family'
    ? 'tone-indigo'
    : 'tone-amber';

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t('Settings')}</h1>
          <p className="desc">{t('Manage your profile, notification preferences and account controls.')}</p>
        </div>
      </div>

      <div className="settings-shell">
        <nav className="settings-nav">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={15} /> {t(tab.label)}
            </button>
          ))}
        </nav>

        <div className="panel">
          <div className="panel-body">
            {activeTab === 'profile' && (
              <div>
                <h3 style={{ marginBottom: 18 }}>{t('Profile')}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div className={`identity-tile size-lg ${roleTone}`}>{user?.initials || 'EC'}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{t(ROLE_LABELS[user?.role] || user?.role)}</div>
                    {user?.title && (
                      <div style={{ fontSize: 11.5, color: 'var(--color-forest)', fontWeight: 600, marginTop: 2 }}>
                        {user.title}
                      </div>
                    )}
                  </div>
                </div>

                {profileStatus && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    background: profileStatus.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: profileStatus.type === 'success' ? '#065F46' : '#991B1B',
                    border: `1px solid ${profileStatus.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                  }}>
                    {profileStatus.type === 'success' && <Check size={16} color="#059669" />}
                    <span>{profileStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile}>
                  <div className="field">
                    <label>{t('Full Name')}</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => {
                        setProfileName(e.target.value);
                        if (profileStatus) setProfileStatus(null);
                      }}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => {
                        setProfileEmail(e.target.value);
                        if (profileStatus) setProfileStatus(null);
                      }}
                      placeholder={`${user?.username || 'user'}@eldercare.demo`}
                    />
                  </div>

                  <div className="field">
                    <label>{t('Username')}</label>
                    <input value={user?.username || ''} disabled style={{ opacity: 0.75, cursor: 'not-allowed' }} />
                  </div>

                  <div className="field">
                    <label>{t('Role')}</label>
                    <input value={t(ROLE_LABELS[user?.role] || user?.role)} disabled style={{ opacity: 0.75, cursor: 'not-allowed' }} />
                  </div>

                  {user?.role === 'patient' && user?.residentId && (
                    <div className="field">
                      <label>Assigned Resident ID</label>
                      <input value={user.residentId} disabled style={{ opacity: 0.75, cursor: 'not-allowed' }} />
                    </div>
                  )}

                  {user?.role === 'family' && (
                    <div className="field">
                      <label>Family Details</label>
                      <input
                        value={`${user.relation ? `${user.relation} of ` : ''}${user.residentId || 'EC-001'}`}
                        disabled
                        style={{ opacity: 0.75, cursor: 'not-allowed' }}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? 'Saving...' : t('Save Changes')}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 style={{ marginBottom: 6 }}>{t('Notification Preferences')}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Choose which alerts you want to receive across ElderCare.
                </p>
                <div className="toggle-row">
                  <div><div className="t-name">{t('Medication Reminders')}</div><div className="t-desc">Get notified when a resident&rsquo;s dose is due.</div></div>
                  <label className="switch"><input type="checkbox" checked={toggles.medication} onChange={() => toggle('medication')} /><span className="slider" /></label>
                </div>
                <div className="toggle-row">
                  <div><div className="t-name">{t('Appointment Reminders')}</div><div className="t-desc">Alerts ahead of scheduled doctor visits.</div></div>
                  <label className="switch"><input type="checkbox" checked={toggles.appointment} onChange={() => toggle('appointment')} /><span className="slider" /></label>
                </div>
                <div className="toggle-row">
                  <div><div className="t-name">{t('Health Alerts')}</div><div className="t-desc">Notify when vitals fall outside a normal range.</div></div>
                  <label className="switch"><input type="checkbox" checked={toggles.health} onChange={() => toggle('health')} /><span className="slider" /></label>
                </div>
                <div className="toggle-row">
                  <div><div className="t-name">{t('Emergency Notifications')}</div><div className="t-desc">Always-on alerts for urgent situations.</div></div>
                  <label className="switch"><input type="checkbox" checked={toggles.emergency} onChange={() => toggle('emergency')} /><span className="slider" /></label>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div>
                <h3 style={{ marginBottom: 18 }}>{t('Language & Region')}</h3>
                <div className="field">
                  <label>{t('Preferred Language')}</label>
                  <select
                    value={currentLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Selected language: <strong>{LANGUAGES.find((l) => l.code === currentLanguage)?.label}</strong>. Language changes apply instantly across navigation, headers, and dashboard labels.
                </p>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <div style={{ marginBottom: 26 }}>
                  <h3 style={{ marginBottom: 6 }}>{t('Brand Color Palette')}</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
                    {t('Select your preferred website primary color theme. Changes apply across the entire site instantly.')}
                  </p>
                  <div className="color-theme-grid">
                    {COLOR_THEMES.map((theme) => {
                      const isActive = currentColorTheme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          className={`color-theme-card ${isActive ? 'active' : ''}`}
                          onClick={() => handleColorThemeChange(theme.id)}
                        >
                          <div className="color-swatch-bar">
                            <div className="swatch-seg" style={{ background: theme.primary }} title={`Primary: ${theme.primary}`} />
                            <div className="swatch-seg" style={{ background: theme.deep }} title={`Deep: ${theme.deep}`} />
                            <div className="swatch-seg" style={{ background: theme.accent }} title={`Accent: ${theme.accent}`} />
                            <div className="swatch-seg" style={{ background: theme.soft }} title={`Soft: ${theme.soft}`} />
                          </div>
                          <div className="color-theme-head">
                            <div>
                              <div className="color-theme-name">{t(theme.name)}</div>
                              <div className="color-theme-sub">{t(theme.subtitle)}</div>
                            </div>
                            {isActive && (
                              <span className="color-theme-badge">
                                <Check size={12} /> {t('Active')}
                              </span>
                            )}
                          </div>
                          <div className="color-theme-desc">{t(theme.description)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 20 }}>
                  <h3 style={{ marginBottom: 6 }}>{t('Display Mode')}</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
                    {t('Switch between light daylight styling and high-contrast dark night mode.')}
                  </p>
                  <div className="theme-grid">
                    <div className={`theme-opt ${currentTheme === 'light' ? 'active' : ''}`} onClick={() => handleThemeChange('light')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #FFFFFF 40%, var(--color-forest) 100%)', border: '1px solid var(--border-hairline)' }} />
                      <Sun size={14} style={{ marginRight: 5, verticalAlign: 'text-bottom' }} />{t('Light Mode')}
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{t('Day mode')}</span>
                    </div>
                    <div className={`theme-opt ${currentTheme === 'dark' ? 'active' : ''}`} onClick={() => handleThemeChange('dark')}>
                      <div className="theme-swatch" style={{ background: 'linear-gradient(135deg, #0A1F19 40%, var(--color-forest) 100%)' }} />
                      <Moon size={14} style={{ marginRight: 5, verticalAlign: 'text-bottom' }} />{t('Dark Mode')}
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{t('Night mode')}</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 20 }}>
                  {t('Color and appearance preferences save automatically to your browser and stay synced across sessions.')}
                </p>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <h3 style={{ marginBottom: 18 }}>{t('Privacy & Security')}</h3>
                {passwordStatus && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    background: passwordStatus.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: passwordStatus.type === 'success' ? '#065F46' : '#991B1B',
                    border: `1px solid ${passwordStatus.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                  }}>
                    {passwordStatus.type === 'success' && <Check size={16} color="#059669" />}
                    <span>{passwordStatus.message}</span>
                  </div>
                )}
                <form onSubmit={handleUpdatePassword}>
                  <div className="field">
                    <label>{t('Current Password')}</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>{t('New Password')}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter a new password"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isSavingPassword}>
                    {isSavingPassword ? 'Updating...' : t('Update Password')}
                  </button>
                </form>
                <div style={{ marginTop: 26, borderTop: '1px solid var(--border-hairline)', paddingTop: 18 }}>
                  <div className="toggle-row" style={{ borderBottom: 'none' }}>
                    <div><div className="t-name">{t('Two-Factor Authentication')}</div><div className="t-desc">Add an extra layer of protection to your account.</div></div>
                    <label className="switch"><input type="checkbox" defaultChecked /><span className="slider" /></label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h3 style={{ marginBottom: 18 }}>{t('Preferences')}</h3>
                <div className="toggle-row">
                  <div><div className="t-name">Compact Sidebar by Default</div><div className="t-desc">Start each session with the sidebar collapsed.</div></div>
                  <label className="switch"><input type="checkbox" /><span className="slider" /></label>
                </div>
                <div className="toggle-row">
                  <div><div className="t-name">24-Hour Time Format</div><div className="t-desc">Display times using a 24-hour clock.</div></div>
                  <label className="switch"><input type="checkbox" /><span className="slider" /></label>
                </div>
                <div className="toggle-row" style={{ borderBottom: 'none' }}>
                  <div><div className="t-name">Weekly Summary Email</div><div className="t-desc">Receive a weekly digest of care operations.</div></div>
                  <label className="switch"><input type="checkbox" defaultChecked /><span className="slider" /></label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
