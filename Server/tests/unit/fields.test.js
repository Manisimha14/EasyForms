// tests/unit/fields.test.js
// Unit tests for all 11 question types, field replacement validation,
// theme schemas, and publish prerequisites logic.

import {
  singleFieldSchema,
  updateThemeSchema,
  isValidCalendarDate,
} from '../../src/modules/forms/field.validation.js';
import { checkPublishPrerequisites } from '../../src/modules/forms/form.service.js';

describe('Field validation schemas', () => {
  describe('Calendar date validator', () => {
    test('accepts valid calendar dates', () => {
      expect(isValidCalendarDate('2026-10-25')).toBe(true);
      expect(isValidCalendarDate('2024-02-29')).toBe(true); // leap year
    });

    test('rejects non-existent calendar dates', () => {
      expect(isValidCalendarDate('2026-02-29')).toBe(false); // not a leap year
      expect(isValidCalendarDate('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidCalendarDate('2026-13-01')).toBe(false);
      expect(isValidCalendarDate('not-a-date')).toBe(false);
    });
  });

  describe('11 Question Types validation', () => {
    test('validates short_text field with min/max length', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Short Name',
        type: 'short_text',
        order: 0,
        validation: { minLength: 2, maxLength: 50 },
      });
      expect(valid.success).toBe(true);

      const invalid = singleFieldSchema.safeParse({
        label: 'Short Name',
        type: 'short_text',
        order: 0,
        validation: { minLength: 100, maxLength: 10 },
      });
      expect(invalid.success).toBe(false);
    });

    test('validates long_text field', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Feedback',
        type: 'long_text',
        order: 1,
        validation: { maxLength: 2000 },
      });
      expect(valid.success).toBe(true);
    });

    test('validates number field with min and max', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Age',
        type: 'number',
        order: 2,
        validation: { min: 18, max: 120 },
      });
      expect(valid.success).toBe(true);

      const invalid = singleFieldSchema.safeParse({
        label: 'Age',
        type: 'number',
        order: 2,
        validation: { min: 100, max: 10 },
      });
      expect(invalid.success).toBe(false);
    });

    test('validates yes_no field without options', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Are you over 18?',
        type: 'yes_no',
        order: 3,
      });
      expect(valid.success).toBe(true);

      const invalid = singleFieldSchema.safeParse({
        label: 'Are you over 18?',
        type: 'yes_no',
        order: 3,
        options: ['Yes', 'No'], // options not allowed on yes_no
      });
      expect(invalid.success).toBe(false);
    });

    test('validates email field without options', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Email address',
        type: 'email',
        order: 4,
      });
      expect(valid.success).toBe(true);
    });

    test('validates single_select field requiring unique options', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Department',
        type: 'single_select',
        order: 5,
        options: ['Engineering', 'Design', 'Marketing'],
      });
      expect(valid.success).toBe(true);

      const duplicate = singleFieldSchema.safeParse({
        label: 'Department',
        type: 'single_select',
        order: 5,
        options: ['Engineering', 'Engineering'],
      });
      expect(duplicate.success).toBe(false);

      const missingOptions = singleFieldSchema.safeParse({
        label: 'Department',
        type: 'single_select',
        order: 5,
      });
      expect(missingOptions.success).toBe(false);
    });

    test('validates multi_select field', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Skills',
        type: 'multi_select',
        order: 6,
        options: ['JavaScript', 'Python', 'Go'],
      });
      expect(valid.success).toBe(true);
    });

    test('validates checkbox field without options', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'I accept the terms',
        type: 'checkbox',
        order: 7,
      });
      expect(valid.success).toBe(true);
    });

    test('validates dropdown field', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Country',
        type: 'dropdown',
        order: 8,
        options: ['India', 'USA', 'Germany'],
      });
      expect(valid.success).toBe(true);
    });

    test('validates rating field with default and customized scales', () => {
      const validDefault = singleFieldSchema.safeParse({
        label: 'Rating',
        type: 'rating',
        order: 9,
      });
      expect(validDefault.success).toBe(true);

      const validCustom = singleFieldSchema.safeParse({
        label: 'Rating',
        type: 'rating',
        order: 9,
        validation: { min: 1, max: 10 },
      });
      expect(validCustom.success).toBe(true);

      const invalidMax = singleFieldSchema.safeParse({
        label: 'Rating',
        type: 'rating',
        order: 9,
        validation: { min: 1, max: 15 }, // max allowed is 10
      });
      expect(invalidMax.success).toBe(false);
    });

    test('validates date field with minDate and maxDate', () => {
      const valid = singleFieldSchema.safeParse({
        label: 'Appointment Date',
        type: 'date',
        order: 10,
        validation: { minDate: '2026-01-01', maxDate: '2026-12-31' },
      });
      expect(valid.success).toBe(true);

      const invalidRange = singleFieldSchema.safeParse({
        label: 'Appointment Date',
        type: 'date',
        order: 10,
        validation: { minDate: '2026-12-31', maxDate: '2026-01-01' },
      });
      expect(invalidRange.success).toBe(false);

      const invalidDate = singleFieldSchema.safeParse({
        label: 'Appointment Date',
        type: 'date',
        order: 10,
        validation: { minDate: '2026-02-31' },
      });
      expect(invalidDate.success).toBe(false);
    });
  });

  describe('Theme validation schema', () => {
    test('accepts valid theme configuration', () => {
      const valid = updateThemeSchema.safeParse({
        name: 'Dark Midnight',
        primaryColor: '#6366F1',
        backgroundColor: '#0F172A',
        fontFamily: 'Inter',
      });
      expect(valid.success).toBe(true);
    });

    test('rejects non-hex colors', () => {
      const invalid = updateThemeSchema.safeParse({
        name: 'Theme',
        primaryColor: 'red',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Inter',
      });
      expect(invalid.success).toBe(false);
    });

    test('rejects unapproved font families', () => {
      const invalid = updateThemeSchema.safeParse({
        name: 'Theme',
        primaryColor: '#000000',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Comic Sans MS',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('Publish prerequisites logic', () => {
    test('passes when form has title and valid fields with options', () => {
      const form = {
        title: 'Ready Form',
        fields: [
          { label: 'Name', type: 'short_text' },
          { label: 'Role', type: 'single_select', options: ['Admin', 'User'] },
        ],
      };
      const result = checkPublishPrerequisites(form);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('fails when form has empty fields array or missing title', () => {
      const emptyForm = { title: '', fields: [] };
      const result = checkPublishPrerequisites(emptyForm);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
    });

    test('fails when selection field has empty options', () => {
      const form = {
        title: 'Survey',
        fields: [
          { label: 'Options Question', type: 'single_select', options: [] },
        ],
      };
      const result = checkPublishPrerequisites(form);
      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.path.includes('options'))).toBe(true);
    });
  });
});
