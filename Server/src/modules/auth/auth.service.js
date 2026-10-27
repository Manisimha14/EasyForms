// src/modules/auth/auth.service.js
// Business logic for user registration, authentication, token management,
// password updates, and account deletion.

import { env } from '../../config/env.js';
import { User } from '../../models/user.model.js';
import { RefreshToken } from '../../models/refresh-token.model.js';
import { Form } from '../../models/form.model.js';
import { Response } from '../../models/response.model.js';
import { sendEmailWithRetry } from '../../services/email.service.js';
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

/**
 * Send a test email to verify transactional email delivery.
 * @param {string} userId
 */
export async function sendTestEmail(userId) {
  const user = await User.findById(userId);
  if (!user || !user.email) {
    throw new NotFoundError('User not found or email address missing.');
  }

  const subject = 'Easy Forms: Notification Service Verification';
  const text = `Hello ${user.name || 'there'},\n\nThis is a verification email confirming that email notifications for your Easy Forms account are working properly.\n\nRecipient: ${user.email}\nDate: ${new Date().toUTCString()}\n\n— Easy Forms Team`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
    </head>
    <body style="margin: 0; padding: 24px 12px; background-color: #F5F5F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
        
        <!-- Header Bar -->
        <div style="background-color: #FFFDF9; border-bottom: 1px solid #F5F5F4; padding: 18px 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle;">
                <svg width="34" height="34" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; shape-rendering: crispEdges; display: inline-block; vertical-align: middle; border-radius: 6px; margin-right: 8px;">
                  <rect x="4" y="0" width="12" height="20" fill="#D95300"/>
                  <rect x="2" y="1" width="16" height="18" fill="#D95300"/>
                  <rect x="1" y="2" width="18" height="16" fill="#D95300"/>
                  <rect x="0" y="4" width="20" height="12" fill="#D95300"/>
                  <rect x="4" y="1" width="12" height="17" fill="#FF7300"/>
                  <rect x="2" y="2" width="16" height="15" fill="#FF7300"/>
                  <rect x="1" y="3" width="18" height="13" fill="#FF7300"/>
                  <rect x="4" y="2" width="5" height="2" fill="#FFA547"/>
                  <rect x="2" y="4" width="2" height="5" fill="#FFA547"/>
                  <rect x="3" y="3" width="2" height="2" fill="#FFA547"/>
                  <rect x="4" y="7" width="3" height="7" fill="#FFFFFF"/>
                  <rect x="5" y="6" width="5" height="2" fill="#FFFFFF"/>
                  <rect x="4" y="7" width="6" height="1" fill="#FFFFFF"/>
                  <rect x="4" y="9" width="5" height="2" fill="#FFFFFF"/>
                  <rect x="4" y="12" width="6" height="2" fill="#FFFFFF"/>
                  <rect x="11" y="7" width="3" height="7" fill="#FFFFFF"/>
                  <rect x="12" y="6" width="5" height="2" fill="#FFFFFF"/>
                  <rect x="11" y="7" width="6" height="1" fill="#FFFFFF"/>
                  <rect x="11" y="9" width="5" height="2" fill="#FFFFFF"/>
                </svg>
                <span style="font-size: 16px; font-weight: 800; color: #1C1917; vertical-align: middle; letter-spacing: -0.02em;">Easy Forms</span>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <span style="background-color: #ECFDF5; color: #047857; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.04em;">Active &#10003;</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Main Content -->
        <div style="padding: 28px 24px;">
          <h1 style="font-size: 22px; font-weight: 800; color: #1C1917; margin: 0 0 8px 0; letter-spacing: -0.02em; line-height: 1.3;">
            Email Notifications Working! 🎉
          </h1>
          <p style="font-size: 14px; color: #78716C; margin: 0 0 20px 0; line-height: 1.5;">
            This verification email confirms that transactional email notifications and respondent receipts for your Easy Forms account are configured and ready.
          </p>
          
          <!-- Metadata Card -->
          <div style="background-color: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 11px; color: #9A3412; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">
                  Recipient Account
                </td>
                <td style="font-size: 11px; color: #9A3412; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; padding-bottom: 4px;">
                  Verified At
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #431407; font-weight: 500;">
                  ${user.email}
                </td>
                <td style="font-size: 13px; color: #EA580C; font-weight: 700; text-align: right;">
                  ${new Date().toUTCString()}
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #059669; font-weight: 600; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #F5F5F4; padding-top: 16px; text-align: center;">
            &#10003; Your email notifications are configured and operational.
          </p>
        </div>

        <!-- Footer Bar -->
        <div style="background-color: #FAFAF9; border-top: 1px solid #F5F5F4; padding: 14px 24px; text-align: center;">
          <span style="font-size: 11px; color: #A8A29E;">Powered by Easy Forms &bull; Fast, elegant forms</span>
        </div>
      </div>
    </body>
    </html>
  `;

  const job = await sendEmailWithRetry({
    type: 'test_email',
    to: user.email,
    subject,
    html,
    text,
    idempotencyKey: `test_${user._id}_${Date.now()}`,
    maxAttempts: 1,
  });

  if (!job || job.status === 'failed') {
    throw new Error(job?.lastError || 'Failed to dispatch email via SMTP.');
  }

  return {
    sent: true,
    to: user.email,
    mode: env.EMAIL_MODE,
    provider: env.EMAIL_PROVIDER,
  };
}
