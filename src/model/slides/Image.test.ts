import { describe, test, expect, vi, type MockInstance } from 'vitest';
import { asBase64Image, importFromBlob, BASE_64_IMAGE_CONVERTER } from './Image';
import type { Base64Image } from './Image';

// ---------------------------------------------------------------------------
// FileReader mock
// ---------------------------------------------------------------------------

type MockFileReaderInstance = {
    onload: ((event: ProgressEvent) => void) | null
    onerror: ((event: ProgressEvent) => void) | null
    result: string | null
    readAsDataURL: MockInstance
};

let mockFileReaderInstance: MockFileReaderInstance;

class MockFileReader {
    onload: ((event: ProgressEvent) => void) | null = null;
    onerror: ((event: ProgressEvent) => void) | null = null;
    result: string | null = null;

    readAsDataURL = vi.fn((_blob: Blob) => {
        mockFileReaderInstance = this as unknown as MockFileReaderInstance;
    });
}

(globalThis as { FileReader: typeof FileReader }).FileReader = MockFileReader as unknown as typeof FileReader;

// ---------------------------------------------------------------------------
// asBase64Image
// ---------------------------------------------------------------------------

describe('asBase64Image', () => {
    test('returns null for undefined', () => {
        expect(asBase64Image(undefined)).toBeNull();
    });

    test('returns null for null', () => {
        expect(asBase64Image(null)).toBeNull();
    });

    test('returns null for an empty string', () => {
        expect(asBase64Image('')).toBeNull();
    });

    test('returns null for a plain string without any data-url markers', () => {
        expect(asBase64Image('hello')).toBeNull();
    });

    test('returns null when the string has data: prefix but is missing ;base64,', () => {
        expect(asBase64Image('data:image/png')).toBeNull();
    });

    test('returns null when the string has ;base64, but is missing the data: prefix', () => {
        expect(asBase64Image('image/png;base64,abc')).toBeNull();
    });

    test('returns the string cast to Base64Image for a valid data-url', () => {
        const input = 'data:image/png;base64,abc==';
        const result = asBase64Image(input);
        expect(result).toBe(input);
    });

    test('works for different MIME types', () => {
        const input = 'data:image/jpeg;base64,xyz';
        const result = asBase64Image(input);
        expect(result).toBe(input);
    });

    test('works for a non-image MIME type such as application/pdf', () => {
        const input = 'data:application/pdf;base64,JVBERi0x';
        const result = asBase64Image(input);
        expect(result).toBe(input);
    });
});

// ---------------------------------------------------------------------------
// importFromBlob
// ---------------------------------------------------------------------------

describe('importFromBlob', () => {
    test('rejects with an error when undefined is passed', async () => {
        await expect(importFromBlob(undefined)).rejects.toThrow('No blob data provided');
    });

    test('rejects with an error when null is passed', async () => {
        await expect(importFromBlob(null)).rejects.toThrow('No blob data provided');
    });

    test('resolves with the base64 string when FileReader onload fires', async () => {
        const blob = new Blob(['dummy'], { type: 'image/png' });
        const expected = 'data:image/png;base64,ZHVtbXk=' as Base64Image;

        const promise = importFromBlob(blob);

        mockFileReaderInstance.result = expected;
        mockFileReaderInstance.onload!({} as ProgressEvent);

        const result = await promise;
        expect(result).toBe(expected);
    });

    test('calls readAsDataURL with the provided blob', async () => {
        const blob = new Blob(['dummy'], { type: 'image/png' });

        const promise = importFromBlob(blob);

        mockFileReaderInstance.result = 'data:image/png;base64,ZHVtbXk=';
        mockFileReaderInstance.onload!({} as ProgressEvent);

        await promise;
        expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalledWith(blob);
    });

    test('rejects with the error event when FileReader onerror fires', async () => {
        const blob = new Blob(['dummy'], { type: 'image/png' });
        const errorEvent = {} as ProgressEvent;

        const promise = importFromBlob(blob);

        mockFileReaderInstance.onerror!(errorEvent);

        await expect(promise).rejects.toBe(errorEvent);
    });
});

// ---------------------------------------------------------------------------
// BASE_64_IMAGE_CONVERTER
// ---------------------------------------------------------------------------

describe('BASE_64_IMAGE_CONVERTER.fromJson', () => {
    test('returns the string for a valid data-url', () => {
        const input = 'data:image/png;base64,abc==';
        expect(BASE_64_IMAGE_CONVERTER.fromJson(input)).toBe(input);
    });

    test('works for different MIME types', () => {
        const input = 'data:image/jpeg;base64,xyz';
        expect(BASE_64_IMAGE_CONVERTER.fromJson(input)).toBe(input);
    });

    test('returns null for null', () => {
        expect(BASE_64_IMAGE_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(BASE_64_IMAGE_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null for a plain string without data-url markers', () => {
        expect(BASE_64_IMAGE_CONVERTER.fromJson('hello')).toBeNull();
    });

    test('returns null when the string has data: prefix but is missing ;base64,', () => {
        expect(BASE_64_IMAGE_CONVERTER.fromJson('data:image/png')).toBeNull();
    });

    test('returns null when the string has ;base64, but is missing the data: prefix', () => {
        expect(BASE_64_IMAGE_CONVERTER.fromJson('image/png;base64,abc')).toBeNull();
    });

    test('returns null for a number', () => {
        expect(BASE_64_IMAGE_CONVERTER.fromJson(42)).toBeNull();
    });

    test('returns null for a boolean', () => {
        expect(BASE_64_IMAGE_CONVERTER.fromJson(true)).toBeNull();
    });
});

describe('BASE_64_IMAGE_CONVERTER.toJson', () => {
    test('returns the same string for a valid Base64Image', () => {
        const input = 'data:image/png;base64,abc==' as Base64Image;
        expect(BASE_64_IMAGE_CONVERTER.toJson(input)).toBe(input);
    });

    test('returns null for null', () => {
        expect(BASE_64_IMAGE_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(BASE_64_IMAGE_CONVERTER.toJson(undefined)).toBeNull();
    });
});
