// src/modules/ai/ai.controller.js
import { Form } from '../../models/form.model.js';
import { Response } from '../../models/response.model.js';
import { generateFormWithAI, chatWithResponsesAI } from '../../services/ai.service.js';
import { AppError } from '../../utils/app-error.js';

export async function generateForm(req, res, next) {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw AppError.badRequest('A text prompt describing the desired form is required.');
    }

    const result = await generateFormWithAI(prompt.trim());
    return res.status(200).json({
      success: true,
      data: result.form,
      provider: result.provider,
    });
  } catch (err) {
    next(err);
  }
}

export async function chatResponses(req, res, next) {
  try {
    const { id: formId } = req.params;
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      throw AppError.badRequest('A messages array with user query is required.');
    }

    const form = await Form.findById(formId).lean();
    if (!form) {
      throw AppError.notFound('Form not found.');
    }

    const userId = req.userId || req.user?.id || req.user?._id;
    if (!userId || form.ownerId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have permission to access analytics for this form.');
    }

    const responses = await Response.find({ formId: form._id })
      .sort({ submittedAt: -1 })
      .limit(100)
      .lean();

    const result = await chatWithResponsesAI({
      form,
      responses,
      stats: {},
      messages,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
