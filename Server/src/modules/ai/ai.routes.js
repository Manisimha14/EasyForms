// src/modules/ai/ai.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as aiController from './ai.controller.js';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Generate form definition from natural language prompt
router.post('/generate-form', aiController.generateForm);

// Chat with AI about form responses
router.post('/forms/:id/chat', aiController.chatResponses);

export { router as aiRoutes };
