// src/modules/auth/auth.routes.js
// Express router for authentication endpoints.

import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
  registerLimiter,
  loginLimiter,
  refreshLimiter,
} from '../../middleware/rate-limiters.js';
import * as authValidation from './auth.validation.js';
import * as authController from './auth.controller.js';

const router = Router();

// Public auth endpoints
router.post(
  '/register',
  registerLimiter,
  validate({ body: authValidation.registerSchema }),
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  validate({ body: authValidation.loginSchema }),
  authController.login
);

router.post(
  '/refresh',
  refreshLimiter,
  validate({ body: authValidation.refreshSchema }),
  authController.refresh
);

router.post(
  '/logout',
  validate({ body: authValidation.logoutSchema }),
  authController.logout
);

// Protected auth endpoints (require valid access token)
router.get('/me', authenticate, authController.getMe);

router.patch(
  '/me',
  authenticate,
  validate({ body: authValidation.updateMeSchema }),
  authController.updateMe
);

router.post(
  '/change-password',
  authenticate,
  validate({ body: authValidation.changePasswordSchema }),
  authController.changePassword
);

router.delete(
  '/me',
  authenticate,
  validate({ body: authValidation.deleteMeSchema }),
  authController.deleteMe
);

router.post('/test-email', authenticate, authController.sendTestEmail);

export { router as authRoutes };
