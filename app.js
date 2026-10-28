import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { blockOperatorKeys, corsPolicy, noStore, requireJsonBody, securityHeaders } from './middleware/security.js';
import { createRateLimiters } from './middleware/rateLimiters.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { mountClient } from './middleware/clientApp.js';
import { createV1Router } from './routes/index.js';

// Builds the Express app without starting it, so tests can call it directly.
export const createApp = ({ rateLimits } = {}) => {
  const app = express();
  const limiters = createRateLimiters(rateLimits);

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(securityHeaders);
  app.use(corsPolicy);
  // Rate limits and no-store apply to the API only, so loading the website is never counted or uncached.
  app.use(['/api', '/health'], limiters.global, noStore);
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());
  app.use(requireJsonBody);
  app.use(blockOperatorKeys);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1', createV1Router(limiters));

  if (config.serveClient) mountClient(app);

  app.use(notFound);
  app.use(errorHandler);
  return app;
};
