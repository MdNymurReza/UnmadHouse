// Role guards. Use after verifyJWT so req.user is populated.

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    next();
  };
}

// Admin or Manager — the "owner panel" tier that runs daily operations & approvals.
export const requireStaff = requireRole('ADMIN', 'MANAGER');

// Admin only.
export const requireAdmin = requireRole('ADMIN');
