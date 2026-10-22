/**
 * KinVid API Router V1
 * Mounts all modular API endpoints.
 */

import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import categoriesRouter from './categories.js';
import videosRouter from './videos.js';
import profilesRouter from './profiles.js';
import adminRouter from './admin.js';

const apiV1Router = Router();

apiV1Router.use('/health', healthRouter);
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/categories', categoriesRouter);
apiV1Router.use('/videos', videosRouter);
apiV1Router.use('/profiles', profilesRouter);
apiV1Router.use('/admin', adminRouter);

export default apiV1Router;
