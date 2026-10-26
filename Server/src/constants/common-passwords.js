// src/constants/common-passwords.js
// Small denylist of very common passwords that must be rejected at registration/change.

export const COMMON_PASSWORDS = Object.freeze(
  new Set([
    'password',
    'password1',
    'password123',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty123',
    'admin123',
    'welcome1',
    'welcome123',
    'letmein123',
    'monkey123',
    'football1',
    'dragon123',
    'master123',
    'iloveyou1',
    'sunshine1',
    'princess1',
  ])
);
