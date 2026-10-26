// tests/unit/answer-validator.test.js
// Unit tests for strict per-question-type answer schema generation,
// type-coercion refusal, and submission validation.

import {
  buildAnswerSchema,
  validateFormSubmission,
} from '../../src/modules/responses/answer-validator.js';

describe('Answer validator', () => {
  describe('buildAnswerSchema', () => {
    test('short_text: validates string within bounds and refuses coercion', () => {
      const schema = buildAnswerSchema({
        type: 'short_text',
        required: true,
        validation: { minLength: 2, maxLength: 10 },
      });

      expect(schema.safeParse('Hello').success).toBe(true);
      expect(schema.safeParse('H').success).toBe(false); // too short
      expect(schema.safeParse('This is way too long').success).toBe(false); // too long
      expect(schema.safeParse(12345).success).toBe(false); // no number coercion
    });

    test('number: strictly requires finite number without coercion', () => {
      const schema = buildAnswerSchema({
        type: 'number',
        validation: { min: 0, max: 100 },
      });

      expect(schema.safeParse(50).success).toBe(true);
      expect(schema.safeParse(0).success).toBe(true);
      expect(schema.safeParse('50').success).toBe(false); // no string coercion
      expect(schema.safeParse(-5).success).toBe(false); // min violation
      expect(schema.safeParse(150).success).toBe(false); // max violation
      expect(schema.safeParse(Infinity).success).toBe(false);
      expect(schema.safeParse(NaN).success).toBe(false);
    });

    test('yes_no and checkbox: strictly require booleans without coercion', () => {
      const yesNoSchema = buildAnswerSchema({ type: 'yes_no', required: true });
      expect(yesNoSchema.safeParse(true).success).toBe(true);
      expect(yesNoSchema.safeParse(false).success).toBe(true);
      expect(yesNoSchema.safeParse('true').success).toBe(false);
      expect(yesNoSchema.safeParse(1).success).toBe(false);

      const checkboxSchema = buildAnswerSchema({ type: 'checkbox', required: true });
      expect(checkboxSchema.safeParse(true).success).toBe(true);
      expect(checkboxSchema.safeParse(false).success).toBe(true);
      expect(checkboxSchema.safeParse(0).success).toBe(false);
    });

    test('email: verifies valid email strings', () => {
      const schema = buildAnswerSchema({ type: 'email', required: true });
      expect(schema.safeParse('respondent@example.com').success).toBe(true);
      expect(schema.safeParse('not-an-email').success).toBe(false);
      expect(schema.safeParse('   ').success).toBe(false);
    });

    test('single_select and dropdown: allow only configured options', () => {
      const schema = buildAnswerSchema({
        type: 'single_select',
        options: ['Red', 'Green', 'Blue'],
      });

      expect(schema.safeParse('Red').success).toBe(true);
      expect(schema.safeParse('Yellow').success).toBe(false);
      expect(schema.safeParse(1).success).toBe(false);
    });

    test('multi_select: allows unique subsets of configured options', () => {
      const schema = buildAnswerSchema({
        type: 'multi_select',
        required: true,
        options: ['React', 'Node.js', 'MongoDB'],
      });

      expect(schema.safeParse(['React', 'MongoDB']).success).toBe(true);
      expect(schema.safeParse(['React', 'React']).success).toBe(false); // duplicate
      expect(schema.safeParse(['Vue']).success).toBe(false); // not in options
      expect(schema.safeParse([]).success).toBe(false); // required needs at least one
      expect(schema.safeParse('React').success).toBe(false); // must be array
    });

    test('rating: enforces integers within defined min/max bounds', () => {
      const schema = buildAnswerSchema({
        type: 'rating',
        validation: { min: 1, max: 5 },
      });

      expect(schema.safeParse(3).success).toBe(true);
      expect(schema.safeParse(1).success).toBe(true);
      expect(schema.safeParse(5).success).toBe(true);
      expect(schema.safeParse(0).success).toBe(false);
      expect(schema.safeParse(6).success).toBe(false);
      expect(schema.safeParse(3.5).success).toBe(false); // integer only
      expect(schema.safeParse('4').success).toBe(false); // no string coercion
    });

    test('date: strictly requires valid YYYY-MM-DD calendar dates within bounds', () => {
      const schema = buildAnswerSchema({
        type: 'date',
        validation: { minDate: '2026-01-01', maxDate: '2026-12-31' },
      });

      expect(schema.safeParse('2026-06-15').success).toBe(true);
      expect(schema.safeParse('2025-12-31').success).toBe(false); // before minDate
      expect(schema.safeParse('2027-01-01').success).toBe(false); // after maxDate
      expect(schema.safeParse('2026-02-31').success).toBe(false); // invalid calendar date
      expect(schema.safeParse(new Date()).success).toBe(false); // Date object refused, string required
    });
  });

  describe('validateFormSubmission', () => {
    const mockForm = {
      fields: [
        { id: 'fld_name', label: 'Name', type: 'short_text', required: true },
        { id: 'fld_age', label: 'Age', type: 'number', required: false, validation: { min: 18 } },
        { id: 'fld_rating', label: 'Rating', type: 'rating', required: true, validation: { min: 1, max: 5 } },
      ],
    };

    test('validates valid answers and skips omitted optional answers', () => {
      const submission = [
        { fieldId: 'fld_name', value: 'Taylor' },
        { fieldId: 'fld_rating', value: 5 },
      ];

      const result = validateFormSubmission(mockForm, submission);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validAnswers).toEqual(submission);
    });

    test('rejects submissions missing required fields', () => {
      const submission = [
        { fieldId: 'fld_age', value: 25 },
      ];

      const result = validateFormSubmission(mockForm, submission);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('fld_name'))).toBe(true);
      expect(result.errors.some((e) => e.path.includes('fld_rating'))).toBe(true);
    });

    test('rejects unknown field IDs', () => {
      const submission = [
        { fieldId: 'fld_name', value: 'Taylor' },
        { fieldId: 'fld_rating', value: 4 },
        { fieldId: 'fld_nonexistent', value: 'Hacker' },
      ];

      const result = validateFormSubmission(mockForm, submission);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("Unknown field ID 'fld_nonexistent'"))).toBe(true);
    });

    test('rejects duplicate answers for the same field ID', () => {
      const submission = [
        { fieldId: 'fld_name', value: 'First' },
        { fieldId: 'fld_name', value: 'Second' },
        { fieldId: 'fld_rating', value: 4 },
      ];

      const result = validateFormSubmission(mockForm, submission);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Duplicate answer'))).toBe(true);
    });
  });
});
