// tests/integration/responses.test.js
// Integration tests for response listing, pagination, single response retrieval,
// single response deletion, CSV export, and cross-user authorization.

import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';
import { Response } from '../../src/models/response.model.js';

describe('Responses endpoints (/api/v1/forms/:id/responses)', () => {
  let app;
  let userA;
  let userB;
  let formAId;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  beforeEach(async () => {
    userA = await createTestUser({ email: 'userA_resp@example.com' });
    userB = await createTestUser({ email: 'userB_resp@example.com' });

    // User A creates a form with multiple question types
    const createRes = await request(app)
      .post('/api/v1/forms')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ title: 'Event Feedback' });

    formAId = createRes.body.data.id;

    await request(app)
      .put(`/api/v1/forms/${formAId}/fields`)
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .set('If-Match', '"1"')
      .send({
        fields: [
          { id: 'fld_name', label: 'Full Name', type: 'short_text', order: 0 },
          { id: 'fld_score', label: 'Satisfaction', type: 'number', order: 1 },
          { id: 'fld_tags', label: 'Interests', type: 'multi_select', options: ['Tech', 'Design', 'Biz'], order: 2 },
        ],
      });
  });

  afterEach(async () => {
    await cleanTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/v1/forms/:id/responses', () => {
    test('returns paginated responses list for the owner', async () => {
      // Seed 3 responses
      await Response.create([
        { formId: formAId, answers: [{ fieldId: 'fld_name', value: 'Alice' }], submittedAt: new Date('2026-10-01T10:00:00Z') },
        { formId: formAId, answers: [{ fieldId: 'fld_name', value: 'Bob' }], submittedAt: new Date('2026-10-02T10:00:00Z') },
        { formId: formAId, answers: [{ fieldId: 'fld_name', value: 'Charlie' }], submittedAt: new Date('2026-10-03T10:00:00Z') },
      ]);

      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/responses?page=1&limit=2`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.totalPages).toBe(2);
      expect(res.body.pagination.page).toBe(1);
    });

    test('supports sort parameter alias for order', async () => {
      await Response.create([
        { formId: formAId, answers: [{ fieldId: 'fld_name', value: 'Alice' }], submittedAt: new Date('2026-10-01T10:00:00Z') },
        { formId: formAId, answers: [{ fieldId: 'fld_name', value: 'Bob' }], submittedAt: new Date('2026-10-02T10:00:00Z') },
      ]);

      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/responses?page=1&limit=10&sort=asc`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].answers[0].value).toBe('Alice');
    });

    test('filters responses by date range', async () => {
      await Response.create([
        { formId: formAId, answers: [{ fieldId: 'fld_name', value: 'Early' }], submittedAt: new Date('2026-09-01T10:00:00Z') },
        { formId: formAId, answers: [{ fieldId: 'fld_name', value: 'Target' }], submittedAt: new Date('2026-10-15T10:00:00Z') },
        { formId: formAId, answers: [{ fieldId: 'fld_name', value: 'Late' }], submittedAt: new Date('2026-11-01T10:00:00Z') },
      ]);

      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/responses?startDate=2026-10-01&endDate=2026-10-31`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].answers[0].value).toBe('Target');
    });

    test('returns 404 NOT_FOUND when User B attempts to list User A responses', async () => {
      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/responses`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/forms/:id/responses/:responseId', () => {
    test('returns single response for the owner', async () => {
      const response = await Response.create({
        formId: formAId,
        answers: [{ fieldId: 'fld_name', value: 'Alice' }],
      });

      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/responses/${response._id}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(response._id.toString());
      expect(res.body.data.answers[0].value).toBe('Alice');
    });

    test('returns 404 when User B attempts to get User A response', async () => {
      const response = await Response.create({
        formId: formAId,
        answers: [{ fieldId: 'fld_name', value: 'Alice' }],
      });

      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/responses/${response._id}`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/forms/:id/responses/:responseId', () => {
    test('deletes individual response, returning 204', async () => {
      const response = await Response.create({
        formId: formAId,
        answers: [{ fieldId: 'fld_name', value: 'To Delete' }],
      });

      const res = await request(app)
        .delete(`/api/v1/forms/${formAId}/responses/${response._id}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(204);

      // Verify gone
      const check = await Response.findById(response._id);
      expect(check).toBeNull();
    });

    test('returns 404 when User B attempts to delete User A response', async () => {
      const response = await Response.create({
        formId: formAId,
        answers: [{ fieldId: 'fld_name', value: 'Protected' }],
      });

      const res = await request(app)
        .delete(`/api/v1/forms/${formAId}/responses/${response._id}`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/forms/:id/responses/export', () => {
    test('exports responses as CSV with formula protection and correct headers', async () => {
      await Response.create([
        {
          formId: formAId,
          submittedAt: new Date('2026-10-25T10:00:00.000Z'),
          answers: [
            { fieldId: 'fld_name', value: '=SUM(1+1)' }, // formula trigger
            { fieldId: 'fld_score', value: 95 },
            { fieldId: 'fld_tags', value: ['Tech', 'Design'] },
          ],
        },
      ]);

      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/responses/export`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(res.headers['content-disposition']).toMatch(/attachment; filename="event-feedback-responses-.*\.csv"/);

      const lines = res.text.split('\r\n');
      expect(lines[0]).toBe('Submitted At,Full Name,Satisfaction,Interests');
      // Verify formula trigger is escaped with leading single quote (')
      // and multi_select is joined with " ;  "
      expect(lines[1]).toContain("'=SUM(1+1)");
      expect(lines[1]).toContain('Tech ;  Design');
      expect(lines[1]).toContain('95');
    });

    test('returns 404 when User B attempts to export User A responses', async () => {
      const res = await request(app)
        .get(`/api/v1/forms/${formAId}/responses/export`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
