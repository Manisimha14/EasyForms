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
 * Escape HTML characters to safely render user-submitted text in email templates.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format an answer value into a clean human-readable string.
 */
function formatAnswerValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value.name) {
      const sizeStr = value.size ? ` (${(value.size / 1024).toFixed(1)} KB)` : '';
      return `📎 ${value.name}${sizeStr}`;
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'string' && value.startsWith('data:')) {
    return '📎 Attached file';
  }
  return String(value);
}

/**
 * Pixelated retro-modern SVG logo for email headers.
 */
const EMAIL_PIXEL_LOGO_SVG = `
<svg width="34" height="34" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; shape-rendering: crispEdges; display: inline-block; vertical-align: middle; border-radius: 6px; margin-right: 8px;">
  <!-- Outer Pixel Base -->
  <rect x="4" y="0" width="12" height="20" fill="#D95300"/>
  <rect x="2" y="1" width="16" height="18" fill="#D95300"/>
  <rect x="1" y="2" width="18" height="16" fill="#D95300"/>
  <rect x="0" y="4" width="20" height="12" fill="#D95300"/>
  <!-- Main Orange Body -->
  <rect x="4" y="1" width="12" height="17" fill="#FF7300"/>
  <rect x="2" y="2" width="16" height="15" fill="#FF7300"/>
  <rect x="1" y="3" width="18" height="13" fill="#FF7300"/>
  <!-- Highlight -->
  <rect x="4" y="2" width="5" height="2" fill="#FFA547"/>
  <rect x="2" y="4" width="2" height="5" fill="#FFA547"/>
  <rect x="3" y="3" width="2" height="2" fill="#FFA547"/>
  <!-- Letter E -->
  <rect x="4" y="7" width="3" height="7" fill="#FFFFFF"/>
  <rect x="5" y="6" width="5" height="2" fill="#FFFFFF"/>
  <rect x="4" y="7" width="6" height="1" fill="#FFFFFF"/>
  <rect x="4" y="9" width="5" height="2" fill="#FFFFFF"/>
  <rect x="4" y="12" width="6" height="2" fill="#FFFFFF"/>
  <!-- Letter F -->
  <rect x="11" y="7" width="3" height="7" fill="#FFFFFF"/>
  <rect x="12" y="6" width="5" height="2" fill="#FFFFFF"/>
  <rect x="11" y="7" width="6" height="1" fill="#FFFFFF"/>
  <rect x="11" y="9" width="5" height="2" fill="#FFFFFF"/>
</svg>
`;

/**
 * Send email via Resend REST API (HTTPS port 443).
 * Never blocked on Render Free tier.
 */
async function sendViaResendApi({ to, subject, html, text }) {
  const from = env.EMAIL_FROM && !env.EMAIL_FROM.includes('easyforms.local')
    ? env.EMAIL_FROM
    : 'Easy Forms <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to.trim()],
      subject,
      html,
      text,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error?.message || `Resend API error (${res.status})`);
  }
  return { messageId: data.id };
}

/**
 * Send email via Brevo REST API (HTTPS port 443).
 * Never blocked on Render Free tier.
 */
