/**
 * PARKWISE - Role-based Authorization Middleware
 * Enforces role access control on protected routes.
 */

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user context found.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] privileges.`
      });
    }

    next();
  };
}

export default authorize;
