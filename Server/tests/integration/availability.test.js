// tests/integration/availability.test.js
// Tests for form scheduling, time windows, response limits, and availability enforcement.

import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';

describe('Form Availability and Scheduling', () => {
  let app;
  let owner;
  let formId;
  let formSlug;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  beforeEach(async () => {
    owner = await createTestUser({ email: 'scheduler_owner@example.com' });

    // Create a form
    const createRes = await request(app)
      .post('/api/v1/forms')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Timed Registration Form',
        description: 'Testing availability windows.',
      });

    formId = createRes.body.data.id;
    formSlug = createRes.body.data.slug;

    // Add field
    await request(app)
      .put(`/api/v1/forms/${formId}/fields`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('If-Match', '"1"')
      .send({
        fields: [
          {
            id: 'fld_email',
            label: 'Email',
            type: 'email',
            required: true,
            order: 0,
          },
        ],
      });
  });

  afterEach(async () => {
    await cleanTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Form Metadata Availability Validation (PATCH /api/v1/forms/:id)', () => {
    test('rejects when endAt is earlier than startAt', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() + 60000).toISOString();
      const endAt = new Date(now.getTime() - 60000).toISOString();

      const res = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          startAt,
          endAt,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('End date and time must be later than start date and time.');
    });

    test('rejects when endAt is equal to startAt', async () => {
      const exactTime = new Date().toISOString();

      const res = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          startAt: exactTime,
          endAt: exactTime,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('successfully updates and removes availability settings', async () => {
      const start = new Date(Date.now() + 10000).toISOString();
      const end = new Date(Date.now() + 100000).toISOString();

      // Set schedule and maxResponses
      const updateRes = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          startAt: start,
          endAt: end,
          maxResponses: 50,
          notifications: {
            respondentReceipt: true,
            ownerNotification: true,
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.startAt).toBeDefined();
      expect(updateRes.body.data.endAt).toBeDefined();
      expect(updateRes.body.data.maxResponses).toBe(50);
      expect(updateRes.body.data.notifications.respondentReceipt).toBe(true);
      expect(updateRes.body.data.notifications.ownerNotification).toBe(true);

      // Remove settings (set to null)
      const clearRes = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({
          startAt: null,
          endAt: null,
          maxResponses: null,
        });

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.data.startAt).toBeNull();
      expect(clearRes.body.data.endAt).toBeNull();
      expect(clearRes.body.data.maxResponses).toBeNull();
    });
  });

  describe('Public Retrieval Availability Status (GET /api/v1/public/forms/:slug)', () => {
    test('reports scheduled status when startAt is in the future', async () => {
      const futureStart = new Date(Date.now() + 3600000).toISOString();
      await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ startAt: futureStart });

      // Publish form
      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app).get(`/api/v1/public/forms/${formSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.availability).toBeDefined();
      expect(res.body.data.availability.status).toBe('scheduled');
      expect(res.body.data.availability.startAt).toBeDefined();
    });

    test('reports open status when currently within availability window', async () => {
      const pastStart = new Date(Date.now() - 3600000).toISOString();
      const futureEnd = new Date(Date.now() + 3600000).toISOString();
      await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ startAt: pastStart, endAt: futureEnd });

      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app).get(`/api/v1/public/forms/${formSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.availability.status).toBe('open');
    });

    test('reports closed status when endAt is in the past', async () => {
      const pastStart = new Date(Date.now() - 7200000).toISOString();
      const pastEnd = new Date(Date.now() - 3600000).toISOString();
      await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ startAt: pastStart, endAt: pastEnd });

      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app).get(`/api/v1/public/forms/${formSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.availability.status).toBe('closed');
    });

    test('reports closed status when maxResponses limit is reached', async () => {
      await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ maxResponses: 1 });

      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      // Submit 1 response
      await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({ answers: [{ fieldId: 'fld_email', value: 'user1@example.com' }] });

      const res = await request(app).get(`/api/v1/public/forms/${formSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.availability.status).toBe('closed');
    });
  });

  describe('Public Submission Enforcement (POST /api/v1/public/forms/:slug/responses)', () => {
    test('rejects submission before start time with 403 Forbidden', async () => {
      const futureStart = new Date(Date.now() + 3600000).toISOString();
      await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ startAt: futureStart });

      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({ answers: [{ fieldId: 'fld_email', value: 'early@example.com' }] });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('This form is not accepting responses yet.');
    });

    test('rejects submission at or after end time with 403 Forbidden', async () => {
      const pastStart = new Date(Date.now() - 7200000).toISOString();
      const pastEnd = new Date(Date.now() - 1000).toISOString();
      await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ startAt: pastStart, endAt: pastEnd });

      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({ answers: [{ fieldId: 'fld_email', value: 'late@example.com' }] });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('This form is now closed.');
    });

    test('rejects submission when max response limit is reached with 403 Forbidden', async () => {
      await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ maxResponses: 1 });

      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      // First submission passes
      const firstRes = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({ answers: [{ fieldId: 'fld_email', value: 'lucky@example.com' }] });
      expect(firstRes.status).toBe(201);

      // Second submission is blocked
      const secondRes = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({ answers: [{ fieldId: 'fld_email', value: 'toolate@example.com' }] });

      expect(secondRes.status).toBe(403);
      expect(secondRes.body.error.message).toContain('This form has reached its maximum response limit.');
    });

    test('accepts submission within active window', async () => {
      const pastStart = new Date(Date.now() - 60000).toISOString();
      const futureEnd = new Date(Date.now() + 60000).toISOString();

      await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ startAt: pastStart, endAt: futureEnd });

      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({ answers: [{ fieldId: 'fld_email', value: 'on_time@example.com' }] });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
    });
  });
});
