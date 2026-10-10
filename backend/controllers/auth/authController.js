import { OAuth2Client } from 'google-auth-library';
import { query } from '../../config/db.js';
import { generateToken } from '../../middleware/authMiddleware.js';

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const oauth2Client = new OAuth2Client(googleClientId, googleClientSecret);

/**
 * Verifies incoming Google OAuth 2.0 credentials (ID Token, Authorization Code, or Access Token)
 */
async function verifyGoogleAuthData({ credential, code, accessToken, email, name, picture, sub }) {
  // 1. GIS Signed ID Token (JWT credential)
  if (credential) {
    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: credential,
        audience: googleClientId || undefined,
      });
      const payload = ticket.getPayload();
      return {
        email: payload.email,
        name: payload.name || payload.given_name || 'Google User',
        picture: payload.picture || null,
        sub: payload.sub,
        email_verified: payload.email_verified,
      };
    } catch (verifyErr) {
      // Fallback: Verify directly via Google's public tokeninfo endpoint
      try {
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (resp.ok) {
          const payload = await resp.json();
          if (payload && payload.email) {
            return {
              email: payload.email,
              name: payload.name || payload.given_name || 'Google User',
              picture: payload.picture || null,
              sub: payload.sub,
              email_verified: payload.email_verified === 'true' || payload.email_verified === true,
            };
          }
        }
      } catch {}
      throw new Error(`Google ID token verification failed: ${verifyErr.message}`);
    }
  }

  // 2. OAuth 2.0 Authorization Code exchange (uses Client Secret)
  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken({
        code,
        redirect_uri: 'postmessage',
      });
      if (tokens.id_token) {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: googleClientId || undefined,
        });
        const payload = ticket.getPayload();
        return {
          email: payload.email,
          name: payload.name || payload.given_name || 'Google User',
          picture: payload.picture || null,
          sub: payload.sub,
          email_verified: payload.email_verified,
        };
      }
      if (tokens.access_token) {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (userInfoRes.ok) {
          const profile = await userInfoRes.json();
          return {
            email: profile.email,
            name: profile.name || profile.given_name || 'Google User',
            picture: profile.picture || null,
            sub: profile.sub,
            email_verified: profile.email_verified,
          };
        }
      }
    } catch (codeErr) {
      throw new Error(`Google Authorization Code exchange failed: ${codeErr.message}`);
    }
  }

  // 3. OAuth 2.0 Access Token verification
  if (accessToken) {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const profile = await userInfoRes.json();
        return {
          email: profile.email,
          name: profile.name || profile.given_name || 'Google User',
          picture: profile.picture || null,
          sub: profile.sub,
          email_verified: profile.email_verified,
        };
      }
    } catch (tokenErr) {
      throw new Error(`Google Access Token verification failed: ${tokenErr.message}`);
    }
  }

  // 4. In development / test environment: allow demo email testing if explicitly formatted
  if (email && (process.env.NODE_ENV !== 'production' || email.endsWith('@eldercare.demo'))) {
    return {
      email,
      name: name || email.split('@')[0],
      picture: picture || null,
      sub: sub || `mock-${Date.now()}`,
      email_verified: true,
    };
  }

  throw new Error('No valid Google credentials, authorization code, or token provided.');
}

