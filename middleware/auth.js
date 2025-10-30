import jwt from 'jsonwebtoken';

/**
 * General token verification middleware.
 * Verifies JWT from Authorization header and attaches user info to req.user.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
export const verifyToken = authenticateToken;

// ✅ Re-introduce aliases for compatibility
export const authenticate = authenticateToken;
export const authenticateUser = authenticateToken;

// Role-based access control
export const isOwner = (req, res, next) => {
  if (req.user?.role?.toLowerCase() === 'owner') return next();
  return res.status(403).json({ message: 'Access denied: Owner only' });
};

export const isAgent = (req, res, next) => {
  if (req.user?.role?.toLowerCase() === 'agent') return next();
  return res.status(403).json({ message: 'Access denied: Agent only' });
};

export const isTenant = (req, res, next) => {
  if (req.user?.role?.toLowerCase() === 'tenant') return next();
  return res.status(403).json({ message: 'Access denied: Tenant only' });
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role?.toLowerCase() === 'admin') return next();
  return res.status(403).json({ message: 'Access denied: Admin only' });
};

export const isAgentOrAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role === 'agent' || role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied: Agent or Admin only' });
};

export const authorizeAdmin = isAdmin;

/**
 * Flexible custom role checker.
 * Usage: authorizeRoles('owner', 'agent') to allow either.
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const role = req.user?.role?.toLowerCase();
    if (roles.map(r => r.toLowerCase()).includes(role)) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied: Unauthorized role' });
  };
};

// ✅ Default export for backward compatibility
export default authenticateToken;
