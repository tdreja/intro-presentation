import { Temporal } from '@js-temporal/polyfill';
import { asArray, asBoolean, asDateTime, asNumber, asNumberOrZero, asString } from './JsonUtils';

describe('asNumber', () => {
    test.each([
        [42, 42],
        [3.14, 3.14],
        [0, 0],
        [-7, -7],
    ])('returns %s for valid finite number %s', (input, expected) => {
        expect(asNumber(input)).toBe(expected);
    });

    test.each([
        [NaN],
        [Infinity],
        [-Infinity],
    ])('returns null for non-finite number %s', (input) => {
        expect(asNumber(input)).toBeNull();
    });

    test.each([
        ['42'],
        [null],
        [undefined],
        [true],
        [false],
        [{}],
        [[]],
    ])('returns null for non-number input %s', (input) => {
        expect(asNumber(input)).toBeNull();
    });
});

describe('asNumberOrZero', () => {
    test.each([
        [42, 42],
        [3.14, 3.14],
        [0, 0],
    ])('returns %s for valid finite number %s', (input, expected) => {
        expect(asNumberOrZero(input)).toBe(expected);
    });

    test.each([
        [NaN],
        [Infinity],
        [null],
        [undefined],
        ['text'],
        [true],
    ])('returns 0 for invalid input %s', (input) => {
        expect(asNumberOrZero(input)).toBe(0);
    });
});

describe('asBoolean', () => {
    test('returns true for boolean true', () => {
        expect(asBoolean(true)).toBe(true);
    });

    test('returns false for boolean false', () => {
        expect(asBoolean(false)).toBe(false);
    });

    test.each([
        [null],
        [undefined],
        [1],
        [0],
        ['true'],
        ['false'],
        [{}],
        [[]],
    ])('returns false for non-boolean input %s', (input) => {
        expect(asBoolean(input)).toBe(false);
    });
});

describe('asArray', () => {
    test('returns the array for a non-empty array', () => {
        expect(asArray([1, 2, 3])).toEqual([1, 2, 3]);
    });

    test('returns an empty array for []', () => {
        expect(asArray([])).toEqual([]);
    });

    test('returns array with mixed types', () => {
        const mixed = [1, 'two', true, null];
        expect(asArray(mixed)).toEqual(mixed);
    });

    test.each([
        [null],
        [undefined],
        ['not array'],
        [42],
        [{}],
        [true],
    ])('returns null for non-array input %s', (input) => {
        expect(asArray(input)).toBeNull();
    });
});

describe('asString', () => {
    test('returns the string for a non-empty string', () => {
        expect(asString('hello')).toBe('hello');
    });

    test('returns empty string for ""', () => {
        expect(asString('')).toBe('');
    });

    test.each([
        [null],
        [undefined],
        [42],
        [true],
        [[]],
        [{}],
    ])('returns undefined for non-string input %s', (input) => {
        expect(asString(input)).toBeUndefined();
    });
});

describe('asDateTime', () => {
    test.each([
        ['2026-08-19T10:30:00', 2026, 8, 19, 10, 30, 0],
        ['2024-01-01T00:00:00', 2024, 1, 1, 0, 0, 0],
        ['2026-08-19T10:30:00.123', 2026, 8, 19, 10, 30, 0],
    ])('returns PlainDateTime for valid ISO string %s', (input, year, month, day, hour, minute, second) => {
        const result = asDateTime(input);
        expect(result).toBeInstanceOf(Temporal.PlainDateTime);
        expect(result?.year).toBe(year);
        expect(result?.month).toBe(month);
        expect(result?.day).toBe(day);
        expect(result?.hour).toBe(hour);
        expect(result?.minute).toBe(minute);
        expect(result?.second).toBe(second);
    });

    test.each([
        [''],
        ['not-a-date'],
        ['2026-99-99T00:00:00'],
    ])('returns undefined for invalid string %s', (input) => {
        expect(asDateTime(input)).toBeUndefined();
    });

    test.each([
        [null],
        [undefined],
        [42],
        [true],
        [{}],
        [[]],
    ])('returns undefined for non-string input %s', (input) => {
        expect(asDateTime(input)).toBeUndefined();
    });
});
