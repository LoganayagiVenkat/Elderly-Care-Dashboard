// ============================================================================
// ElderCare Google Authentication Service (Google Identity Services / OAuth 2.0)
// Supports Real-Time Google Account Authentication via Google GIS & OAuth Popup
// ============================================================================

export const GOOGLE_CLIENT_ID_KEY = 'eldercare_google_client_id';

/**
 * Retrieves the active Google Client ID from localStorage or Vite environment variable.
 */
export function getGoogleClientId() {
  const custom = typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_CLIENT_ID_KEY) : null;
  if (custom && custom.trim()) {
    return custom.trim();
  }
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envId && envId.trim()) {
    return envId.trim();
  }
  return '';
}

/**
 * Saves a custom Google Client ID in localStorage for instant activation.
 */
export function setGoogleClientId(clientId) {
  if (typeof window === 'undefined') return;
  if (clientId && clientId.trim()) {
    localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
  } else {
    localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
  }
}

/**
 * Checks whether a Google OAuth Client ID has been configured.
 */
export function isGoogleClientConfigured() {
  return Boolean(getGoogleClientId());
}

/**
 * Decodes a Google JWT Credential string returned by Google One Tap or Google Sign-In Button.
 */
export function parseGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('[Google Auth] Failed to parse JWT credential:', err);
    return null;
  }
}

/**
 * Ensures Google Identity Services (GSI) script is loaded and ready.
 */
export function loadGoogleScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.google?.accounts) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Triggers Google OAuth 2.0 Account Picker Popup in real time.
 * Opens Google's official account selector dialog.
 */
export async function launchGoogleOAuthPopup({
  role = 'family',
  isRegistration = false,
  onSuccess,
  onError
}) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    onError?.(new Error('GOOGLE_CLIENT_ID_NOT_CONFIGURED'));
    return;
  }

  const loaded = await loadGoogleScript();
  if (!loaded || !window.google?.accounts?.oauth2) {
    onError?.(new Error('Google Identity Services SDK could not be initialized. Please check network connection.'));
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          console.warn('[Google OAuth] Token error:', tokenResponse);
          if (tokenResponse.error === 'popup_closed_by_user') {
            onError?.(new Error('Google sign-in was cancelled (popup window closed).'));
          } else {
            onError?.(new Error(tokenResponse.error_description || tokenResponse.error || 'Google sign-in failed.'));
          }
          return;
        }

        if (!tokenResponse.access_token) {
          onError?.(new Error('No access token received from Google.'));
          return;
        }

        try {
          // Fetch the real-time Google User Profile from Google's official userinfo endpoint
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
              Accept: 'application/json'
            }
          });

          if (!userInfoRes.ok) {
            throw new Error(`Google profile fetch failed (${userInfoRes.status})`);
          }

          const profile = await userInfoRes.json();
          onSuccess?.({
            accessToken: tokenResponse.access_token,
            email: profile.email,
            name: profile.name || profile.given_name || 'Google User',
            picture: profile.picture || null,
            sub: profile.sub,
            role: role || 'family',
            isRegistration,
            isRealGoogleAuth: true
          });
        } catch (fetchErr) {
          console.error('[Google OAuth] Userinfo fetch error:', fetchErr);
          onError?.(fetchErr);
        }
      },
      error_callback: (error) => {
        if (error?.type === 'popup_closed') {
          onError?.(new Error('Google sign-in was cancelled (popup window closed).'));
        } else {
          onError?.(new Error(error?.message || 'Google OAuth popup error.'));
        }
      }
    });

    // Request access token with account picker forced
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (err) {
    console.error('[Google OAuth] Popup init error:', err);
    onError?.(err);
  }
}
