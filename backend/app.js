/**
 * PARKWISE - Express Application Setup
 * Phase 2.1: Backend Initialization and Architecture
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { corsOptions } from './src/config/cors.js';
import { apiRateLimiter } from './src/middleware/rateLimiter.js';
import { notFound } from './src/middleware/notFound.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import apiRouter from './src/routes/index.routes.js';

const app = express();

// Security Headers (configured to permit cross-origin API consumption)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// Global Rate Limiting for API routes
app.use('/api', apiRateLimiter);

// Register Core API Routes
app.use('/api/v1', apiRouter);

// 404 Catch-All Middleware for undefined endpoints
app.use(notFound);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
