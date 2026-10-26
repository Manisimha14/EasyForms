// src/services/email.service.js
// Transactional email service using Nodemailer with Google SMTP support.
// Supports mock mode for tests/development, idempotency via EmailJob, and retry with exponential backoff.

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { EmailJob } from '../models/email-job.model.js';
import { User } from '../models/user.model.js';

// In-memory store for mock mode
const sentEmails = [];

/**
 * Get in-memory sent emails (for testing and verification).
 */
export function getSentEmails() {
  return [...sentEmails];
}

/**
 * Clear in-memory sent emails.
 */
export function clearSentEmails() {
  sentEmails.length = 0;
}

/**
 * Validate an email address format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Create or reuse the Nodemailer transporter.
 */
let transporterInstance = null;

export function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  if (env.EMAIL_MODE === 'smtp') {
    const cleanPassword = (env.SMTP_APP_PASSWORD || '').replace(/\s+/g, '');
    const isGmail = env.EMAIL_PROVIDER === 'gmail' || (env.SMTP_USER && env.SMTP_USER.endsWith('@gmail.com'));
    const port = Number(env.SMTP_PORT) || 465;
    const isSecure = env.SMTP_SECURE !== undefined ? Boolean(env.SMTP_SECURE) : port === 465;

    if (isGmail && (!env.SMTP_HOST || env.SMTP_HOST === 'smtp.gmail.com')) {
      transporterInstance = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.SMTP_USER,
          pass: cleanPassword,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    } else {
      transporterInstance = nodemailer.createTransport({
        host: env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'localhost'),
        port,
        secure: isSecure,
        auth: {
          user: env.SMTP_USER,
          pass: cleanPassword,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    }
  } else {
    // Mock / test transport
    transporterInstance = {
      sendMail: async (mailOptions) => {
        sentEmails.push({
          ...mailOptions,
          sentAt: new Date(),
        });
        return { messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}` };
      },
      verify: async () => true,
    };
  }

  return transporterInstance;
}

/**
 * Reset transporter instance (useful for unit testing different configurations).
 */
export function resetTransporter() {
  transporterInstance = null;
}

/**
 * Verify SMTP connection.
 * Useful for startup logging and diagnostics.
 */
export async function verifyEmailTransporter() {
  if (env.EMAIL_MODE !== 'smtp') {
    logger.info({ mode: env.EMAIL_MODE }, 'Email service running in MOCK mode (emails recorded in-memory)');
    return { success: true, mode: 'mock' };
  }

  const cleanPassword = (env.SMTP_APP_PASSWORD || '').replace(/\s+/g, '');
  if (!env.SMTP_USER || !cleanPassword) {
    const msg = 'EMAIL_MODE is set to "smtp" but SMTP_USER or SMTP_APP_PASSWORD is not provided in environment variables';
    logger.warn({ mode: 'smtp' }, msg);
    return { success: false, mode: 'smtp', error: msg };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    logger.info(
      {
        mode: 'smtp',
        provider: env.EMAIL_PROVIDER,
        user: env.SMTP_USER,
      },
      'SMTP connection verified successfully with mail provider'
    );
    return { success: true, mode: 'smtp' };
  } catch (err) {
    logger.error(
      {
        err: err.message,
        mode: 'smtp',
        provider: env.EMAIL_PROVIDER,
        user: env.SMTP_USER,
      },
      'SMTP connection verification failed. Please check credentials or host/port access.'
    );
    return { success: false, mode: 'smtp', error: err.message };
  }
}

/**
 * Send an email with bounded retries and exponential backoff.
 * Updates the EmailJob outbox record.
 *
 * @param {object} params
 * @param {string} params.type
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.html
 * @param {string} params.text
 * @param {string} params.idempotencyKey
 * @param {number} [params.maxAttempts=3]
 */
export async function sendEmailWithRetry({
  type,
  to,
  subject,
  html,
  text,
  idempotencyKey,
  maxAttempts = 3,
}) {
  if (!isValidEmail(to)) {
    logger.warn({ to, type }, 'Skipping email delivery: invalid recipient email address');
    return null;
  }

  // Check or create persistent EmailJob
  let job;
  try {
    job = await EmailJob.findOne({ idempotencyKey });
    if (job) {
      if (job.status === 'sent') {
        logger.info({ idempotencyKey }, 'Email already sent, skipping duplicate');
        return job;
      }
    } else {
      job = await EmailJob.create({
        type,
        to: to.trim().toLowerCase(),
        subject,
        html,
        text,
        idempotencyKey,
        status: 'pending',
        maxAttempts,
      });
    }
  } catch (err) {
    // If unique key collision occurred concurrently, reload existing job
    if (err.code === 11000) {
      job = await EmailJob.findOne({ idempotencyKey });
      if (job?.status === 'sent') return job;
    } else {
      logger.error({ err: err.message }, 'Failed to persist email job in outbox');
    }
  }

  const transporter = getTransporter();
  let attempt = job?.attempts || 0;
  let lastError = null;

  const defaultFrom = env.SMTP_USER ? `Easy Forms <${env.SMTP_USER}>` : 'Easy Forms <noreply@easyforms.local>';
  const fromAddress = env.EMAIL_FROM && !env.EMAIL_FROM.includes('easyforms.local') ? env.EMAIL_FROM : defaultFrom;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: to.trim(),
        subject,
        html,
        text,
      });

      if (job) {
        job.status = 'sent';
        job.attempts = attempt;
        job.sentAt = new Date();
        job.lastError = null;
        await job.save();
      }

      logger.info({ type, to, attempt }, 'Email delivered successfully');
      return job;
    } catch (err) {
      lastError = err.message || 'Unknown SMTP error';
      logger.warn({ type, to, attempt, err: lastError }, 'SMTP delivery attempt failed');

      if (attempt < maxAttempts) {
        // Backoff: 100ms * 2^attempt (short in tests, reliable in production)
        const delay = Math.min(100 * Math.pow(2, attempt), 2000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts exhausted
  if (job) {
    job.status = 'failed';
    job.attempts = attempt;
    job.lastError = lastError;
    await job.save();
  }

  logger.error({ type, to, attempts: attempt, lastError }, 'Email delivery failed after all retry attempts');
  return job;
}

/**
 * Handle form submission notifications (respondent receipt and owner alert).
 * Safe against delivery failures - NEVER throws to ensure form responses remain saved.
 *
 * @param {object} params
 * @param {object} params.form
 * @param {object} params.response
 * @param {Array<{ fieldId: string, value: any }>} params.answers
 */
export async function handleSubmissionNotifications({ form, response, answers }) {
  if (!form || !response) return;

  try {
    const notifications = form.notifications || {};
    const responseId = response._id ? response._id.toString() : response.id;
    const submittedAt = response.submittedAt || new Date();
    const formattedDate = new Date(submittedAt).toUTCString();

    // 1. Form Owner Notification
    if (notifications.ownerNotification) {
      try {
        const owner = await User.findById(form.ownerId);
        if (owner && isValidEmail(owner.email)) {
          const clientOrigin = env.CORS_ORIGINS.split(',')[0].trim() || 'http://localhost:5173';
          const responsesUrl = `${clientOrigin}/forms/${form._id || form.id}/responses`;

          const subject = `New Response Received: ${form.title}`;
          const text = `Hello,\n\nA new response has been submitted to your form "${form.title}" on ${formattedDate}.\n\nView the response in your dashboard:\n${responsesUrl}\n\nNote: For respondent privacy and security, answer details are available exclusively in your authenticated dashboard.\n\n— Easy Forms`;
          const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #292524; background-color: #FFFDF9; border: 1px solid #E7E5E4; border-radius: 16px;">
              <div style="margin-bottom: 20px;">
                <span style="background-color: #FFEDD5; color: #EA580C; font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">Easy Forms</span>
              </div>
              <h2 style="font-size: 20px; font-weight: 700; color: #292524; margin-top: 0; margin-bottom: 8px;">New Response Received</h2>
              <p style="font-size: 14px; color: #78716C; margin-top: 0; line-height: 1.5;">A new submission has been recorded for your form <strong>"${form.title}"</strong>.</p>
              
              <div style="background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #78716C;"><strong>Submission Time:</strong> ${formattedDate}</p>
                <p style="margin: 0; font-size: 13px; color: #78716C;"><strong>Response ID:</strong> <code style="font-family: monospace; background: #F5F5F4; padding: 2px 6px; border-radius: 4px;">${responseId}</code></p>
              </div>

              <div style="margin: 24px 0;">
                <a href="${responsesUrl}" style="background-color: #F97316; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px; display: inline-block;">View Responses in Dashboard</a>
              </div>

              <p style="font-size: 12px; color: #A8A29E; line-height: 1.4; margin-top: 24px; border-top: 1px solid #E7E5E4; padding-top: 16px;">
                To protect respondent privacy, answer details are kept secure and accessible only when signed in.
              </p>
            </div>
          `;

          await sendEmailWithRetry({
            type: 'owner_notification',
            to: owner.email,
            subject,
            html,
            text,
            idempotencyKey: `owner_${responseId}`,
          });
        }
      } catch (ownerErr) {
        logger.error({ err: ownerErr.message }, 'Failed to send owner notification email');
      }
    }

    // 2. Respondent Submission Receipt
    if (notifications.respondentReceipt) {
      try {
        let recipientEmail = null;

        // Try configured field first
        if (notifications.respondentEmailFieldId) {
          const match = answers.find((a) => a.fieldId === notifications.respondentEmailFieldId);
          if (match && typeof match.value === 'string') {
            recipientEmail = match.value.trim();
          }
        }

        // Fallback: look for an email-type field in form definition
        if (!recipientEmail && Array.isArray(form.fields)) {
          const emailFields = form.fields.filter((f) => f.type === 'email');
          for (const ef of emailFields) {
            const ans = answers.find((a) => a.fieldId === ef.id);
            if (ans && typeof ans.value === 'string' && isValidEmail(ans.value)) {
              recipientEmail = ans.value.trim();
              break;
            }
          }
        }

        if (recipientEmail && isValidEmail(recipientEmail)) {
          const subject = `Submission Receipt: ${form.title}`;
          const text = `Hello,\n\nThank you for completing "${form.title}".\n\nYour response was successfully recorded on ${formattedDate}.\n\nReceipt ID: ${responseId}\n\n— Easy Forms`;
          const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #292524; background-color: #FFFDF9; border: 1px solid #E7E5E4; border-radius: 16px;">
              <div style="margin-bottom: 20px;">
                <span style="background-color: #FFEDD5; color: #EA580C; font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">Easy Forms</span>
              </div>
              <h2 style="font-size: 20px; font-weight: 700; color: #292524; margin-top: 0; margin-bottom: 8px;">Submission Confirmation</h2>
              <p style="font-size: 14px; color: #78716C; margin-top: 0; line-height: 1.5;">Thank you! Your response to <strong>"${form.title}"</strong> has been recorded.</p>
              
              <div style="background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #78716C;"><strong>Submitted:</strong> ${formattedDate}</p>
                <p style="margin: 0; font-size: 13px; color: #78716C;"><strong>Receipt Reference:</strong> <code style="font-family: monospace; background: #F5F5F4; padding: 2px 6px; border-radius: 4px;">${responseId}</code></p>
              </div>

              <p style="font-size: 12px; color: #A8A29E; line-height: 1.4; margin-top: 24px; border-top: 1px solid #E7E5E4; padding-top: 16px;">
                This email serves as your official submission receipt from Easy Forms.
              </p>
            </div>
          `;

          await sendEmailWithRetry({
            type: 'respondent_receipt',
            to: recipientEmail,
            subject,
            html,
            text,
            idempotencyKey: `receipt_${responseId}`,
          });
        } else {
          logger.info({ formId: form._id }, 'Respondent receipt enabled but no valid recipient email provided in submission');
        }
      } catch (receiptErr) {
        logger.error({ err: receiptErr.message }, 'Failed to send respondent receipt email');
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Unexpected error in handleSubmissionNotifications');
  }
}
