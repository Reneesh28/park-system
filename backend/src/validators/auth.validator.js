/**
 * PARKWISE - Authentication Request Validators
 * Phase 2.3: User Registration and Login API Development
 */

import Joi from 'joi';

/**
 * Password Policy:
 * - Minimum 8 characters, maximum 72 (bcrypt limit)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

/**
 * Registration request body schema.
 */
export const registerSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Full name must be text',
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters',
      'any.required': 'Full name is required'
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.base': 'Email must be text',
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  studentId: Joi.string()
    .trim()
    .uppercase()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': 'Student ID must be text',
      'string.empty': 'Student ID is required',
      'string.min': 'Student ID must be at least 3 characters long',
      'string.max': 'Student ID cannot exceed 30 characters',
      'any.required': 'Student ID is required'
    }),

  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.base': 'Password must be text',
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 72 characters',
      'string.pattern.base': 'Password must include at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Confirm password is required',
      'any.required': 'Confirm password is required'
    }),

  vehicleNumber: Joi.string()
    .trim()
    .uppercase()
    .min(3)
    .max(25)
    .pattern(/^[A-Z0-9\s-]+$/)
    .required()
    .messages({
      'string.base': 'Vehicle number must be text',
      'string.empty': 'Vehicle number is required',
      'string.min': 'Vehicle number must be at least 3 characters long',
      'string.max': 'Vehicle number cannot exceed 25 characters',
      'string.pattern.base': 'Vehicle number must contain only alphanumeric characters, spaces, or hyphens',
      'any.required': 'Vehicle number is required'
    }),

  vehicleType: Joi.string()
    .valid('two-wheeler', 'bicycle', 'other')
    .optional()
    .default('two-wheeler')
    .messages({
      'any.only': 'Vehicle type must be one of [two-wheeler, bicycle, other]'
    }),

  // Explicitly disallow any privilege elevation attempts
  role: Joi.any().forbidden().messages({
    'any.unknown': 'Role selection is not permitted through public registration'
  }),
  isAdmin: Joi.any().forbidden().messages({
    'any.unknown': 'Admin privileges cannot be self-assigned'
  }),
  rewardPoints: Joi.any().forbidden().messages({
    'any.unknown': 'Initial reward points cannot be self-assigned'
  }),
  isActive: Joi.any().forbidden().messages({
    'any.unknown': 'Account active state cannot be self-assigned'
  })
}).unknown(false).messages({
  'object.unknown': '{#label} is not an accepted registration field'
});

/**
 * Login request body schema.
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.base': 'Email must be text',
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.base': 'Password must be text',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
}).unknown(false).messages({
  'object.unknown': '{#label} is not an accepted login field'
});

/**
 * Reusable Express middleware generator for Joi validation schemas.
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false
    });

    if (error) {
      const formattedErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
      });
    }

    // Assign sanitized & normalized values to req.body
    req.body = value;
    next();
  };
}
