/**
 * Application Constants
 * Source of truth: Server OpenAPI specs and PRD constraints
 */

export const QUESTION_TYPES = [
  { id: 'short_text', label: 'Short Text', description: 'Single line text input' },
  { id: 'long_text', label: 'Long Text', description: 'Multi-line text area' },
  { id: 'number', label: 'Number', description: 'Numeric values with optional min/max' },
  { id: 'yes_no', label: 'Yes / No', description: 'Binary boolean choice' },
  { id: 'email', label: 'Email', description: 'Validated email address' },
  { id: 'single_select', label: 'Single Select', description: 'Radio group with multiple options' },
  { id: 'multi_select', label: 'Multi Select', description: 'Checkbox group for multiple answers' },
  { id: 'checkbox', label: 'Checkbox', description: 'Single confirmation toggle' },
  { id: 'dropdown', label: 'Dropdown', description: 'Select dropdown menu' },
  { id: 'rating', label: 'Rating', description: 'Scale rating from 1 to 10' },
  { id: 'date', label: 'Date', description: 'Date picker with min/max range' },
];

export const ALLOWED_FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Merriweather',
  'system-ui',
];

export const DEFAULT_THEME = {
  name: 'default',
  primaryColor: '#F97316',
  backgroundColor: '#FFFDF9',
  fontFamily: 'Inter',
};

export const PRESET_THEMES = [
  {
    name: 'Easy Orange',
    primaryColor: '#F97316',
    backgroundColor: '#FFFDF9',
    fontFamily: 'Inter',
  },
  {
    name: 'Warm Sunset',
    primaryColor: '#EA580C',
    backgroundColor: '#FFF7ED',
    fontFamily: 'Inter',
  },
  {
    name: 'Emerald Clean',
    primaryColor: '#059669',
    backgroundColor: '#F0FDF4',
    fontFamily: 'Open Sans',
  },
  {
    name: 'Midnight Amber',
    primaryColor: '#F97316',
    backgroundColor: '#0F172A',
    fontFamily: 'Poppins',
  },
  {
    name: 'Warm Stone',
    primaryColor: '#D97706',
    backgroundColor: '#FFFBEB',
    fontFamily: 'Lato',
  },
  {
    name: 'Editorial Rose',
    primaryColor: '#E11D48',
    backgroundColor: '#FFF1F2',
    fontFamily: 'Merriweather',
  },
];

export const LIMITS = {
  TITLE_MAX: 120,
  DESCRIPTION_MAX: 2000,
  FIELDS_MAX: 100,
  LABEL_MAX: 100,
  PLACEHOLDER_MAX: 200,
  FIELD_DESCRIPTION_MAX: 500,
  OPTIONS_MAX: 100,
  OPTION_TEXT_MAX: 200,
  NAME_MAX: 80,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 64,
};

export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Please correct the highlighted fields.',
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'This email is already registered. Please sign in.',
  BUSINESS_RULE_VIOLATION: 'Unable to complete this action due to validation rules.',
  PRECONDITION_FAILED: 'This form has been updated elsewhere. Please review changes before continuing.',
  PAYLOAD_TOO_LARGE: 'The request is too large. Please reduce the content size.',
  RATE_LIMITED: 'You are making too many requests. Please wait a moment.',
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
};
