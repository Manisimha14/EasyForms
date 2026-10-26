// tests/unit/tokens.test.js
// Unit tests for token generation, verification, and algorithm security.

import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../src/utils/tokens.js';

describe('Token utilities', () => {
  const testUserId = '64f1a2b3c4d5e6f7a8b9c0d1';

  test('generateAccessToken creates a valid JWT containing sub claim', () => {
    const token = generateAccessToken(testUserId);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(testUserId);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });

  test('verifyAccessToken rejects tokens with invalid signature', () => {
    const forgedToken = jwt.sign(
      { sub: testUserId },
      'wrong-secret-key-at-least-32-characters-long',
      { algorithm: 'HS256' }
    );

    expect(() => verifyAccessToken(forgedToken)).toThrow();
  });

  test('verifyAccessToken rejects alg: none tokens', () => {
    const noneToken = jwt.sign({ sub: testUserId }, '', { algorithm: 'none' });

    expect(() => verifyAccessToken(noneToken)).toThrow();
  });

  test('generateRefreshToken generates unique URL-safe base64 strings', () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();

    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(40);
    // Base64url contains no +, /, or =
    expect(token1).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('hashToken produces consistent SHA-256 hex digests', () => {
    const token = 'sample-refresh-token';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
