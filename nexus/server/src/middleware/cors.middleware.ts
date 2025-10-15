import cors from 'cors';
import { config } from '../config/environment';

export const corsMiddleware = cors({
  origin: config.cors.origin || 'http://localhost:4000',
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204,
});
