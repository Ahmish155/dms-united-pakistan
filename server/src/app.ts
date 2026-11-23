import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { workspaceRoutes } from './modules/workspaces/workspace.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

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
  max: 200,
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

// Error Handling
app.use(errorHandler);

export default app;
