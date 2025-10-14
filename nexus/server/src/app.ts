import express, { Application } from 'express';
import helmet from 'helmet';
import { logger } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import authRouter from './controllers/auth.controller';

// TODO: Import routers when implemented
// import realmRouter from './controllers/realm.controller';
// import memberRouter from './controllers/member.controller';
// import bridgeRouter from './controllers/bridge.controller';
// import policyRouter from './controllers/policy.controller';
// import capabilityRouter from './controllers/capability.controller';
// import adminRouter from './controllers/admin.controller';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRouter);

// TODO: Add routes when controllers are implemented
// app.use('/api/realms', realmRouter);
// app.use('/api/members', memberRouter);
// app.use('/api/bridges', bridgeRouter);
// app.use('/api/policies', policyRouter);
// app.use('/api/capabilities', capabilityRouter);
// app.use('/api/admin', adminRouter);

// Error handling
app.use(errorMiddleware);

export { app };
