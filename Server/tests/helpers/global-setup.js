// tests/helpers/global-setup.js
// Starts an in-memory MongoDB server before all tests.
// The URI is passed via an environment variable file or shared state.

import { MongoMemoryServer } from 'mongodb-memory-server';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Store the instance for teardown
  globalThis.__MONGOD__ = mongod;

  // Write the URI to a temp file so test workers can read it
  // (globalThis is not shared between globalSetup and test workers in Jest)
  const envFile = join(__dirname, '.test-env.json');
  writeFileSync(envFile, JSON.stringify({ MONGODB_URI: uri }));
}
