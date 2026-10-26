// tests/integration/auth.test.js
// Integration tests for email-and-password authentication, session management,
// token rotation, and account deletion.

import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, createTestUser } from '../helpers/setup.js';
import { User } from '../../src/models/user.model.js';
import { RefreshToken } from '../../src/models/refresh-token.model.js';

describe('Authentication endpoints (/api/v1/auth)', () => {
  let app;

  beforeAll(async () => {
    app = await setupTestDB();
  });

  afterEach(async () => {
    await cleanTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/v1/auth/register', () => {
    test('registers a new user successfully and returns token pair', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'alex@example.com',
          password: 'SecurePassword123',
          name: 'Alex Johnson',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.email).toBe('alex@example.com');
      expect(res.body.data.user.name).toBe('Alex Johnson');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.accessTokenExpiresInSeconds).toBe(900);
    });

    test('returns 409 CONFLICT when email is already registered', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'AnotherPassword123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    test('rejects passwords that match email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser123@example.com',
          password: 'testuser123@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects passwords in common passwords denylist', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'common@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects requests with unknown extra properties', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'clean@example.com',
          password: 'ValidPassword123',
          role: 'admin',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('logs in successfully with valid credentials', async () => {
      await createTestUser({
        email: 'user@example.com',
        password: 'ValidPassword123',
        name: 'User',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'ValidPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('user@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    test('returns 401 INVALID_CREDENTIALS for wrong password', async () => {
      await createTestUser({
        email: 'user@example.com',
        password: 'ValidPassword123',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('returns 401 INVALID_CREDENTIALS for unknown email (constant timing defense)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    test('rotates refresh token and returns new token pair', async () => {
      const { refreshToken: oldRefreshToken } = await createTestUser();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(oldRefreshToken);

      // Verify old refresh token is marked revoked
      const secondAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      // Reuse detection triggers 401
      expect(secondAttempt.status).toBe(401);
      expect(secondAttempt.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('rejects unknown refresh token with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'fake-refresh-token-that-does-not-exist' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('revokes the provided refresh token and returns 204', async () => {
      const { refreshToken } = await createTestUser();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(204);

      // Refreshing with this token should now fail
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });

    test('returns 204 even if refresh token does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'nonexistent-token' });

      expect(res.status).toBe(204);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('returns current user profile with valid Bearer token', async () => {
      const { accessToken, user } = await createTestUser({ name: 'Sam Taylor' });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.name).toBe('Sam Taylor');
      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    test('returns 401 UNAUTHORIZED when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('returns 401 UNAUTHORIZED when token is malformed', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PATCH /api/v1/auth/me', () => {
    test('updates name successfully', async () => {
      const { accessToken } = await createTestUser({ name: 'Original Name' });

      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    test('rejects attempts to update other fields like email or password', async () => {
      const { accessToken } = await createTestUser();

      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'newemail@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    test('changes password successfully and revokes previous refresh tokens', async () => {
      const { accessToken, refreshToken, email } = await createTestUser({
        password: 'OldPassword123',
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'BrandNewPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Old refresh token must be revoked
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);

      // Can log in with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'BrandNewPassword123',
        });

      expect(loginRes.status).toBe(200);
    });

    test('returns 401 when current password is wrong', async () => {
      const { accessToken } = await createTestUser({
        password: 'RealPassword123',
      });

      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongCurrentPassword123',
          newPassword: 'BrandNewPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('DELETE /api/v1/auth/me', () => {
    test('returns 401 when password confirmation is incorrect', async () => {
      const { accessToken } = await createTestUser({ password: 'MyPassword123' });

      const res = await request(app)
        .delete('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'WrongPassword123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('permanently deletes user account, tokens, and data when password is correct', async () => {
      const { accessToken, user, password } = await createTestUser({
        password: 'MyPassword123',
      });

      const res = await request(app)
        .delete('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password });

      expect(res.status).toBe(204);

      // Verify user no longer exists in database
      const userInDb = await User.findById(user.id);
      expect(userInDb).toBeNull();

      // Verify refresh tokens are deleted
      const tokensInDb = await RefreshToken.find({ userId: user.id });
      expect(tokensInDb).toHaveLength(0);
    });
  });

  describe('POST /api/v1/auth/test-email', () => {
    test('sends a test email for authenticated user', async () => {
      const { accessToken, user } = await createTestUser();

      const res = await request(app)
        .post('/api/v1/auth/test-email')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sent).toBe(true);
      expect(res.body.data.to).toBe(user.email);
    });

    test('rejects unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/v1/auth/test-email');
      expect(res.status).toBe(401);
    });
  });
});
