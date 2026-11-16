/**
 * PARKWISE - Environment Configuration & Validation
 * Phase 2.1: Backend Initialization and Architecture
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REQUIRED_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

/**
 * Validates the existence and formats of required environment variables.
 * Throws a descriptive error if any critical configuration is missing.
 */
export function validateEnvironment() {
  const missing = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key] || process.env[key].trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[Config Error] Missing required environment variables: ${missing.join(', ')}.\n` +
      `Please check your backend/.env file. Refer to backend/.env.example for template.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

// Perform validation on module import
validateEnvironment();

export const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parkwise',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d'
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://127.0.0.1:5500'
};
