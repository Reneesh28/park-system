/**
 * PARKWISE - Parking Lot Joi Validation Schemas
 * Phase 2.5: Parking-Lot Management APIs
 */

import Joi from 'joi';

export const createParkingLotSchema = Joi.object({
  lotName: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Parking lot name is required',
    'string.min': 'Parking lot name must be at least 3 characters',
    'string.max': 'Parking lot name cannot exceed 100 characters',
    'any.required': 'Parking lot name is required'
  }),
  lotCode: Joi.string().trim().uppercase().min(1).max(10).required().messages({
    'string.empty': 'Parking lot code is required',
    'any.required': 'Parking lot code is required'
  }),
  totalCapacity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Total capacity must be a number',
    'number.min': 'Total capacity must be at least 1 space',
    'any.required': 'Total capacity is required'
  }),
  location: Joi.string().trim().max(200).optional().allow(''),
  walkingDistances: Joi.object().pattern(Joi.string(), Joi.number().min(0)).optional().default({}),
  qrToken: Joi.string().trim().min(3).optional()
});

export const updateParkingLotSchema = Joi.object({
  lotName: Joi.string().trim().min(3).max(100).optional(),
  totalCapacity: Joi.number().integer().min(1).optional(),
  location: Joi.string().trim().max(200).optional().allow(''),
  walkingDistances: Joi.object().pattern(Joi.string(), Joi.number().min(0)).optional(),
  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be supplied for update'
});

export const updateStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive status boolean is required',
    'boolean.base': 'isActive must be a boolean (true or false)'
  })
});
