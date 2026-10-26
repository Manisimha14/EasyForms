// tests/unit/email.test.js
// Unit tests for transactional email service, validation, mock delivery, idempotency, and retry.

import {
  isValidEmail,
  sendEmailWithRetry,
  handleSubmissionNotifications,
  verifyEmailTransporter,
  getSentEmails,
  clearSentEmails,
} from '../../src/services/email.service.js';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';
import { Form } from '../../src/models/form.model.js';
import { Response } from '../../src/models/response.model.js';

describe('Transactional Email Service', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    clearSentEmails();
  });

  afterEach(async () => {
    await cleanTestDB();
    clearSentEmails();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Email validation (isValidEmail)', () => {
    test('validates correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('john.doe+test@gmail.com')).toBe(true);
      expect(isValidEmail('support@easyforms.app')).toBe(true);
    });

    test('rejects malformed email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('sendEmailWithRetry and Idempotency', () => {
    test('records email in mock mode and creates sent EmailJob', async () => {
      const idempotencyKey = `test_${Date.now()}`;
      const job = await sendEmailWithRetry({
        type: 'owner_notification',
        to: 'owner@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
        text: 'Hello',
        idempotencyKey,
      });

      expect(job).not.toBeNull();
      expect(job.status).toBe('sent');
      expect(job.attempts).toBe(1);

      const sent = getSentEmails();
      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe('owner@example.com');
      expect(sent[0].subject).toBe('Test Subject');
    });

    test('skips duplicate sending when using the same idempotency key', async () => {
      const idempotencyKey = `idemp_${Date.now()}`;

      // First send
      await sendEmailWithRetry({
        type: 'respondent_receipt',
        to: 'respondent@example.com',
        subject: 'Receipt #1',
        html: '<p>Receipt</p>',
        text: 'Receipt',
        idempotencyKey,
      });
      expect(getSentEmails()).toHaveLength(1);

      // Duplicate send with same idempotency key
      await sendEmailWithRetry({
        type: 'respondent_receipt',
        to: 'respondent@example.com',
        subject: 'Receipt #1',
        html: '<p>Receipt</p>',
        text: 'Receipt',
        idempotencyKey,
      });

      // Sent count should STILL be 1!
      expect(getSentEmails()).toHaveLength(1);
    });

    test('skips email when recipient is invalid', async () => {
      const job = await sendEmailWithRetry({
        type: 'respondent_receipt',
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
        idempotencyKey: 'invalid_key',
      });

      expect(job).toBeNull();
      expect(getSentEmails()).toHaveLength(0);
    });
  });

  describe('handleSubmissionNotifications', () => {
    let owner;
    let form;
    let response;

    beforeEach(async () => {
      owner = await createTestUser({ email: 'form_owner_notify@example.com' });

      form = await Form.create({
        title: 'Feedback Survey',
        ownerId: owner.user.id,
        slug: 'slugtest12',
        status: 'published',
        fields: [
          {
            id: 'fld_email',
            label: 'Your Email',
            type: 'email',
            required: true,
            order: 0,
          },
        ],
        notifications: {
          respondentReceipt: true,
          ownerNotification: true,
          respondentEmailFieldId: 'fld_email',
        },
      });

      response = await Response.create({
        formId: form._id,
        answers: [{ fieldId: 'fld_email', value: 'respondent@test.com' }],
        submittedAt: new Date(),
      });
    });

    test('sends both owner notification and respondent receipt when both enabled', async () => {
      await handleSubmissionNotifications({
        form,
        response,
        answers: [{ fieldId: 'fld_email', value: 'respondent@test.com' }],
      });

      const sent = getSentEmails();
      expect(sent).toHaveLength(2);

      const ownerEmail = sent.find((e) => e.to === 'form_owner_notify@example.com');
      const receiptEmail = sent.find((e) => e.to === 'respondent@test.com');

      expect(ownerEmail).toBeDefined();
      expect(ownerEmail.subject).toContain('New Response Received: Feedback Survey');
      expect(receiptEmail).toBeDefined();
      expect(receiptEmail.subject).toContain('Submission Receipt: Feedback Survey');
    });

    test('does not send emails when notifications are disabled', async () => {
      form.notifications.respondentReceipt = false;
      form.notifications.ownerNotification = false;
      await form.save();

      await handleSubmissionNotifications({
        form,
        response,
        answers: [{ fieldId: 'fld_email', value: 'respondent@test.com' }],
      });

      expect(getSentEmails()).toHaveLength(0);
    });

    test('safely ignores respondent receipt when respondent email is missing or empty', async () => {
      form.notifications.ownerNotification = false;
      form.notifications.respondentReceipt = true;
      await form.save();

      await handleSubmissionNotifications({
        form,
        response,
        answers: [{ fieldId: 'fld_other', value: 'not an email' }],
      });

      // No email sent, but no error thrown
      expect(getSentEmails()).toHaveLength(0);
    });
  });

  describe('verifyEmailTransporter', () => {
    test('succeeds in mock mode', async () => {
      const res = await verifyEmailTransporter();
      expect(res.success).toBe(true);
      expect(res.mode).toBe('mock');
    });
  });
});
