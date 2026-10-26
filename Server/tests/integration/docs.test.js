// tests/integration/docs.test.js
// Tests for Scalar API Reference and OpenAPI documentation endpoints (/api-docs).

import request from 'supertest';
import { setupTestDB, teardownTestDB } from '../helpers/setup.js';

describe('Scalar API Reference endpoints (/api-docs)', () => {
  let app;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  test('GET /api-docs renders HTML with Scalar API Reference and title "Easy Forms API"', async () => {
    const res = await request(app)
      .get('/api-docs')
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>Easy Forms API</title>');
    expect(res.text).toContain('@scalar/api-reference');
    expect(res.text).toContain('/api/v1');

    // Confirm Helmet Content Security Policy allows Scalar CDN
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain('cdn.jsdelivr.net');
  });

  test('GET /api-docs/ also resolves and renders HTML documentation', async () => {
    const res = await request(app)
      .get('/api-docs/')
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>Easy Forms API</title>');
  });

  test('GET /api-docs/openapi.json serves the parsed OpenAPI 3.1 specification', async () => {
    const res = await request(app)
      .get('/api-docs/openapi.json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.info.title).toBe('Easy Forms API');
    expect(res.body.paths).toHaveProperty('/health');
    expect(res.body.paths).toHaveProperty('/auth/login');
    expect(res.body.paths).toHaveProperty('/forms');
    expect(res.body.paths).toHaveProperty('/public/forms/{slug}');
    expect(res.body.components.schemas).toHaveProperty('Form');
    expect(res.body.components.schemas).toHaveProperty('Field');
  });

  test('GET /api-docs/openapi.yaml serves the raw OpenAPI YAML file', async () => {
    const res = await request(app)
      .get('/api-docs/openapi.yaml')
      .expect(200);

    expect(res.headers['content-type']).toMatch(/yaml/);
    expect(res.text).toContain("openapi: '3.1.0'");
    expect(res.text).toContain('title: Easy Forms API');
  });

  test('GET /api-docs does not interfere with /api/v1 endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});
