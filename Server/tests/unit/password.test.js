// tests/unit/password.test.js
// Unit tests for password hashing and timing comparison helpers.

import {
  hashPassword,
  comparePassword,
  dummyComparePassword,
} from '../../src/utils/password.js';

describe('Password utilities', () => {
  const plainPassword = 'CorrectHorseBatteryStaple123';

  test('hashPassword generates valid bcrypt hash and comparePassword verifies it', async () => {
    const hash = await hashPassword(plainPassword);

    expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
    const matches = await comparePassword(plainPassword, hash);
    expect(matches).toBe(true);

    const wrongMatches = await comparePassword('WrongPassword123', hash);
    expect(wrongMatches).toBe(false);
  });

  test('dummyComparePassword executes bcrypt comparison and returns false', async () => {
    const result = await dummyComparePassword('some-random-password');
    expect(result).toBe(false);
  });
});
