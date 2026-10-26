// src/utils/field-id.js
// Generates stable field IDs prefixed with "fld_" when not supplied by the client.

import { customAlphabet } from 'nanoid';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid8 = customAlphabet(ALPHABET, 8);

/**
 * Generate a new field ID: "fld_" + 8 random alphanumeric characters.
 * @returns {string}
 */
export function generateFieldId() {
  return `fld_${nanoid8()}`;
}
