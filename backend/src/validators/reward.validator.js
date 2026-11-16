/**
 * PARKWISE - Reward Management Joi Validation Schemas
 * Phase 2.8: Rewards Management
 */

import Joi from 'joi';

export const createRewardRuleSchema = Joi.object({
  ruleName: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Rule name is required',
    'string.min': 'Rule name must be at least 3 characters',
    'any.required': 'Rule name is required'
  }),
  minimumAvailabilityPercentage: Joi.number().min(0).max(100).required().messages({
    'number.base': 'Minimum availability must be a percentage between 0 and 100',
    'any.required': 'Minimum availability percentage is required'
  }),
  maximumAvailabilityPercentage: Joi.number().min(0).max(100).required().messages({
    'number.base': 'Maximum availability must be a percentage between 0 and 100',
    'any.required': 'Maximum availability percentage is required'
  }),
  points: Joi.number().integer().min(0).required().messages({
    'number.base': 'Points must be an integer >= 0',
    'any.required': 'Reward points value is required'
  }),
  isActive: Joi.boolean().optional().default(true),
  description: Joi.string().trim().max(250).optional().allow('')
});

export const updateRewardRuleSchema = Joi.object({
  ruleName: Joi.string().trim().min(3).max(100).optional(),
  minimumAvailabilityPercentage: Joi.number().min(0).max(100).optional(),
  maximumAvailabilityPercentage: Joi.number().min(0).max(100).optional(),
  points: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  description: Joi.string().trim().max(250).optional().allow('')
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});
