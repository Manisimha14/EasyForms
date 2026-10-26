// tests/integration/publishing.test.js
// Integration tests for form publishing, unpublishing, idempotency,
// publication prerequisites, and cross-user authorization.

import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';

describe('Publishing endpoints (/api/v1/forms/:id/publish and /unpublish)', () => {
  let app;
  let userA;
  let userB;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  beforeEach(async () => {
    userA = await createTestUser({ email: 'userA_pub@example.com' });
    userB = await createTestUser({ email: 'userB_pub@example.com' });
  });

  afterEach(async () => {
    await cleanTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/v1/forms/:id/publish', () => {
    test('returns 422 BUSINESS_RULE_VIOLATION when form has no fields', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Empty Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.some((d) => d.path === 'fields')).toBe(true);
    });

    test('publishes a valid form, sets publishedAt, generates publicPath, and returns 200', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Customer Feedback Survey' });

      const formId = createRes.body.data.id;

      // Add a valid field
      await request(app)
        .put(`/api/v1/forms/${formId}/fields`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          fields: [
            { label: 'How was your experience?', type: 'short_text', order: 0 },
          ],
        });

      const res = await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(formId);
      expect(res.body.data.status).toBe('published');
      expect(res.body.data.slug).toBeDefined();
      expect(res.body.data.publicPath).toBe(`/f/${res.body.data.slug}`);
      expect(res.body.data.publishedAt).toBeDefined();

      const publishedAtFirst = res.body.data.publishedAt;

      // Idempotency: publishing again returns 200 and preserves publishedAt
      const idempotentRes = await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(idempotentRes.status).toBe(200);
      expect(idempotentRes.body.data.publishedAt).toBe(publishedAtFirst);
    });

    test('returns 404 NOT_FOUND when User B attempts to publish User A form', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Private Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/forms/:id/unpublish', () => {
    test('unpublishes a published form back to draft status', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Active Form' });

      const formId = createRes.body.data.id;

      await request(app)
        .put(`/api/v1/forms/${formId}/fields`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          fields: [{ label: 'Question 1', type: 'short_text', order: 0 }],
        });

      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/forms/${formId}/unpublish`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('draft');

      // Idempotent: unpublishing a draft returns 200
      const secondRes = await request(app)
        .post(`/api/v1/forms/${formId}/unpublish`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.data.status).toBe('draft');
    });

    test('returns 404 when User B attempts to unpublish User A form', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'User A Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/v1/forms/${formId}/unpublish`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
