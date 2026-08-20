import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
    BOOLEAN_CONVERTER,
    STRING_CONVERTER,
    NUMBER_CONVERTER,
    DATE_TIME_CONVERTER,
    ArrayConverter,
} from './common';

// ---------------------------------------------------------------------------
// BOOLEAN_CONVERTER
// ---------------------------------------------------------------------------

describe('BOOLEAN_CONVERTER.fromJson', () => {
    test('returns true for true', () => {
        expect(BOOLEAN_CONVERTER.fromJson(true)).toBe(true);
    });

    test('returns false for false', () => {
        expect(BOOLEAN_CONVERTER.fromJson(false)).toBe(false);
    });

    test('returns false for null', () => {
        expect(BOOLEAN_CONVERTER.fromJson(null)).toBe(false);
    });

    test('returns false for undefined', () => {
        expect(BOOLEAN_CONVERTER.fromJson(undefined)).toBe(false);
    });

    test('returns false for numeric 1', () => {
        expect(BOOLEAN_CONVERTER.fromJson(1)).toBe(false);
    });

    test('returns false for string "true"', () => {
        expect(BOOLEAN_CONVERTER.fromJson('true')).toBe(false);
    });
});

describe('BOOLEAN_CONVERTER.toJson', () => {
    test('returns true for true', () => {
        expect(BOOLEAN_CONVERTER.toJson(true)).toBe(true);
    });

    test('returns false for false', () => {
        expect(BOOLEAN_CONVERTER.toJson(false)).toBe(false);
    });

    test('returns false for null', () => {
        expect(BOOLEAN_CONVERTER.toJson(null)).toBe(false);
    });

    test('returns false for undefined', () => {
        expect(BOOLEAN_CONVERTER.toJson(undefined)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// STRING_CONVERTER
// ---------------------------------------------------------------------------

describe('STRING_CONVERTER.fromJson', () => {
    test('returns the string for a non-empty string', () => {
        expect(STRING_CONVERTER.fromJson('hello')).toBe('hello');
    });

    test('returns empty string for an empty string', () => {
        expect(STRING_CONVERTER.fromJson('')).toBe('');
    });

    test('returns null for null', () => {
        expect(STRING_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(STRING_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null for a number', () => {
        expect(STRING_CONVERTER.fromJson(42)).toBeNull();
    });

    test('returns null for a boolean', () => {
        expect(STRING_CONVERTER.fromJson(true)).toBeNull();
    });
});

describe('STRING_CONVERTER.toJson', () => {
    test('returns the string for a non-empty string', () => {
        expect(STRING_CONVERTER.toJson('hello')).toBe('hello');
    });

    test('returns empty string for an empty string', () => {
        expect(STRING_CONVERTER.toJson('')).toBe('');
    });

    test('returns null for null', () => {
        expect(STRING_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(STRING_CONVERTER.toJson(undefined)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// NUMBER_CONVERTER
// ---------------------------------------------------------------------------

describe('NUMBER_CONVERTER.fromJson', () => {
    test('returns the value for a positive integer', () => {
        expect(NUMBER_CONVERTER.fromJson(42)).toBe(42);
    });

    test('returns 0', () => {
        expect(NUMBER_CONVERTER.fromJson(0)).toBe(0);
    });

    test('returns a negative float', () => {
        expect(NUMBER_CONVERTER.fromJson(-1.5)).toBe(-1.5);
    });

    test('returns null for NaN', () => {
        expect(NUMBER_CONVERTER.fromJson(NaN)).toBeNull();
    });

    test('returns null for Infinity', () => {
        expect(NUMBER_CONVERTER.fromJson(Infinity)).toBeNull();
    });

    test('returns null for -Infinity', () => {
        expect(NUMBER_CONVERTER.fromJson(-Infinity)).toBeNull();
    });

    test('returns null for a numeric string', () => {
        expect(NUMBER_CONVERTER.fromJson('42')).toBeNull();
    });

    test('returns null for null', () => {
        expect(NUMBER_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(NUMBER_CONVERTER.fromJson(undefined)).toBeNull();
    });
});

describe('NUMBER_CONVERTER.toJson', () => {
    test('returns the number', () => {
        expect(NUMBER_CONVERTER.toJson(42)).toBe(42);
    });

    test('returns null for null', () => {
        expect(NUMBER_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(NUMBER_CONVERTER.toJson(undefined)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// DATE_TIME_CONVERTER
// ---------------------------------------------------------------------------

describe('DATE_TIME_CONVERTER.fromJson', () => {
    test('parses a valid ISO date-time string', () => {
        const result = DATE_TIME_CONVERTER.fromJson('2026-08-19T10:00:00');
        expect(result).not.toBeNull();
        expect(result!.year).toBe(2026);
        expect(result!.month).toBe(8);
        expect(result!.day).toBe(19);
        expect(result!.hour).toBe(10);
        expect(result!.minute).toBe(0);
        expect(result!.second).toBe(0);
    });

    test('returns null for an empty string', () => {
        expect(DATE_TIME_CONVERTER.fromJson('')).toBeNull();
    });

    test('returns null for null', () => {
        expect(DATE_TIME_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(DATE_TIME_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null for a number', () => {
        expect(DATE_TIME_CONVERTER.fromJson(42)).toBeNull();
    });

    test('returns null for an invalid date string', () => {
        expect(DATE_TIME_CONVERTER.fromJson('not-a-date')).toBeNull();
    });

    test('accepts a PlainDateTime instance', () => {
        const dt = Temporal.PlainDateTime.from('2026-08-19T10:00:00');
        const result = DATE_TIME_CONVERTER.fromJson(dt);
        expect(result).not.toBeNull();
        expect(result!.year).toBe(2026);
        expect(result!.month).toBe(8);
        expect(result!.day).toBe(19);
        expect(result!.hour).toBe(10);
    });

    test('accepts a PlainDateTimeLike object', () => {
        const like: Temporal.PlainDateTimeLike = { year: 2026, month: 8, day: 19, hour: 14, minute: 30, second: 0 };
        const result = DATE_TIME_CONVERTER.fromJson(like);
        expect(result).not.toBeNull();
        expect(result!.year).toBe(2026);
        expect(result!.month).toBe(8);
        expect(result!.day).toBe(19);
        expect(result!.hour).toBe(14);
        expect(result!.minute).toBe(30);
    });

    test('returns null for a PlainDateTimeLike missing required fields', () => {
        expect(DATE_TIME_CONVERTER.fromJson({})).toBeNull();
    });
});

describe('DATE_TIME_CONVERTER.toJson', () => {
    test('serializes a PlainDateTime to an ISO string', () => {
        const dt = Temporal.PlainDateTime.from('2026-08-19T10:00:00');
        const result = DATE_TIME_CONVERTER.toJson(dt);
        expect(typeof result).toBe('string');
        expect(result as string).toContain('2026-08-19');
    });

    test('returns null for null', () => {
        expect(DATE_TIME_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(DATE_TIME_CONVERTER.toJson(undefined)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// ArrayConverter
// ---------------------------------------------------------------------------

describe('ArrayConverter.fromJson', () => {
    const converter = new ArrayConverter(STRING_CONVERTER);

    test('returns null for null', () => {
        expect(converter.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(converter.fromJson(undefined)).toBeNull();
    });

    test('returns empty array for an empty array', () => {
        expect(converter.fromJson([])).toEqual([]);
    });

    test('converts all items', () => {
        expect(converter.fromJson(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    test('returns null when any item conversion fails', () => {
        const mixed = new ArrayConverter(STRING_CONVERTER);
        // number is not a valid string — fromJson returns null for it
        expect(mixed.fromJson(['a', 42 as unknown as string, 'c'])).toBeNull();
    });
});

describe('ArrayConverter.toJson', () => {
    const converter = new ArrayConverter(STRING_CONVERTER);

    test('returns null for null', () => {
        expect(converter.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(converter.toJson(undefined)).toBeNull();
    });

    test('returns empty array for an empty array', () => {
        expect(converter.toJson([])).toEqual([]);
    });

    test('serializes all items', () => {
        expect(converter.toJson(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    test('returns null when any item serialization returns null', () => {
        // Use a converter whose toJson always returns null
        const nullConverter = new ArrayConverter<string, unknown>({
            fromJson: () => null,
            toJson: () => null,
        });
        expect(nullConverter.toJson(['a'])).toBeNull();
    });
});
