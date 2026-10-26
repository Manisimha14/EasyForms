// tests/integration/health.test.js
// Tests for the health and readiness endpoints.

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { setupTestDB, teardownTestDB } from '../helpers/setup.js';

let app;

beforeAll(async () => {
  app = await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok, version and uptimeSeconds', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).toHaveProperty('version');
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
  });

  it('returns X-Request-Id header', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('reuses a valid incoming X-Request-Id', async () => {
    const customId = 'my-custom-request-id-123';
    const res = await request(app)
      .get('/api/v1/health')
      .set('X-Request-Id', customId);

    expect(res.headers['x-request-id']).toBe(customId);
  });
});

describe('GET /api/v1/health/ready', () => {
  it('returns 200 with status ready when the database is connected', async () => {
    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ready');
    expect(res.body.data).toHaveProperty('version');
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
  });
});

describe('Unknown routes', () => {
  it('returns 404 with standard error envelope for unknown GET route', async () => {
    const res = await request(app).get('/api/v1/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for a completely unknown path', async () => {
    const res = await request(app).get('/this-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Error handling', () => {
  it('returns 404 with standard envelope for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    // Express will return 400 for malformed JSON body
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Security headers', () => {
  it('does not expose X-Powered-By', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets helmet security headers', async () => {
    const res = await request(app).get('/api/v1/health');

    // Helmet sets various headers; check a few
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});
