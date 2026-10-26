// tests/unit/slug.test.js
// Unit tests for form slug generation.

import { generateSlug } from '../../src/utils/slug.js';

describe('Slug utility', () => {
  test('generateSlug returns a 10-character lowercase URL-safe alphanumeric string', () => {
    const slug = generateSlug();

    expect(typeof slug).toBe('string');
    expect(slug).toHaveLength(10);
    expect(slug).toMatch(/^[0-9a-z]{10}$/);
  });

  test('generateSlug produces distinct values on repeated calls', () => {
    const slugs = new Set(Array.from({ length: 50 }, () => generateSlug()));
    expect(slugs.size).toBe(50);
  });
});
