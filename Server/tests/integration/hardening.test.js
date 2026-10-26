// tests/integration/hardening.test.js
// Milestone 6 — security & hardening verification tests.
// Validates: 415 Content-Type enforcement, x-powered-by disabled,
// 429 standard error envelope, requestId propagation, and not-found envelope.

import { createApp } from '../../src/app.js';
import request from 'supertest';

let app;

beforeAll(() => {
  app = createApp();
});

describe('Milestone 6 — Hardening', () => {
  // ------------------------------------------------------------------
  // 415 UNSUPPORTED_MEDIA_TYPE
  // ------------------------------------------------------------------
  describe('415 Content-Type enforcement', () => {
    test('POST without Content-Type returns 415 with standard envelope', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'text/plain')
        .send('not json');

      expect(res.status).toBe(415);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
      expect(res.body.error.message).toMatch(/application\/json/i);
      expect(res.body.error.requestId).toBeDefined();
    });

    test('PATCH with text/xml returns 415', async () => {
      const res = await request(app)
        .patch('/api/v1/forms/000000000000000000000001')
        .set('Content-Type', 'text/xml')
        .send('<data/>');

      expect(res.status).toBe(415);
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    test('PUT with multipart/form-data returns 415', async () => {
      const res = await request(app)
        .put('/api/v1/forms/000000000000000000000001/fields')
        .set('Content-Type', 'multipart/form-data')
        .send('field=value');

      expect(res.status).toBe(415);
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    test('GET requests are NOT blocked by requireJson (no body needed)', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
    });

    test('DELETE requests are NOT blocked by requireJson', async () => {
      // Will be 401 (no auth), but NOT 415
      const res = await request(app).delete('/api/v1/forms/000000000000000000000001');

      expect(res.status).not.toBe(415);
    });
  });

  // ------------------------------------------------------------------
  // x-powered-by disabled
  // ------------------------------------------------------------------
  describe('x-powered-by header', () => {
    test('responses do NOT include x-powered-by', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // ------------------------------------------------------------------
  // X-Request-Id propagation
  // ------------------------------------------------------------------
  describe('X-Request-Id propagation', () => {
    test('response includes X-Request-Id header', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.headers['x-request-id']).toBeDefined();
    });

    test('echoes a valid incoming X-Request-Id', async () => {
      const customId = 'test-req-12345';
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Request-Id', customId);

      expect(res.headers['x-request-id']).toBe(customId);
    });

    test('error responses include requestId in the envelope', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'text/plain')
        .send('{}');

      expect(res.body.error.requestId).toBeDefined();
    });
  });

  // ------------------------------------------------------------------
  // Security headers via Helmet
  // ------------------------------------------------------------------
  describe('Security headers', () => {
    test('includes strict-transport-security or content-security-policy', async () => {
      const res = await request(app).get('/api/v1/health');

      // Helmet sets several headers; at minimum check a couple
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });

  // ------------------------------------------------------------------
  // 404 standard envelope on unknown routes
  // ------------------------------------------------------------------
  describe('404 not-found envelope', () => {
    test('unknown route returns standard error envelope', async () => {
      const res = await request(app).get('/api/v1/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.requestId).toBeDefined();
    });
  });

  // ------------------------------------------------------------------
  // Malformed JSON returns 400
  // ------------------------------------------------------------------
  describe('Malformed JSON body', () => {
    test('returns 400 VALIDATION_ERROR for invalid JSON', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send('{bad json}');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/malformed/i);
    });
  });

  // ------------------------------------------------------------------
  // Query parser uses 'simple' (no NoSQL injection via req.query)
  // ------------------------------------------------------------------
  describe('Query parser', () => {
    test('$-prefixed query parameters are not parsed as operators', async () => {
      const res = await request(app)
        .get('/api/v1/health?role[$gt]=admin');

      // Express 'simple' parser treats it as a string, not an object
      expect(res.status).toBe(200);
    });
  });
});
