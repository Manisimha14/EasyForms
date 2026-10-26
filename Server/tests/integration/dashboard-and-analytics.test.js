// tests/integration/dashboard-and-analytics.test.js
// Integration tests for dashboard statistics, form question analytics,
// daily response trends, and cross-user authorization.

import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';
import { Response } from '../../src/models/response.model.js';

describe('Dashboard and Analytics endpoints', () => {
  let app;
  let userA;
  let userB;
  let formAId;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  beforeEach(async () => {
    userA = await createTestUser({ email: 'userA_dash@example.com' });
    userB = await createTestUser({ email: 'userB_dash@example.com' });

    // User A creates a form with various fields
    const createRes = await request(app)
      .post('/api/v1/forms')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ title: 'Quarterly Review' });

    formAId = createRes.body.data.id;

    await request(app)
      .put(`/api/v1/forms/${formAId}/fields`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('If-Match', '"1"')
      .send({
        fields: [
          { id: 'fld_text', label: 'Role Title', type: 'short_text', order: 0 },
          { id: 'fld_score', label: 'Performance Score', type: 'number', order: 1 },
          { id: 'fld_remote', label: 'Works remotely?', type: 'yes_no', order: 2 },
          { id: 'fld_dept', label: 'Department', type: 'single_select', options: ['Eng', 'HR', 'Ops'], order: 3 },
          { id: 'fld_rating', label: 'Job Satisfaction', type: 'rating', validation: { min: 1, max: 5 }, order: 4 },
        ],
      });
  });

  afterEach(async () => {
    await cleanTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/v1/dashboard/stats', () => {
    test('returns accurate form and response metrics with null monthOverMonthChangePercent when last month has 0 responses', async () => {
      // Form A is draft
      // Create and publish Form 2
      const form2 = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Published Form' });

      await request(app)
        .put(`/api/v1/forms/${form2.body.data.id}/fields`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          fields: [{ label: 'Q1', type: 'short_text', order: 0 }],
        });

      await request(app)
        .post(`/api/v1/forms/${form2.body.data.id}/publish`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      // Add response submitted this month
      await Response.create({
        formId: formAId,
        answers: [{ fieldId: 'fld_text', value: 'Dev' }],
        submittedAt: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const stats = res.body.data;
      expect(stats.totalForms).toBe(2);
      expect(stats.draftForms).toBe(1);
      expect(stats.publishedForms).toBe(1);
      expect(stats.totalResponses).toBe(1);
      expect(stats.responsesThisMonth).toBe(1);
      expect(stats.responsesLastMonth).toBe(0);
      expect(stats.monthOverMonthChangePercent).toBeNull();
    });

    test('calculates monthOverMonthChangePercent accurately when last month had responses', async () => {
      const now = new Date();
      // Date in last month
      const lastMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15, 12, 0, 0));
      // Date in this month
      const thisMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 5, 12, 0, 0));

      // 2 responses last month, 3 responses this month -> +50% change
      await Response.create([
        { formId: formAId, answers: [], submittedAt: lastMonthDate },
        { formId: formAId, answers: [], submittedAt: lastMonthDate },
        { formId: formAId, answers: [], submittedAt: thisMonthDate },
        { formId: formAId, answers: [], submittedAt: thisMonthDate },
        { formId: formAId, answers: [], submittedAt: thisMonthDate },
      ]);

      const res = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.responsesLastMonth).toBe(2);
      expect(res.body.data.responsesThisMonth).toBe(3);
      expect(res.body.data.monthOverMonthChangePercent).toBe(50);
    });

    test('isolates dashboard statistics strictly by user', async () => {
      const resB = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.totalForms).toBe(0);
      expect(resB.body.data.totalResponses).toBe(0);
    });
  });

  describe('GET /api/v1/forms/:id/analytics', () => {
    test('computes per-type summaries across all question types for the owner', async () => {
      await Response.create([
        {
          formId: formAId,
          answers: [
            { fieldId: 'fld_text', value: 'Engineer' },
            { fieldId: 'fld_score', value: 80 },
            { fieldId: 'fld_remote', value: true },
            { fieldId: 'fld_dept', value: 'Eng' },
            { fieldId: 'fld_rating', value: 4 },
          ],
        },
        {
          formId: formAId,
          answers: [
            { fieldId: 'fld_text', value: 'Designer' },
            { fieldId: 'fld_score', value: 90 },
            { fieldId: 'fld_remote', value: false },
            { fieldId: 'fld_dept', value: 'Eng' },
            { fieldId: 'fld_rating', value: 5 },
          ],
        },
      ]);

      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/analytics`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalResponses).toBe(2);
      expect(res.body.data.responsesInWindow).toBe(2);

      const fields = res.body.data.fields;

      // Text field
      expect(fields.fld_text.answered).toBe(2);
      expect(fields.fld_text.unanswered).toBe(0);

      // Number field
      expect(fields.fld_score.average).toBe(85);
      expect(fields.fld_score.min).toBe(80);
      expect(fields.fld_score.max).toBe(90);

      // Boolean field
      expect(fields.fld_remote.trueCount).toBe(1);
      expect(fields.fld_remote.falseCount).toBe(1);

      // Single select field
      expect(fields.fld_dept.optionCounts.Eng).toBe(2);
      expect(fields.fld_dept.optionCounts.HR).toBe(0);

      // Rating field
      expect(fields.fld_rating.average).toBe(4.5);
      expect(fields.fld_rating.distribution['4']).toBe(1);
      expect(fields.fld_rating.distribution['5']).toBe(1);
    });

    test('returns 404 when User B attempts to access User A form analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/analytics`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/forms/:id/analytics/trends', () => {
    test('returns 7 daily UTC points including zero-count days by default', async () => {
      await Response.create([
        { formId: formAId, answers: [], submittedAt: new Date() },
      ]);

      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/analytics/trends?range=7d`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.range).toBe('7d');
      expect(res.body.data.timezone).toBe('UTC');
      expect(res.body.data.points).toHaveLength(7);

      // Today's point has count 1
      const today = new Date().toISOString().slice(0, 10);
      const todayPoint = res.body.data.points.find((p) => p.date === today);
      expect(todayPoint).toBeDefined();
      expect(todayPoint.count).toBe(1);
    });

    test('returns 30 daily points when range=30d is requested', async () => {
      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/analytics/trends?range=30d`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.points).toHaveLength(30);
    });

    test('returns 404 when User B attempts to access User A trends', async () => {
      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/analytics/trends`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
