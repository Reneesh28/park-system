/**
 * PARKWISE - Not Found Middleware
 * Phase 2.1: Backend Initialization and Architecture
 */

/**
 * Handles requests to undefined routes and returns structured 404 JSON response.
 */
export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    errors: [
      {
        path: req.originalUrl,
        method: req.method,
        reason: 'The requested endpoint does not exist'
      }
    ]
  });
}
