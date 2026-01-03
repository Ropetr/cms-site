import { describe, it, expect } from 'vitest';
import {
  slugify,
  generateId,
  isValidEmail,
  sanitizeHtml,
  safeJsonParse,
  isValidSlug,
  formatPhone,
  truncate,
} from './helpers';

describe('slugify', () => {
  it('should convert text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should remove accents', () => {
    expect(slugify('Divisória Naval Premium')).toBe('divisoria-naval-premium');
    expect(slugify('Construção Civil')).toBe('construcao-civil');
    expect(slugify('São Paulo')).toBe('sao-paulo');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world');
  });

  it('should handle multiple spaces', () => {
    expect(slugify('Hello    World')).toBe('hello-world');
  });

  it('should trim leading/trailing spaces', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('generateId', () => {
  it('should generate ID with default prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^id_[a-z0-9]+$/);
  });

  it('should generate ID with custom prefix', () => {
    const id = generateId('page');
    expect(id).toMatch(/^page_[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('isValidEmail', () => {
  it('should validate correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test @example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('sanitizeHtml', () => {
  it('should escape HTML tags', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape quotes', () => {
    expect(sanitizeHtml('Hello "World"')).toBe('Hello &quot;World&quot;');
    expect(sanitizeHtml("Hello 'World'")).toBe('Hello &#x27;World&#x27;');
  });

  it('should handle normal text', () => {
    expect(sanitizeHtml('Hello World')).toBe('Hello World');
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: 'value' });
    expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
  });

  it('should return fallback for invalid JSON', () => {
    expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true });
    expect(safeJsonParse('', [])).toEqual([]);
  });
});

describe('isValidSlug', () => {
  it('should validate correct slugs', () => {
    expect(isValidSlug('hello-world')).toBe(true);
    expect(isValidSlug('page1')).toBe(true);
    expect(isValidSlug('about-us')).toBe(true);
  });

  it('should reject invalid slugs', () => {
    expect(isValidSlug('')).toBe(false);
    expect(isValidSlug('Hello-World')).toBe(false); // uppercase
    expect(isValidSlug('hello_world')).toBe(false); // underscore
    expect(isValidSlug('hello--world')).toBe(false); // double hyphen
    expect(isValidSlug('-hello')).toBe(false); // leading hyphen
    expect(isValidSlug('hello-')).toBe(false); // trailing hyphen
  });
});

describe('formatPhone', () => {
  it('should format 11-digit phone (mobile)', () => {
    expect(formatPhone('44999999999')).toBe('(44) 99999-9999');
  });

  it('should format 10-digit phone (landline)', () => {
    expect(formatPhone('4433334444')).toBe('(44) 3333-4444');
  });

  it('should handle already formatted phone', () => {
    expect(formatPhone('(44) 99999-9999')).toBe('(44) 99999-9999');
  });

  it('should return original for invalid format', () => {
    expect(formatPhone('123')).toBe('123');
  });
});

describe('truncate', () => {
  it('should truncate long text', () => {
    expect(truncate('Hello World, this is a long text', 15)).toBe('Hello World,...');
  });

  it('should not truncate short text', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should handle exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});
