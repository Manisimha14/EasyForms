// tests/helpers/global-teardown.js
// Stops the in-memory MongoDB server after all tests.

import { unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function globalTeardown() {
  if (globalThis.__MONGOD__) {
    await globalThis.__MONGOD__.stop();
  }

  // Clean up the temp env file
  try {
    unlinkSync(join(__dirname, '.test-env.json'));
  } catch {
    // Ignore if it doesn't exist
  }
}
