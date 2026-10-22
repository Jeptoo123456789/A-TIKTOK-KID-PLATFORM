/**
 * KinVid Full-Stack Server
 * Combines Express API endpoints with Vite dev middleware / production static serving.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiV1Router from './server/api/v1/index.js';
import { errorHandler } from './server/middleware/errorHandler.js';
import { db } from './server/db/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize persistent database engine & run migrations
  console.log('[KinVid Boot] Initializing database and running schema migrations...');
  db.init();

  // Basic security and parsing middleware
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Request logging for API calls
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // Mount API endpoints
  app.use('/api/v1', apiV1Router);
  app.use('/api', apiV1Router); // Alias for convenience

  // Vite integration
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[KinVid Boot] Vite development server middleware mounted.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[KinVid Boot] Serving static production bundle from /dist.');
  }

  // Safe global error handler
  app.use(errorHandler);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  KinVid Full-Stack Platform Active!`);
    console.log(`  Local URL:   http://0.0.0.0:${PORT}`);
    console.log(`  Health API:  http://0.0.0.0:${PORT}/api/v1/health`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('\n[KinVid] Shutting down gracefully...');
    server.close(() => {
      console.log('[KinVid] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer().catch((err) => {
  console.error('[KinVid Fatal] Failed to start server:', err);
  process.exit(1);
});
