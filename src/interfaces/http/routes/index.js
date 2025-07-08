import { Router } from 'express';

import Config from '../../../config/Config.js';
import authenticate from '../../../infrastructure/middleware/authenticate.js';

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import weatherRoutes from './weatherRoutes.js';

const router = Router();

router.get('/health', (_, res) => {
  res.json({
    application: Config.getInstance().app.name,
    service: Config.getInstance().service.name,
    version: Config.getInstance().service.version,
    date: new Date().toUTCString()
  });
});

router.use('/auth', authRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/weather', weatherRoutes);
router.use('*', (_, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export default router;