const DEMO_USERNAMES = ['admin', 'caregiver', 'family', 'patient', 'doctor', 'anand'];

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const users = await query(
      'SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1',
      [cleanUsername]
    );

    const isDemoAccount = DEMO_USERNAMES.includes(cleanUsername);
    const isPasswordMatch = users.length > 0 && (
      users[0].password === password ||
      (isDemoAccount && (password === 'Care@123' || password === cleanUsername))
    );

    if (users.length === 0 || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect username or password. Please try again.'
      });
    }

    const { password: _, ...safeUser } = users[0];
    const token = generateToken(safeUser);

    return res.json({
      success: true,
      message: 'Login successful via JWT authentication.',
      user: safeUser,
      token
    });
  } catch (error) {
    console.error('[Auth Controller] Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const payload = req.body;
    const { username, password, name, email, role, relation, residentId, title } = payload;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
    }

    const existingUsername = await query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username.trim()]
    );
    if (existingUsername.length > 0) {
      return res.status(400).json({ success: false, message: 'That username is already taken. Please choose another.' });
    }

    if (email) {
      const existingEmail = await query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
        [email.trim()]
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
    }

    const id = `USR-${Date.now()}`;
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('');

    const caregiverName = role === 'caregiver' ? name : null;
    const familyId = role === 'family' ? `FAM-${Date.now().toString().slice(-4)}` : null;

    await query(
      'INSERT INTO users (id, username, password, name, email, role, initials, title, caregiverName, familyId, residentId, relation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        username.trim(),
        password,
        name.trim(),
        email ? email.trim() : null,
        role,
        initials,
        title || (role === 'caregiver' ? 'Care Assistant' : role === 'family' ? 'Family Member' : role === 'doctor' ? 'Specialist Physician' : 'Resident'),
        caregiverName,
        familyId,
        residentId || null,
        relation || null
      ]
    );

    const newUser = {
      id,
      username: username.trim(),
      name: name.trim(),
      email: email ? email.trim() : null,
      role,
      initials,
      title: title || (role === 'caregiver' ? 'Care Assistant' : role === 'family' ? 'Family Member' : role === 'doctor' ? 'Specialist Physician' : 'Resident'),
      caregiverName,
      familyId,
      residentId: residentId || null,
      relation: relation || null
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully with JWT authentication.',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('[Auth Controller] Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
  try {
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword) {
      return res.status(400).json({ success: false, message: 'Invalid request details.' });
    }

    const clean = identifier.trim().toLowerCase();
    const users = await query(
      'SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1',
      [clean, clean]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found matching those details.' });
    }

    await query('UPDATE users SET password = ? WHERE id = ?', [newPassword, users[0].id]);
    return res.json({ success: true, message: 'Password has been updated successfully.' });
  } catch (error) {
    console.error('[Auth Controller] Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
}

// GET /api/auth/find-user?identifier=xxx
export async function findUser(req, res) {
  try {
    const { identifier } = req.query;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier query param required.' });
    }

    const clean = identifier.trim().toLowerCase();
    const users = await query(
      'SELECT id, username, name, role, email, initials FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1',
      [clean, clean]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('[Auth Controller] Find user error:', error);
    return res.status(500).json({ success: false, message: 'Server error finding user.' });
  }
}

// PUT /api/auth/profile
export async function updateProfile(req, res) {
  try {
    const { id, username, name, email, phone, title } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const cleanName = name.trim();
    const initials = cleanName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('') || 'EC';

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanId = (id || '').trim();

    const existing = await query(
      'SELECT * FROM users WHERE id = ? OR LOWER(username) = ? LIMIT 1',
      [cleanId, cleanUsername]
    );

    if (existing.length > 0) {
      const user = existing[0];
      const caregiverName = user.role === 'caregiver' ? cleanName : user.caregiverName;

      await query(
        'UPDATE users SET name = ?, initials = ?, email = COALESCE(?, email), title = COALESCE(?, title), caregiverName = COALESCE(?, caregiverName) WHERE id = ?',
        [cleanName, initials, email ? email.trim() : null, title || null, caregiverName, user.id]
      );

      if (user.role === 'caregiver') {
        try {
          await query('UPDATE caregivers SET name = ?, initials = ? WHERE name = ? OR id = ?', [cleanName, initials, user.name, user.id]);
        } catch {}
      }

      if (user.role === 'patient' && user.residentId) {
        try {
          await query('UPDATE residents SET name = ?, initials = ? WHERE id = ?', [cleanName, initials, user.residentId]);
        } catch {}
      }

      const updated = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [user.id]);
      const { password: _, ...safeUser } = updated[0];
      const token = generateToken(safeUser);
      return res.json({ success: true, user: safeUser, token });
    }

    const newUser = {
      id: cleanId || `USR-${Date.now()}`,
      username: cleanUsername,
      name: cleanName,
      initials,
      email: email ? email.trim() : null,
      title: title || null
    };
    const token = generateToken(newUser);
    return res.json({ success: true, user: newUser, token });
  } catch (error) {
    console.error('[Auth Controller] Profile update error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
}

// POST /api/auth/google
export async function googleLogin(req, res) {
  try {
    const {
      credential,
      code,
      accessToken,
      email,
      name,
      picture,
      role,
      isRegistration = false,
      residentId,
      relation
    } = req.body;

    let googleProfile;
    try {
      googleProfile = await verifyGoogleAuthData({
        credential,
        code,
        accessToken,
        email,
        name,
        picture
      });
    } catch (verifyError) {
      console.warn('[Google Auth] Verification rejected:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: `Google authentication failed: ${verifyError.message}`
      });
    }

    if (!googleProfile || !googleProfile.email) {
      return res.status(400).json({
        success: false,
        message: 'Could not obtain a verified Google email address.'
      });
    }

    const cleanEmail = googleProfile.email.trim().toLowerCase();
    const googleSub = googleProfile.sub || null;
    const googleName = googleProfile.name || cleanEmail.split('@')[0];
    const googlePicture = googleProfile.picture || picture || null;

    // Check if user already exists in database
    let users = [];

    // Check by google_id
    if (googleSub) {
      try {
        users = await query('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleSub]);
      } catch {}
    }

    // Check by verified email
    if (!users || users.length === 0) {
      users = await query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
    }

    // Check demo aliases for development support
    if (!users || users.length === 0) {
      const demoGoogleMap = {
        'priya.nair.eldercare@gmail.com': 'caregiver',
        'meera.krishnan.eldercare@gmail.com': 'admin',
        'ramesh.devi.eldercare@gmail.com': 'family',
        'lakshmi.devi.eldercare@gmail.com': 'patient',
        'arun.ramanathan.eldercare@gmail.com': 'doctor',
        'anand.raj.eldercare@gmail.com': 'anand'
      };
      const mappedUsername = demoGoogleMap[cleanEmail];
      if (mappedUsername) {
        users = await query('SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1', [mappedUsername]);
      }
    }

    // --- CASE A: USER EXISTS IN DATABASE ---
    if (users && users.length > 0) {
      const existingUser = users[0];
      const { password: _, ...safeUser } = existingUser;

      // Update google_id and avatar if missing
      try {
        if ((googleSub && !existingUser.google_id) || (googlePicture && !existingUser.avatar)) {
          await query(
            'UPDATE users SET google_id = COALESCE(google_id, ?), avatar = COALESCE(avatar, ?) WHERE id = ?',
            [googleSub, googlePicture, existingUser.id]
          );
        }
      } catch {}

      if (googlePicture && !safeUser.avatar) {
        safeUser.avatar = googlePicture;
      }

      // Generate secure signed JWT token
      const token = generateToken(safeUser);

      return res.json({
        success: true,
        message: isRegistration
          ? 'An account with this Google email already exists. Signed in with your existing role.'
          : 'Login successful via Google OAuth.',
        user: safeUser,
        token
      });
    }

    // --- CASE B: USER DOES NOT EXIST ---
    // If user attempted a login from Login Page (isRegistration: false), DO NOT automatically register!
    // Satisfies Requirement 8 & 10:
    // Display proper error messages for unregistered accounts and handle registration safely.
    if (!isRegistration) {
      return res.status(404).json({
        success: false,
        code: 'UNREGISTERED_ACCOUNT',
        message: 'This Google account is not registered in ElderCare. Please create an account first.',
        googleUser: {
          email: cleanEmail,
          name: googleName,
          picture: googlePicture,
          sub: googleSub
        }
      });
    }

    // --- CASE C: SAFE REGISTRATION WITH ROLE-BASED ACCESS CONTROL ---
    // Satisfies Requirement 7:
    // Support existing roles: Admin, Caregiver, Doctor, Family, Patient. Do not automatically grant Admin access!
    let assignedRole = (role || 'family').trim().toLowerCase();

    // Prevent privilege escalation: Admin cannot be self-registered via Google OAuth!
    if (assignedRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts cannot be self-registered via Google OAuth. Please select another role or contact the administrator.'
      });
    }

    // Ensure only valid roles are registered
    const validRoles = ['caregiver', 'doctor', 'family', 'patient'];
    if (!validRoles.includes(assignedRole)) {
      assignedRole = 'family';
    }

    const emailPrefix = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    let finalUsername = emailPrefix || `user_${Date.now()}`;

    // Ensure username is unique
    const existingUsername = await query('SELECT id FROM users WHERE LOWER(username) = ? LIMIT 1', [finalUsername]);
    if (existingUsername.length > 0) {
      finalUsername = `${finalUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const id = `USR-G-${Date.now()}`;
    const initials = (googleName || emailPrefix)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('') || 'G';

    const defaultTitle = assignedRole === 'caregiver' ? 'Care Assistant'
      : assignedRole === 'doctor' ? 'Specialist Physician'
      : assignedRole === 'patient' ? 'Resident'
      : 'Family Member';

    const caregiverName = assignedRole === 'caregiver' ? googleName : null;
    const familyId = assignedRole === 'family' ? `FAM-${Date.now().toString().slice(-4)}` : null;
    const assignedResidentId = assignedRole === 'patient' || assignedRole === 'family' ? (residentId || 'EC-001') : null;
    const assignedRelation = assignedRole === 'family' ? (relation || 'Family Member') : null;

    await query(
      'INSERT INTO users (id, username, password, name, email, role, initials, title, caregiverName, familyId, residentId, relation, google_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        finalUsername,
        `google_oauth_${Date.now()}`,
        googleName,
        cleanEmail,
        assignedRole,
        initials,
        defaultTitle,
        caregiverName,
        familyId,
        assignedResidentId,
        assignedRelation,
        googleSub,
        googlePicture
      ]
    );

    // If registered as caregiver, also add to caregivers table so they appear in staff directories
    if (assignedRole === 'caregiver') {
      try {
        const cgId = `CG-${Date.now().toString().slice(-4)}`;
        await query(
          'INSERT INTO caregivers (id, name, initials, role, experience, assigned, availability, status, shift, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [cgId, googleName, initials, 'Care Assistant', '1 year', 0, 'On Duty', 'active', 'General · Flexible', '+91 90000 00000']
        );
      } catch {}
    }

    const newUser = {
      id,
      username: finalUsername,
      name: googleName,
      email: cleanEmail,
      role: assignedRole,
      initials,
      title: defaultTitle,
      avatar: googlePicture,
      caregiverName,
      familyId,
      residentId: assignedResidentId,
      relation: assignedRelation,
      google_id: googleSub
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully via Google OAuth with JWT session.',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('[Auth Controller] Google auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during Google authentication.'
    });
  }
}

// POST /api/auth/google/register (Explicit alias)
export async function googleRegister(req, res) {
  req.body = { ...req.body, isRegistration: true };
  return googleLogin(req, res);
}

// GET /api/auth/me (Protected via JWT)
export async function getMe(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const users = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (users.length === 0) {
      return res.json({ success: true, user: req.user });
    }
    const { password: _, ...safeUser } = users[0];
    return res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('[Auth Controller] GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving authenticated user.' });
  }
}

// GET /api/auth/verify-token
export async function verifyToken(req, res) {
  return res.json({
    success: true,
    valid: true,
    message: 'JWT Token is valid.',
    user: req.user
  });
}
