import { EventType, importAppEvent, exportAppEvent, replacePresentationEvent } from './Event';
import type { AppEvent } from './Event';
import type { AppId } from '../identifier/AppId';
import { Temporal } from '@js-temporal/polyfill';
import { toJsonSlideShow, type SlideShow } from '../slides/SlideShow';
import type { FullImageSlide } from '../slides/Slide';
import { PLACEHOLDER_IMAGE } from '../slides/Image';

const VALID_ID = 'evt-2026-08-17-10-30-00-000' as AppId;

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
        const event: AppEvent<number> = { id: VALID_ID, type: EventType.GO_TO_SLIDE, payload: 3, remoteOnly: true };
        const json = JSON.stringify(event);
        expect(importAppEvent<number>(json)).toEqual(event);
    });

    test('reconstructs a valid event with an object payload', () => {
        type SlidePayload = { index: number, title: string };
        const event: AppEvent<SlidePayload> = {
            id: VALID_ID,
            type: EventType.REPLACE_SLIDE,
            payload: { index: 2, title: 'Intro' },
            remoteOnly: false,
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
        const event: AppEvent<number> = { id: VALID_ID, type: EventType.GO_TO_SLIDE, payload: 5, remoteOnly: true };
        const json = exportAppEvent(event);
        expect(() => JSON.parse(json)).not.toThrow();
    });

    test('round-trips correctly through importAppEvent', () => {
        const event: AppEvent<number> = { id: VALID_ID, type: EventType.GO_TO_SLIDE, payload: 7, remoteOnly: true };
        expect(importAppEvent(exportAppEvent(event))).toEqual(event);
    });

    test('serialized string contains the event type value', () => {
        for (const type of Object.values(EventType)) {
            const event: AppEvent<null> = { id: VALID_ID, type, payload: null, remoteOnly: true };
            expect(exportAppEvent(event)).toContain(type);
        }
    });

    test('serialized string contains the event id', () => {
        const event: AppEvent<null> = { id: VALID_ID, type: EventType.TOGGLE_COUNTDOWN, payload: null, remoteOnly: true };
        expect(exportAppEvent(event)).toContain(VALID_ID);
    });
});

// ---------------------------------------------------------------------------
// replacePresentationEvent
// ---------------------------------------------------------------------------

const SHOW_ID = 'show-2026-08-19-10-00-00-000' as AppId;
const SLIDE_ID = 'slide-2026-08-19-10-00-00-000' as AppId;

const FULL_IMAGE_SLIDE: FullImageSlide = {
    slideId: SLIDE_ID,
    slideType: 'full-image',
    image: PLACEHOLDER_IMAGE,
};

const VALID_SHOW: SlideShow = {
    id: SHOW_ID,
    slides: [FULL_IMAGE_SLIDE],
    currentSlideIndex: 0,
};

const SHOW_WITH_COUNTDOWN: SlideShow = {
    ...VALID_SHOW,
    countdownTarget: Temporal.PlainDateTime.from('2026-12-31T23:59:59'),
};

const EMPTY_SHOW: SlideShow = {
    id: SHOW_ID,
    slides: [],
    currentSlideIndex: 0,
};

const APP_ID_PATTERN = /^[a-zA-Z]+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/;

describe('replacePresentationEvent', () => {
    test('type is REPLACE_PRESENTATION', () => {
        const event = replacePresentationEvent(VALID_SHOW);
        expect(event.type).toBe(EventType.REPLACE_PRESENTATION);
    });

    test('remoteOnly is true', () => {
        const event = replacePresentationEvent(VALID_SHOW);
        expect(event.remoteOnly).toBe(true);
    });

    test('id matches AppId pattern', () => {
        const event = replacePresentationEvent(VALID_SHOW);
        expect(event.id).toMatch(APP_ID_PATTERN);
    });

    test('id has "event" prefix', () => {
        const event = replacePresentationEvent(VALID_SHOW);
        expect(event.id.startsWith('event-')).toBe(true);
    });

    test('payload equals toJsonSlideShow result', () => {
        const event = replacePresentationEvent(VALID_SHOW);
        expect(event.payload).toEqual(toJsonSlideShow(VALID_SHOW));
    });

    test('payload reflects slides array reference', () => {
        const event = replacePresentationEvent(VALID_SHOW);
        expect(event.payload.slides).toBe(VALID_SHOW.slides);
    });

    test('payload reflects currentSlideIndex', () => {
        const showAtIndex2: SlideShow = { ...VALID_SHOW, currentSlideIndex: 2 };
        const event = replacePresentationEvent(showAtIndex2);
        expect(event.payload.currentSlideIndex).toBe(2);
    });

    test('payload converts countdownTarget to ISO string', () => {
        const event = replacePresentationEvent(SHOW_WITH_COUNTDOWN);
        expect(event.payload.countdownTarget).toBe(SHOW_WITH_COUNTDOWN.countdownTarget!.toString());
    });

    test('payload omits countdownTarget when absent', () => {
        const event = replacePresentationEvent(VALID_SHOW);
        expect(event.payload.countdownTarget).toBeUndefined();
    });

    test('two consecutive calls produce different ids', () => {
        const event1 = replacePresentationEvent(VALID_SHOW);
        const event2 = replacePresentationEvent(VALID_SHOW);
        expect(typeof event1.id).toBe('string');
        expect(typeof event2.id).toBe('string');
        // Soft check: both are valid AppIds regardless of collision
        expect(event1.id).toMatch(APP_ID_PATTERN);
        expect(event2.id).toMatch(APP_ID_PATTERN);
    });

    test('works with an empty slides array', () => {
        const event = replacePresentationEvent(EMPTY_SHOW);
        expect(event.type).toBe(EventType.REPLACE_PRESENTATION);
        expect(event.payload.slides).toEqual([]);
        expect(event.payload.currentSlideIndex).toBe(0);
    });

    test('event round-trips through exportAppEvent / importAppEvent', () => {
        const event = replacePresentationEvent(VALID_SHOW);
        const restored = importAppEvent<typeof event.payload>(exportAppEvent(event));
        expect(restored).not.toBeNull();
        expect(restored!.type).toBe(EventType.REPLACE_PRESENTATION);
        expect(restored!.remoteOnly).toBe(true);
        expect(restored!.id).toBe(event.id);
        expect(restored!.payload).toEqual(toJsonSlideShow(VALID_SHOW));
    });
});
