import { EventType, importAppEvent, exportAppEvent } from './Event';
import type { AppEvent } from './Event';
import type { AppId } from '../identifier/AppId';

const VALID_ID = 'evt-2026-08-17-10-30-00' as AppId;

// ---------------------------------------------------------------------------
// importAppEvent
// ---------------------------------------------------------------------------

describe('importAppEvent', () => {
    test('returns null for null', () => {
        expect(importAppEvent(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(importAppEvent(undefined)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(importAppEvent('')).toBeNull();
    });

    test('returns null when id field is missing', () => {
        const json = JSON.stringify({ type: EventType.GO_TO_SLIDE, payload: 1 });
        expect(importAppEvent(json)).toBeNull();
    });

    test('returns null when type field is missing', () => {
        const json = JSON.stringify({ id: VALID_ID, payload: 1 });
        expect(importAppEvent(json)).toBeNull();
    });

    test('reconstructs a valid event with a primitive payload', () => {
        const event: AppEvent<number> = { id: VALID_ID, type: EventType.GO_TO_SLIDE, payload: 3 };
        const json = JSON.stringify(event);
        expect(importAppEvent<number>(json)).toEqual(event);
    });

    test('reconstructs a valid event with an object payload', () => {
        type SlidePayload = { index: number; title: string };
        const event: AppEvent<SlidePayload> = {
            id: VALID_ID,
            type: EventType.REPLACE_SLIDE,
            payload: { index: 2, title: 'Intro' },
        };
        const json = JSON.stringify(event);
        expect(importAppEvent<SlidePayload>(json)).toEqual(event);
    });

    test('reconstructs a valid event when payload is absent', () => {
        const json = JSON.stringify({ id: VALID_ID, type: EventType.TOGGLE_COUNTDOWN });
        const result = importAppEvent(json);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(VALID_ID);
        expect(result!.type).toBe(EventType.TOGGLE_COUNTDOWN);
        expect(result!.payload).toBeUndefined();
    });

    test('preserves the id and type fields exactly', () => {
        const json = JSON.stringify({ id: VALID_ID, type: EventType.REPLACE_PRESENTATION, payload: null });
        const result = importAppEvent(json);
        expect(result!.id).toBe(VALID_ID);
        expect(result!.type).toBe(EventType.REPLACE_PRESENTATION);
    });
});

// ---------------------------------------------------------------------------
// exportAppEvent
// ---------------------------------------------------------------------------

describe('exportAppEvent', () => {
    test('produces a valid JSON string', () => {
        const event: AppEvent<number> = { id: VALID_ID, type: EventType.GO_TO_SLIDE, payload: 5 };
        const json = exportAppEvent(event);
        expect(() => JSON.parse(json)).not.toThrow();
    });

    test('round-trips correctly through importAppEvent', () => {
        const event: AppEvent<number> = { id: VALID_ID, type: EventType.GO_TO_SLIDE, payload: 7 };
        expect(importAppEvent(exportAppEvent(event))).toEqual(event);
    });

    test('serialized string contains the event type value', () => {
        for (const type of Object.values(EventType)) {
            const event: AppEvent<null> = { id: VALID_ID, type, payload: null };
            expect(exportAppEvent(event)).toContain(type);
        }
    });

    test('serialized string contains the event id', () => {
        const event: AppEvent<null> = { id: VALID_ID, type: EventType.TOGGLE_COUNTDOWN, payload: null };
        expect(exportAppEvent(event)).toContain(VALID_ID);
    });
});
