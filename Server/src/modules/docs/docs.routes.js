// src/modules/docs/docs.routes.js
// Mounts the Scalar API Reference UI and provides OpenAPI 3.1 specification endpoints.

import { Router } from 'express';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { apiReference } from '@scalar/express-api-reference';
import { env } from '../../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Robust path resolution relative to this file — works in dev, production, and containerized deployments
export const OPENAPI_YAML_PATH = resolve(__dirname, '../../../docs/openapi.yaml');

/**
 * Loads and parses the OpenAPI 3.1 YAML document, configuring servers for the active environment.
 * @returns {object} Parsed OpenAPI document
 */
export function getOpenApiDocument() {
  const fileContent = readFileSync(OPENAPI_YAML_PATH, 'utf8');
  const spec = yaml.load(fileContent);

  // Configure server URL dynamically to match current port and environment
  const localUrl = `http://localhost:${env.PORT}/api/v1`;
  const relativeUrl = '/api/v1';

  const existingServers = spec.servers || [];
  const serverUrls = existingServers.map((s) => s.url);
  const servers = [];

  // 1. Current environment relative URL
  if (!serverUrls.includes(relativeUrl)) {
    servers.push({ url: relativeUrl, description: 'Current environment' });
  } else {
    const existing = existingServers.find((s) => s.url === relativeUrl);
    servers.push(existing);
  }

  // 2. Active local port
  if (!serverUrls.includes(localUrl)) {
    servers.push({ url: localUrl, description: 'Local development' });
  }

  // 3. Keep remaining configured servers (e.g. production)
  for (const server of existingServers) {
    if (server.url !== relativeUrl && server.url !== localUrl) {
      servers.push(server);
    }
  }

  spec.servers = servers.length > 0 ? servers : [{ url: relativeUrl, description: 'Current environment' }];
  return spec;
}

const router = Router();

// Serve the raw OpenAPI YAML file
router.get('/openapi.yaml', (_req, res) => {
  res.type('text/yaml').send(readFileSync(OPENAPI_YAML_PATH, 'utf8'));
});

// Serve the raw OpenAPI JSON specification
router.get('/openapi.json', (_req, res) => {
  res.json(getOpenApiDocument());
});

// Serve the interactive Scalar API Reference documentation UI
router.get('/', (req, res, next) => {
  const spec = getOpenApiDocument();
  const scalarHandler = apiReference({
    pageTitle: 'Easy Forms API',
    spec: {
      content: spec,
    },
    theme: 'saturn',
    darkMode: true,
  });

  return scalarHandler(req, res, next);
});

export { router as docsRoutes };
