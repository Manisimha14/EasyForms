// tests/integration/fields-and-theme.test.js
// Integration tests for full field list replacement (PUT /forms/:id/fields),
// theme updates (PUT /forms/:id/theme), ETag / If-Match revision checks,
// and response change warnings.

import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';
import { Response } from '../../src/models/response.model.js';

describe('Fields and Themes endpoints', () => {
  let app;
  let userA;
  let userB;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  beforeEach(async () => {
    userA = await createTestUser({ email: 'userA_ft@example.com' });
    userB = await createTestUser({ email: 'userB_ft@example.com' });
  });

  afterEach(async () => {
    await cleanTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('PUT /api/v1/forms/:id/fields', () => {
    test('requires If-Match header and returns 428 PRECONDITION_REQUIRED when missing', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Survey Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/forms/${formId}/fields`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({
          fields: [
            { label: 'Your Name', type: 'short_text', order: 0 },
          ],
        });

      expect(res.status).toBe(428);
      expect(res.body.error.code).toBe('PRECONDITION_REQUIRED');
    });

    test('returns 412 PRECONDITION_FAILED when If-Match revision is stale', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Survey Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/forms/${formId}/fields`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"99"')
        .send({
          fields: [
            { label: 'Your Name', type: 'short_text', order: 0 },
          ],
        });

      expect(res.status).toBe(412);
      expect(res.body.error.code).toBe('PRECONDITION_FAILED');
      expect(res.body.error.details).toBeDefined();
    });

    test('replaces fields, normalizes ordering, assigns fld_ IDs, and increments revision with new ETag', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Survey Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/forms/${formId}/fields`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          fields: [
            {
              // Custom supplied ID
              id: 'custom_full_name',
              label: 'Full Name',
              type: 'short_text',
              required: true,
              order: 5,
            },
            {
              // Omitted ID (server must generate fld_...)
              label: 'Satisfaction Rating',
              type: 'rating',
              required: true,
              order: 2,
              validation: { min: 1, max: 5 },
            },
            {
              label: 'Department',
              type: 'single_select',
              options: ['Engineering', 'Design', 'Sales'],
              order: 8,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fields).toHaveLength(3);
      expect(res.body.data.revision).toBe(2);
      expect(res.headers.etag).toBe('"2"');

      // Verify ordering was normalized to 0, 1, 2 based on input order (2, 5, 8)
      const fields = res.body.data.fields;
      expect(fields[0].label).toBe('Satisfaction Rating');
      expect(fields[0].order).toBe(0);
      expect(fields[0].id).toMatch(/^fld_[A-Za-z0-9_-]{8}$/);

      expect(fields[1].label).toBe('Full Name');
      expect(fields[1].order).toBe(1);
      expect(fields[1].id).toBe('custom_full_name');

      expect(fields[2].label).toBe('Department');
      expect(fields[2].order).toBe(2);
      expect(fields[2].options).toEqual(['Engineering', 'Design', 'Sales']);
    });

    test('returns warnings when existing responses had answers for removed fields or fields that changed type', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Survey Form' });

      const formId = createRes.body.data.id;

      // Add initial fields
      const putRes = await request(app)
        .put(`/api/v1/forms/${formId}/fields`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          fields: [
            { id: 'fld_q1', label: 'Age', type: 'number', order: 0 },
            { id: 'fld_q2', label: 'Comment', type: 'short_text', order: 1 },
          ],
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.revision).toBe(2);

      // Simulate an existing response answering fld_q1 and fld_q2
      await Response.create({
        formId,
        answers: [
          { fieldId: 'fld_q1', value: 25 },
          { fieldId: 'fld_q2', value: 'Great experience' },
        ],
      });

      // Replace fields: remove fld_q2 and change fld_q1 type from number to short_text
      const updateRes = await request(app)
        .put(`/api/v1/forms/${formId}/fields`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"2"')
        .send({
          fields: [
            { id: 'fld_q1', label: 'Age as text', type: 'short_text', order: 0 },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.warnings).toBeDefined();
      expect(updateRes.body.warnings.length).toBe(2);
      // Warning for removed field
      expect(updateRes.body.warnings.some((w) => w.includes('fld_q2') && w.includes('removed'))).toBe(true);
      // Warning for changed type
      expect(updateRes.body.warnings.some((w) => w.includes('fld_q1') && w.includes('changed from'))).toBe(true);
    });

    test('returns 404 when User B tries to replace fields on User A form', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'User A Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/forms/${formId}/fields`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          fields: [{ label: 'Hijack', type: 'short_text', order: 0 }],
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/forms/:id/theme', () => {
    test('requires If-Match header and returns 428 PRECONDITION_REQUIRED when missing', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Theme Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/forms/${formId}/theme`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({
          name: 'Midnight',
          primaryColor: '#6366F1',
          backgroundColor: '#0F172A',
          fontFamily: 'Inter',
        });

      expect(res.status).toBe(428);
      expect(res.body.error.code).toBe('PRECONDITION_REQUIRED');
    });

    test('updates theme successfully and increments revision with new ETag', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Theme Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/forms/${formId}/theme`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          name: 'Modern Purple',
          primaryColor: '#7C3AED',
          backgroundColor: '#F9FAFB',
          fontFamily: 'Poppins',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Modern Purple');
      expect(res.body.data.primaryColor).toBe('#7C3AED');
      expect(res.body.data.backgroundColor).toBe('#F9FAFB');
      expect(res.body.data.fontFamily).toBe('Poppins');
      expect(res.headers.etag).toBe('"2"');
    });

    test('rejects invalid color hex code with 400 VALIDATION_ERROR', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Theme Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/forms/${formId}/theme`)
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          name: 'Bad Theme',
          primaryColor: '#ZZZZZZ',
          backgroundColor: '#FFFFFF',
          fontFamily: 'Inter',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 404 when User B tries to update User A theme', async () => {
      const createRes = await request(app)
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ title: 'Theme Form' });

      const formId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/forms/${formId}/theme`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .set('If-Match', '"1"')
        .send({
          name: 'Hacked Theme',
          primaryColor: '#000000',
          backgroundColor: '#FFFFFF',
          fontFamily: 'Inter',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
