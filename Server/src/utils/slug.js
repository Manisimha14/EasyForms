// src/utils/slug.js
// Generates random, unguessable, URL-safe 10-character slugs for forms.

import { customAlphabet } from 'nanoid';

// URL-safe lowercase alphanumeric characters
const SLUG_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const SLUG_LENGTH = 10;

const nanoidSlug = customAlphabet(SLUG_ALPHABET, SLUG_LENGTH);

/**
 * Generate a new 10-character lowercase URL-safe slug.
 * @returns {string}
 */
export function generateSlug() {
  return nanoidSlug();
}
