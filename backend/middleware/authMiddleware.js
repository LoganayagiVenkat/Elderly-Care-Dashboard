import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'eldercare_jwt_secure_auth_token_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token for a user
 * @param {Object} user 
 * @returns {string} Signed JWT
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    caregiverName: user.caregiverName || null,
    residentId: user.residentId || null,
    familyId: user.familyId || null
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Express Middleware: Authenticate incoming request via Bearer JWT token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    // If no token is provided, fallback to checking session headers for backwards compatibility
    if (req.headers['x-user-role']) {
      req.user = {
        role: req.headers['x-user-role'],
        caregiverName: req.headers['x-user-caregiver-name'] || null,
        residentId: req.headers['x-user-resident-id'] || null
      };
      return next();
    }
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Missing JSON Web Token (JWT). Please authenticate.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired JSON Web Token (JWT). Please log in again.'
      });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles 
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(', ')}].`
      });
    }
    next();
  };
}
