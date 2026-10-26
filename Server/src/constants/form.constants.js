// src/constants/form.constants.js
// Enum-like constants for form status, visibility, and question types.
// Reused by Zod schemas and Mongoose schemas to keep values in one place.

export const FORM_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
});

export const FORM_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
});

export const QUESTION_TYPES = Object.freeze([
  'short_text',
  'long_text',
  'number',
  'yes_no',
  'email',
  'single_select',
  'multi_select',
  'checkbox',
  'dropdown',
  'rating',
  'date',
]);

export const SELECTION_TYPES = Object.freeze([
  'single_select',
  'multi_select',
  'dropdown',
]);

// Field and form limits
export const LIMITS = Object.freeze({
  FORM_TITLE_MIN: 1,
  FORM_TITLE_MAX: 120,
  FORM_DESCRIPTION_MAX: 2000,
  MAX_FIELDS_PER_FORM: 100,
  FIELD_LABEL_MAX: 100,
  FIELD_PLACEHOLDER_MAX: 200,
  FIELD_DESCRIPTION_MAX: 500,
  MAX_OPTIONS_PER_FIELD: 100,
  OPTION_TEXT_MAX: 200,
  SHORT_TEXT_MAX_LENGTH: 500,
  LONG_TEXT_MAX_LENGTH: 5000,
  RATING_MIN_DEFAULT: 1,
  RATING_MAX_DEFAULT: 5,
  RATING_MAX_ALLOWED: 10,
  PUBLIC_BODY_LIMIT: '256kb',
  PRIVATE_BODY_LIMIT: '1mb',
  CSV_ROW_LIMIT: 10000,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
  SEARCH_MAX_LENGTH: 100,
});
