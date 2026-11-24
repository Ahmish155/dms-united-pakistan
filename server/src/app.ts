import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import { authRoutes } from './modules/auth/auth.routes';
import { workspaceRoutes } from './modules/workspaces/workspace.routes';
import { unitRoutes } from './modules/units/unit.routes';
import { personRoutes } from './modules/people/person.routes';
import { meetingRoutes } from './modules/meetings/meeting.routes';
import { dmmRoutes } from './modules/dmm/dmm.routes';
import { rmmRoutes } from './modules/rmm/rmm.routes';
import { dfRoutes } from './modules/df/df.routes';
import { gmRoutes } from './modules/gm/gm.routes';
import { reportRoutes } from './modules/reports/report.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { activityRoutes } from './modules/activity-engine/activity.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Trust reverse proxy (Vercel / Cloudflare edge)
app.set('trust proxy', 1);

// Ensure MongoDB is connected on each incoming serverless request
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true
  })
);

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/people', personRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/dmm', dmmRoutes);
app.use('/api/v1/rmm', rmmRoutes);
app.use('/api/v1/df', dfRoutes);
app.use('/api/v1/gm', gmRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/ai', aiRoutes);

// Error Handling
app.use(errorHandler);

export default app;
