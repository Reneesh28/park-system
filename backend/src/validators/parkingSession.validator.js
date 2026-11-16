/**
 * PARKWISE - Parking Session Joi Validation Schemas
 * Phase 2.6: QR Parking Sessions
 */

import Joi from 'joi';

export const scanQrSchema = Joi.object({
  qrToken: Joi.string().trim().required().messages({
    'string.empty': 'QR token string is required',
    'any.required': 'QR token string is required'
  }),
  vehicleNumber: Joi.string().trim().max(30).optional().allow('')
});
