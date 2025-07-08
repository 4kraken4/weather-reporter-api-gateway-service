import { Router } from 'express';

import Config from '../../../config/Config.js';

import healthRoutes from './healthRoutes.js';
import weatherRoutes from './weatherRoutes.js';

const router = Router();

// Basic health check endpoint
router.get('/', (_, res) => {
  res.json({
    message: 'Weather Reporter API Gateway is running',
    application: Config.getInstance().app.name,
    service: Config.getInstance().service.name,
    version: Config.getInstance().service.version,
    date: new Date().toUTCString()
  });
});

router.get('/health', (_, res) => {
  res.json({
    application: Config.getInstance().app.name,
    service: Config.getInstance().service.name,
    version: Config.getInstance().service.version,
    date: new Date().toUTCString()
  });
});

router.use('/health', healthRoutes);
router.use('/weather', weatherRoutes);
router.use('*', (_, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export default router;
