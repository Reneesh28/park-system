/**
 * PARKWISE - Reward Express Routes
 * Phase 2.8: Rewards Management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import * as rewardController from '../controllers/reward.controller.js';

export const rewardRouter = Router();
export const adminRewardRouter = Router();

// Student Reward Endpoints
rewardRouter.use(authenticate);
rewardRouter.get('/summary', rewardController.getSummary);
rewardRouter.get('/history', rewardController.getHistory);
rewardRouter.get('/rules', rewardController.getRules);

// Admin Reward Endpoints
adminRewardRouter.use(authenticate, authorize('admin'));
adminRewardRouter.get('/rules', rewardController.adminGetRules);
adminRewardRouter.post('/rules', rewardController.adminCreateRule);
adminRewardRouter.patch('/rules/:ruleId', rewardController.adminUpdateRule);
adminRewardRouter.delete('/rules/:ruleId', rewardController.adminDeleteRule);

export default rewardRouter;
