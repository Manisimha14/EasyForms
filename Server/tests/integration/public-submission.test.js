// tests/integration/public-submission.test.js
// Integration tests for public form retrieval, Cache-Control,
// respondent submission processing, and unpublish submission blocking.

import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';
import { Response } from '../../src/models/response.model.js';

describe('Public Form Retrieval and Submission (/api/v1/public)', () => {
  let app;
  let owner;
  let formId;
  let formSlug;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  beforeEach(async () => {
    owner = await createTestUser({ email: 'owner_pubsub@example.com' });

    // Create a form
    const createRes = await request(app)
      .post('/api/v1/forms')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Product Satisfaction Survey',
        description: 'Please give us your thoughts.',
      });

    formId = createRes.body.data.id;
    formSlug = createRes.body.data.slug;

    // Add fields
    await request(app)
      .put(`/api/v1/forms/${formId}/fields`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set('If-Match', '"1"')
      .send({
        fields: [
          {
            id: 'fld_name',
            label: 'Your Name',
            type: 'short_text',
            required: true,
            order: 0,
          },
          {
            id: 'fld_rating',
            label: 'Rating',
            type: 'rating',
            required: true,
            order: 1,
            validation: { min: 1, max: 5 },
          },
          {
            id: 'fld_subscribe',
            label: 'Subscribe to newsletter?',
            type: 'yes_no',
            required: false,
            order: 2,
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

  describe('GET /api/v1/public/forms/:slug', () => {
    test('returns 404 NOT_FOUND when form is still in draft status', async () => {
      const res = await request(app).get(`/api/v1/public/forms/${formSlug}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('returns 404 NOT_FOUND for a completely unknown slug', async () => {
      const res = await request(app).get('/api/v1/public/forms/abcdef0123');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('returns respondent-safe data and Cache-Control: no-store when published', async () => {
      // Publish the form
      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app).get(`/api/v1/public/forms/${formSlug}`);

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');

      const data = res.body.data;
      expect(data.title).toBe('Product Satisfaction Survey');
      expect(data.description).toBe('Please give us your thoughts.');
      expect(data.fields).toHaveLength(3);
      expect(data.theme).toBeDefined();

      // Ensure internal data is NEVER leaked
      expect(data.ownerId).toBeUndefined();
      expect(data._id).toBeUndefined();
      expect(data.status).toBeUndefined();
      expect(data.visibility).toBeUndefined();
      expect(data.revision).toBeUndefined();
      expect(data.createdAt).toBeUndefined();
      expect(data.updatedAt).toBeUndefined();
      expect(data.responseCount).toBeUndefined();
    });
  });

  describe('POST /api/v1/public/forms/:slug/responses', () => {
    test('returns 404 when submitting to a draft (unpublished) form', async () => {
      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({
          answers: [
            { fieldId: 'fld_name', value: 'Anonymous' },
            { fieldId: 'fld_rating', value: 5 },
          ],
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('accepts valid submission, persists response, and returns 201 with id and submittedAt', async () => {
      // Publish the form first
      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({
          answers: [
            { fieldId: 'fld_name', value: 'Charlie Brown' },
            { fieldId: 'fld_rating', value: 4 },
            { fieldId: 'fld_subscribe', value: true },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.submittedAt).toBeDefined();

      // Verify persisted in database
      const saved = await Response.findById(res.body.data.id);
      expect(saved).not.toBeNull();
      expect(saved.answers).toHaveLength(3);
    });

    test('rejects submissions with unknown field IDs with 400 VALIDATION_ERROR', async () => {
      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({
          answers: [
            { fieldId: 'fld_name', value: 'Alice' },
            { fieldId: 'fld_rating', value: 5 },
            { fieldId: 'fld_fake_field', value: 'Hacked' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects submissions with missing required fields with 400 VALIDATION_ERROR', async () => {
      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({
          answers: [
            { fieldId: 'fld_name', value: 'Alice' },
            // fld_rating is required but missing
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects type-coerced answers (e.g. string for rating) with 400 VALIDATION_ERROR', async () => {
      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({
          answers: [
            { fieldId: 'fld_name', value: 'Alice' },
            { fieldId: 'fld_rating', value: '5' }, // string "5" instead of number 5
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('unpublishing immediately blocks new submissions with 404 NOT_FOUND', async () => {
      // Publish
      await request(app)
        .post(`/api/v1/forms/${formId}/publish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      // Unpublish
      await request(app)
        .post(`/api/v1/forms/${formId}/unpublish`)
        .set('Authorization', `Bearer ${owner.accessToken}`);

      const res = await request(app)
        .post(`/api/v1/public/forms/${formSlug}/responses`)
        .send({
          answers: [
            { fieldId: 'fld_name', value: 'Late Submitter' },
            { fieldId: 'fld_rating', value: 3 },
          ],
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