async function sendViaBrevoApi({ to, subject, html, text }) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = (env.EMAIL_FROM && env.EMAIL_FROM.match(emailRegex)) || (env.SMTP_USER && env.SMTP_USER.match(emailRegex));
  const senderEmail = match ? match[0] : (env.SMTP_USER || 'noreply@easyforms.app');
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Easy Forms', email: senderEmail },
      to: [{ email: to.trim() }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Brevo API error (${res.status})`);
  }
  return { messageId: data.messageId };
}

/**
 * Create or reuse the email transporter.
 */
let transporterInstance = null;

export function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  // 1. Resend HTTP REST API (Port 443 - works on Render Free Tier without port blocks)
  if (env.RESEND_API_KEY || env.EMAIL_PROVIDER === 'resend') {
    transporterInstance = {
      sendMail: async (mailOptions) => sendViaResendApi(mailOptions),
      verify: async () => true,
    };
    return transporterInstance;
  }

  // 2. Brevo HTTP REST API (Port 443 - works on Render Free Tier without port blocks)
  if (env.BREVO_API_KEY || env.EMAIL_PROVIDER === 'brevo') {
    transporterInstance = {
      sendMail: async (mailOptions) => sendViaBrevoApi(mailOptions),
      verify: async () => true,
    };
    return transporterInstance;
  }

  // 3. SMTP Mode (for paid Render plans, VPS, or local development)
  if (env.EMAIL_MODE === 'smtp') {
    const cleanPassword = (env.SMTP_APP_PASSWORD || '').replace(/\s+/g, '');
    const isGmail = env.EMAIL_PROVIDER === 'gmail' || (env.SMTP_USER && env.SMTP_USER.endsWith('@gmail.com'));
    const port = Number(env.SMTP_PORT) || 587;
    const isSecure = env.SMTP_SECURE !== undefined ? Boolean(env.SMTP_SECURE) : port === 465;

    transporterInstance = nodemailer.createTransport({
      host: env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'localhost'),
      port,
      secure: isSecure,
      auth: {
        user: env.SMTP_USER,
        pass: cleanPassword,
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  } else {
    // 4. Mock / test transport
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
  if (env.RESEND_API_KEY || env.EMAIL_PROVIDER === 'resend') {
    logger.info({ provider: 'resend' }, 'Email service using Resend HTTP API (HTTPS port 443 — works on Render Free Tier)');
    return { success: true, mode: 'api', provider: 'resend' };
  }

  if (env.BREVO_API_KEY || env.EMAIL_PROVIDER === 'brevo') {
    logger.info({ provider: 'brevo' }, 'Email service using Brevo HTTP API (HTTPS port 443 — works on Render Free Tier)');
    return { success: true, mode: 'api', provider: 'brevo' };
  }

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
    let errMsg = err.message || 'SMTP connection verification failed';
    if (errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT') || errMsg.includes('Connection timeout')) {
      errMsg = 'Render Free tier blocks outbound SMTP ports (465/587). Add RESEND_API_KEY in Render dashboard to send over HTTPS (port 443).';
    }
    logger.error(
      {
        err: errMsg,
        mode: 'smtp',
        provider: env.EMAIL_PROVIDER,
        user: env.SMTP_USER,
      },
      errMsg
    );
    return { success: false, mode: 'smtp', error: errMsg };
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
      const rawError = err.message || 'Unknown SMTP error';
      if (rawError.includes('timeout') || rawError.includes('ETIMEDOUT') || rawError.includes('Connection timeout')) {
        lastError = 'Render Free Tier blocks outbound SMTP ports (465/587). Add RESEND_API_KEY in Render dashboard to send over HTTPS (port 443).';
      } else {
        lastError = rawError;
      }
      logger.warn({ type, to, attempt, err: lastError }, 'Email delivery attempt failed');

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
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta name="color-scheme" content="light dark">
            </head>
            <body style="margin: 0; padding: 24px 12px; background-color: #F5F5F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                
                <!-- Header Bar -->
                <div style="background-color: #FFFDF9; border-bottom: 1px solid #F5F5F4; padding: 18px 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="vertical-align: middle;">
                        ${EMAIL_PIXEL_LOGO_SVG}
                        <span style="font-size: 16px; font-weight: 800; color: #1C1917; vertical-align: middle; letter-spacing: -0.02em;">Easy Forms</span>
                      </td>
                      <td style="text-align: right; vertical-align: middle;">
                        <span style="background-color: #FFEDD5; color: #C2410C; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.04em;">New Submission</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Main Content -->
                <div style="padding: 28px 24px;">
                  <h1 style="font-size: 22px; font-weight: 800; color: #1C1917; margin: 0 0 8px 0; letter-spacing: -0.02em; line-height: 1.3;">
                    New Response Received
                  </h1>
                  <p style="font-size: 14px; color: #78716C; margin: 0 0 20px 0; line-height: 1.5;">
                    A new response was just recorded for your form <strong style="color: #292524;">"${escapeHtml(form.title)}"</strong>.
                  </p>
                  
                  <!-- Metadata Card -->
                  <div style="background-color: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="font-size: 11px; color: #9A3412; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">
                          Submission Time
                        </td>
                        <td style="font-size: 11px; color: #9A3412; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; padding-bottom: 4px;">
                          Response Reference
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #431407; font-weight: 500;">
                          ${formattedDate}
                        </td>
                        <td style="font-size: 13px; color: #EA580C; font-weight: 700; text-align: right; font-family: monospace;">
                          #${responseId}
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <div style="margin: 28px 0 20px 0; text-align: center;">
                    <a href="${responsesUrl}" style="background-color: #EA580C; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px 28px; border-radius: 10px; display: inline-block; box-shadow: 0 2px 6px rgba(234, 88, 12, 0.25);">
                      View Responses in Dashboard &rarr;
                    </a>
                  </div>

                  <!-- Privacy Note -->
                  <p style="font-size: 12px; color: #A8A29E; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #F5F5F4; padding-top: 16px; text-align: center;">
                    To protect respondent privacy, answer details are stored securely and accessible only when signed in.
                  </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #FAFAF9; border-top: 1px solid #F5F5F4; padding: 14px 24px; text-align: center;">
                  <span style="font-size: 11px; color: #A8A29E;">Easy Forms Notification Service</span>
                </div>
              </div>
            </body>
            </html>
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

          // Format submitted answers for the receipt
          const fields = Array.isArray(form.fields)
            ? [...form.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
            : [];

          const answerRows = [];
          const textSummaryLines = [];

          for (const field of fields) {
            const ans = (answers || []).find((a) => a.fieldId === field.id);
            const rawVal = ans ? ans.value : null;
            const formattedVal = formatAnswerValue(rawVal);
            const escapedLabel = escapeHtml(field.label || 'Question');
            const escapedVal = escapeHtml(formattedVal);

            answerRows.push(`
              <div style="background-color: #FAFAF9; border: 1px solid #F5F5F4; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px;">
                <div style="font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                  ${escapedLabel}
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #1C1917; word-break: break-word; line-height: 1.5;">
                  ${escapedVal}
                </div>
              </div>
            `);

            textSummaryLines.push(`• ${field.label || 'Question'}: ${formattedVal}`);
          }

          const text = `Hello,\n\nThank you for completing "${form.title}".\n\nYour response was successfully recorded on ${formattedDate}.\n\nReceipt Reference: ${responseId}\n\nSummary of Your Submission:\n---------------------------\n${textSummaryLines.join('\n')}\n\nThis email serves as your official submission receipt.\n\n— Easy Forms`;
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta name="color-scheme" content="light dark">
            </head>
            <body style="margin: 0; padding: 24px 12px; background-color: #F5F5F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                
                <!-- Header Bar -->
                <div style="background-color: #FFFDF9; border-bottom: 1px solid #F5F5F4; padding: 18px 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="vertical-align: middle;">
                        ${EMAIL_PIXEL_LOGO_SVG}
                        <span style="font-size: 16px; font-weight: 800; color: #1C1917; vertical-align: middle; letter-spacing: -0.02em;">Easy Forms</span>
                      </td>
                      <td style="text-align: right; vertical-align: middle;">
                        <span style="background-color: #ECFDF5; color: #047857; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.04em;">Confirmed &#10003;</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Main Content -->
                <div style="padding: 28px 24px;">
                  <h1 style="font-size: 22px; font-weight: 800; color: #1C1917; margin: 0 0 8px 0; letter-spacing: -0.02em; line-height: 1.3;">
                    Submission Confirmed
                  </h1>
                  <p style="font-size: 14px; color: #78716C; margin: 0 0 20px 0; line-height: 1.5;">
                    Thank you! Your response to <strong style="color: #292524;">"${escapeHtml(form.title)}"</strong> has been recorded. Here is a copy of your submission for your records.
                  </p>
                  
                  <!-- Metadata Card -->
                  <div style="background-color: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="font-size: 11px; color: #9A3412; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">
                          Submitted Date
                        </td>
                        <td style="font-size: 11px; color: #9A3412; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; padding-bottom: 4px;">
                          Receipt Reference
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #431407; font-weight: 500;">
                          ${formattedDate}
                        </td>
                        <td style="font-size: 13px; color: #EA580C; font-weight: 700; text-align: right; font-family: monospace;">
                          #${responseId}
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Summary of Answers -->
                  <div style="margin: 24px 0 16px 0;">
                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 12px; font-weight: 700; color: #292524; text-transform: uppercase; letter-spacing: 0.05em;">
                        Summary of Your Submission
                      </span>
                    </div>
                    <div>
                      ${
                        answerRows.length > 0
                          ? answerRows.join('')
                          : '<div style="font-size: 13px; color: #78716C; padding: 12px; background: #FAFAF9; border-radius: 8px;">No question details available.</div>'
                      }
                    </div>
                  </div>

                  <!-- Footer note -->
                  <p style="font-size: 12px; color: #A8A29E; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #F5F5F4; padding-top: 16px; text-align: center;">
                    This email serves as your official submission receipt from Easy Forms.
                  </p>
                </div>

                <!-- Footer Bar -->
                <div style="background-color: #FAFAF9; border-top: 1px solid #F5F5F4; padding: 14px 24px; text-align: center;">
                  <span style="font-size: 11px; color: #A8A29E;">Powered by Easy Forms &bull; Fast, elegant forms</span>
                </div>
              </div>
            </body>
            </html>
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
