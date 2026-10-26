// src/modules/auth/auth.service.js
// Business logic for user registration, authentication, token management,
// password updates, and account deletion.

import { env } from '../../config/env.js';
import { User } from '../../models/user.model.js';
import { RefreshToken } from '../../models/refresh-token.model.js';
import { Form } from '../../models/form.model.js';
import { Response } from '../../models/response.model.js';
import {
  ConflictError,
  InvalidCredentialsError,
  NotFoundError,
} from '../../utils/app-error.js';
import {
  hashPassword,
  comparePassword,
  dummyComparePassword,
} from '../../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../utils/tokens.js';

// Access token lifetime in seconds (15 minutes = 900 seconds)
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 900;

/**
 * Register a new user and generate initial tokens.
 * @param {{ email: string, password: string, name?: string }} data
 */
export async function register({ email, password, name }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    name: name || '',
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
    accessTokenExpiresInSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  };
}

/**
 * Authenticate user credentials and return a token pair.
 * Executes dummy comparison if user is not found to prevent timing-based user enumeration.
 * @param {{ email: string, password: string }} data
 */
export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    await dummyComparePassword(password);
    throw new InvalidCredentialsError('Invalid email or password.');
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new InvalidCredentialsError('Invalid email or password.');
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
    accessTokenExpiresInSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  };
}

/**
 * Exchange a valid refresh token for a new token pair (refresh token rotation).
 * If a revoked token is reused, all refresh tokens for that user are revoked.
 * @param {{ refreshToken: string }} data
 */
export async function refresh({ refreshToken }) {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) {
    throw new InvalidCredentialsError('Invalid or expired refresh token.');
  }

  // Reuse detection: token was already revoked
  if (storedToken.revokedAt) {
    await RefreshToken.updateMany(
      { userId: storedToken.userId, revokedAt: null },
      { revokedAt: new Date() }
    );
    throw new InvalidCredentialsError('Invalid or expired refresh token.');
  }

  // Expiration check
  if (new Date(storedToken.expiresAt) < new Date()) {
    throw new InvalidCredentialsError('Refresh token has expired.');
  }

  // Revoke the old token (rotation)
  storedToken.revokedAt = new Date();
  await storedToken.save();

  const user = await User.findById(storedToken.userId);
  if (!user) {
    throw new InvalidCredentialsError('User account not found.');
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: newTokenHash,
    expiresAt,
  });

  return {
    user: user.toJSON(),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenExpiresInSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  };
}

/**
 * Revoke a refresh token on logout. Returns void even if token was already revoked.
 * @param {{ refreshToken: string }} data
 */
export async function logout({ refreshToken }) {
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date() }
  );
}

/**
 * Retrieve the current user's profile.
 * @param {string} userId
 */
export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  return user.toJSON();
}

/**
 * Update the current user's name.
 * @param {string} userId
 * @param {{ name: string }} data
 */
export async function updateMe(userId, { name }) {
  const user = await User.findByIdAndUpdate(
    userId,
    { name },
    { returnDocument: 'after', runValidators: true }
  );
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  return user.toJSON();
}

/**
 * Change the user's password. Revokes all active refresh tokens.
 * @param {string} userId
 * @param {{ currentPassword: string, newPassword: string }} data
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new InvalidCredentialsError('Current password is incorrect.');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // Revoke every active refresh token for this user
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );

  // Issue a fresh token pair
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
    accessTokenExpiresInSeconds: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  };
}

/**
 * Permanently delete user account and all associated forms, responses, and tokens.
 * @param {string} userId
 * @param {{ password: string }} data
 */
export async function deleteMe(userId, { password }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new InvalidCredentialsError('Incorrect password.');
  }

  // Deletion order: responses of the user's forms, then forms, then refresh tokens, then user
  const forms = await Form.find({ ownerId: userId }).select('_id');
  const formIds = forms.map((f) => f._id);

  if (formIds.length > 0) {
    await Response.deleteMany({ formId: { $in: formIds } });
  }

  await Form.deleteMany({ ownerId: userId });
  await RefreshToken.deleteMany({ userId });
  await User.findByIdAndDelete(userId);
}
