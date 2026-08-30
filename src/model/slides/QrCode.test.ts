import { describe, test, expect } from 'vitest';
import { QR_CODE_CONVERTER, type QrCode } from './QrCode';

const VALID_QR: QrCode = {
    data: 'https://example.com',
    corner: 'top-right',
};

// ---------------------------------------------------------------------------
// QR_CODE_CONVERTER.fromJson — null / invalid guards
// ---------------------------------------------------------------------------

describe('QR_CODE_CONVERTER.fromJson — null / invalid guards', () => {
    test('returns null for null', () => {
        expect(QR_CODE_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(QR_CODE_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null for an empty object', () => {
        expect(QR_CODE_CONVERTER.fromJson({})).toBeNull();
    });

    test('returns null when data is missing', () => {
        expect(QR_CODE_CONVERTER.fromJson({ corner: 'top-right' })).toBeNull();
    });

    test('returns null when data is an empty string', () => {
        expect(QR_CODE_CONVERTER.fromJson({ data: '', corner: 'top-right' })).toBeNull();
    });

    test('returns null when data is not a string', () => {
        expect(QR_CODE_CONVERTER.fromJson({ data: 42, corner: 'top-right' })).toBeNull();
    });

    test('returns null when corner is missing', () => {
        expect(QR_CODE_CONVERTER.fromJson({ data: 'https://example.com' })).toBeNull();
    });

    test('returns null when corner is an invalid value', () => {
        expect(QR_CODE_CONVERTER.fromJson({ data: 'https://example.com', corner: 'center' })).toBeNull();
    });

    test('returns null when corner is not a string', () => {
        expect(QR_CODE_CONVERTER.fromJson({ data: 'https://example.com', corner: 1 })).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// QR_CODE_CONVERTER.fromJson — valid input
// ---------------------------------------------------------------------------

describe('QR_CODE_CONVERTER.fromJson — valid input', () => {
    test('returns a QrCode for a valid object', () => {
        const result = QR_CODE_CONVERTER.fromJson(VALID_QR);
        expect(result).not.toBeNull();
        expect(result!.data).toBe('https://example.com');
        expect(result!.corner).toBe('top-right');
    });

    test.each(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const)(
        'accepts all valid corner values: %s',
        (corner) => {
            const result = QR_CODE_CONVERTER.fromJson({ data: 'https://example.com', corner });
            expect(result).not.toBeNull();
            expect(result!.corner).toBe(corner);
        },
    );
});

// ---------------------------------------------------------------------------
// QR_CODE_CONVERTER.toJson — null guards
// ---------------------------------------------------------------------------

describe('QR_CODE_CONVERTER.toJson — null / undefined guards', () => {
    test('returns null for null', () => {
        expect(QR_CODE_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(QR_CODE_CONVERTER.toJson(undefined)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// QR_CODE_CONVERTER.toJson — valid input
// ---------------------------------------------------------------------------

describe('QR_CODE_CONVERTER.toJson — valid input', () => {
    test('serializes data and corner correctly', () => {
        const result = QR_CODE_CONVERTER.toJson(VALID_QR)!;
        expect(result.data).toBe('https://example.com');
        expect(result.corner).toBe('top-right');
    });
});

// ---------------------------------------------------------------------------
// Round-trip: fromJson ∘ toJson
// ---------------------------------------------------------------------------

describe('QR_CODE_CONVERTER round-trip', () => {
    test.each(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const)(
        'survives a full round-trip for corner %s',
        (corner) => {
            const original: QrCode = { data: 'https://example.com/qr', corner };
            const json = QR_CODE_CONVERTER.toJson(original)!;
            const result = QR_CODE_CONVERTER.fromJson(json);
            expect(result).toEqual(original);
        },
    );
});
