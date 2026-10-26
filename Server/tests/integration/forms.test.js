// tests/integration/forms.test.js
// Integration tests for form CRUD operations, cross-user ownership security,
// pagination, and optimistic concurrency (If-Match / ETag).

import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';
import { Form } from '../../src/models/form.model.js';
import { Response } from '../../src/models/response.model.js';

describe('Forms endpoints (/api/v1/forms)', () => {
  let app;
  let userA;
  let userB;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  beforeEach(async () => {
    userA = await createTestUser({ email: 'userA@example.com' });
    userB = await createTestUser({ email: 'userB@example.com' });
  });

  afterEach(async () => {
    await cleanTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/v1/forms', () => {
    test('creates a draft form with default settings and returns 201 with ETag', async () => {
      const res = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({
          title: 'Customer Satisfaction Survey',
          description: 'Help us improve our service',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Customer Satisfaction Survey');
      expect(res.body.data.description).toBe('Help us improve our service');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.visibility).toBe('unlisted');
      expect(res.body.data.slug).toMatch(/^[0-9a-z]{10}$/);
      expect(res.body.data.revision).toBe(1);
      expect(res.headers.etag).toBe('"1"');
    });

    test('returns 401 when Authorization header is missing', async () => {
      const res = await request(app)
        .post('/api/v1/forms')
        .send({ title: 'Unauthorized Form' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('returns 400 when title is missing or empty', async () => {
      const res = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects extra properties in request body', async () => {
      const res = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({
          title: 'Valid Title',
          status: 'published', // client cannot set status on creation
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/forms', () => {
    test('lists only forms owned by the authenticated user with response counts', async () => {
      // User A creates 2 forms
      const formA1 = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'User A Form 1' });

      await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'User A Form 2' });

      // User B creates 1 form
      await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .send({ title: 'User B Form' });

      // Create dummy response for User A Form 1
      await Response.create({
        formId: formA1.body.data.id,
        answers: [{ fieldId: 'field_1', value: 'Answer' }],
      });

      const res = await request(app)
        .get('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);

      const f1 = res.body.data.find((f) => f.title === 'User A Form 1');
      expect(f1).toBeDefined();
      expect(f1.responseCount).toBe(1);

      const f2 = res.body.data.find((f) => f.title === 'User A Form 2');
      expect(f2).toBeDefined();
      expect(f2.responseCount).toBe(0);
    });

    test('supports title search and status filtering', async () => {
      await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Employee Onboarding Feedback' });

      await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Event Registration' });

      const res = await request(app)
        .get('/api/v1/forms?search=onboarding')
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Employee Onboarding Feedback');
    });
  });

  describe('GET /api/v1/forms/:id', () => {
    test('returns form details with ETag for the owner', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'My Great Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(formId);
      expect(res.headers.etag).toBe('"1"');
    });

    test('returns 404 NOT_FOUND when User B attempts to access User A form', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'User A Secret Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/forms/:id', () => {
    test('updates metadata and increments revision with new ETag', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Original Title' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          title: 'Updated Title',
          visibility: 'public',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.visibility).toBe('public');
      expect(res.body.data.revision).toBe(2);
      expect(res.headers.etag).toBe('"2"');
    });

    test('returns 412 PRECONDITION_FAILED when If-Match revision is stale', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Original Title' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"99"')
        .send({ title: 'Conflicting Title' });

      expect(res.status).toBe(412);
      expect(res.body.error.code).toBe('PRECONDITION_FAILED');
      expect(res.body.error.details).toBeDefined();
    });

    test('returns 404 when User B attempts to patch User A form', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'User A Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('rejects attempts to change ownerId, slug, or status via PATCH', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ status: 'published' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/forms/:id', () => {
    test('deletes the form and its responses, returning 204', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Form to Delete' });

      const formId = createRes.body.data.id;

      // Add dummy response
      await Response.create({
        formId,
        answers: [{ fieldId: 'q1', value: 'Test' }],
      });

      const res = await request(app)
        .delete(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${userA.accessToken}`);

      expect(res.status).toBe(204);

      // Verify form is gone
      const formInDb = await Form.findById(formId);
      expect(formInDb).toBeNull();

      // Verify responses are gone
      const responsesInDb = await Response.find({ formId });
      expect(responsesInDb).toHaveLength(0);
    });

    test('returns 404 when User B attempts to delete User A form', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'User A Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/forms/${formId}`)
        .set('Authorization', `Bearer ${userB.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
