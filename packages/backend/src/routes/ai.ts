import { Router, Request, Response } from 'express';
import {
  getProviderInfo,
  getDefaultProvider,
} from '../services/ai/interpreter.js';

const router = Router();

/**
 * GET /api/ai/providers
 * List available AI providers and their status
 */
router.get('/providers', (req: Request, res: Response) => {
  const providers = getProviderInfo();
  const defaultProvider = getDefaultProvider();

  res.json({
    success: true,
    providers,
    defaultProvider,
  });
});

export default router;
