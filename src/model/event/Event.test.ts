import { EVENT_CONVERTER, goToSlideEvent, replaceSlideshowEvent } from './Event';
import type { AppEvent } from './Event';
import type { AppId } from '../identifier/AppId';
import type { SlideShow } from '../slides/SlideShow';

const VALID_ID = 'evt-2026-08-19-10-00-00-000' as AppId;

function makeGoToSlide(overrides: Partial<AppEvent<number>> = {}): AppEvent<number> {
    return { id: VALID_ID, type: 'go-to-slide', remoteOnly: false, payload: 3, ...overrides };
}

// ---------------------------------------------------------------------------
// fromJson
// ---------------------------------------------------------------------------

describe('EVENT_CONVERTER — fromJson', () => {
    test('returns null for null', () => {
        expect(EVENT_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(EVENT_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null when id is missing', () => {
        expect(EVENT_CONVERTER.fromJson({ type: 'go-to-slide', remoteOnly: false, payload: 1 })).toBeNull();
    });

    test('returns null when id has invalid format', () => {
        expect(EVENT_CONVERTER.fromJson({ id: 'not-an-id', type: 'go-to-slide', remoteOnly: false, payload: 1 })).toBeNull();
    });

    test('returns null when type is missing', () => {
        expect(EVENT_CONVERTER.fromJson({ id: VALID_ID, remoteOnly: false, payload: 1 })).toBeNull();
    });

    test('returns null when type is an unknown string', () => {
        expect(EVENT_CONVERTER.fromJson({ id: VALID_ID, type: 'unknown-type', remoteOnly: false, payload: 1 })).toBeNull();
    });

    test('parses a valid go-to-slide event with a number payload', () => {
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, type: 'go-to-slide', remoteOnly: false, payload: 7 });
        expect(result).toEqual({ id: VALID_ID, type: 'go-to-slide', remoteOnly: false, payload: 7 });
    });

    test('parses a valid replace-slideshow event with an object payload', () => {
        const payload = { id: 'ss-2026-01-01-00-00-00-000', slides: [], currentSlideIndex: 0 };
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, type: 'replace-slideshow', remoteOnly: true, payload });
        expect(result).toEqual({ id: VALID_ID, type: 'replace-slideshow', remoteOnly: true, payload });
    });

    test('remoteOnly defaults to false when absent', () => {
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, type: 'go-to-slide', payload: 0 });
        expect(result?.remoteOnly).toBe(false);
    });

    test('returns null when replace-slideshow payload is not a valid SlideShow', () => {
        const payload = { nested: { value: 42 } };
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, type: 'replace-slideshow', remoteOnly: false, payload });
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// toJson
// ---------------------------------------------------------------------------

describe('EVENT_CONVERTER — toJson', () => {
    test('returns null for null', () => {
        expect(EVENT_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(EVENT_CONVERTER.toJson(undefined)).toBeNull();
    });

    test('serializes a go-to-slide event to the expected shape', () => {
        const event = makeGoToSlide();
        const result = EVENT_CONVERTER.toJson(event);
        expect(result).toEqual({ id: VALID_ID, type: 'go-to-slide', remoteOnly: false, payload: 3 });
    });

    test('serializes remoteOnly: true correctly', () => {
        const event = makeGoToSlide({ remoteOnly: true });
        expect(EVENT_CONVERTER.toJson(event)?.remoteOnly).toBe(true);
    });

    test('serializes replace-slideshow payload via SLIDE_SHOW_CONVERTER (missing fields serialize as null)', () => {
        const payload = { some: 'object' };
        const event: AppEvent<unknown> = { id: VALID_ID, type: 'replace-slideshow', remoteOnly: false, payload };
        const result = EVENT_CONVERTER.toJson(event);
        expect(result?.payload).toEqual({ id: null, slides: null, currentSlideIndex: null, countdownTarget: null });
    });

    test('round-trip: toJson then fromJson returns an equal event', () => {
        const event = makeGoToSlide({ payload: 99 });
        const json = EVENT_CONVERTER.toJson(event);
        const restored = EVENT_CONVERTER.fromJson(json);
        expect(restored).toEqual(event);
    });
});

// ---------------------------------------------------------------------------
// Helper fixtures
// ---------------------------------------------------------------------------

const MINIMAL_SLIDESHOW: SlideShow = {
    id: 'ss-2026-01-01-00-00-00-000' as AppId,
    slides: [],
    currentSlideIndex: 0,
};

// ---------------------------------------------------------------------------
// goToSlideEvent
// ---------------------------------------------------------------------------

describe('goToSlideEvent', () => {
    test('sets type to go-to-slide', () => {
        expect(goToSlideEvent(0).type).toBe('go-to-slide');
    });

    test('sets payload to the given slide index', () => {
        expect(goToSlideEvent(5).payload).toBe(5);
    });

    test('remoteOnly defaults to false when omitted', () => {
        expect(goToSlideEvent(0).remoteOnly).toBe(false);
    });

    test('remoteOnly is true when passed true', () => {
        expect(goToSlideEvent(0, true).remoteOnly).toBe(true);
    });

    test('remoteOnly is false when passed false explicitly', () => {
        expect(goToSlideEvent(0, false).remoteOnly).toBe(false);
    });

    test('id starts with the event- prefix', () => {
        expect(goToSlideEvent(0).id).toMatch(/^event-/);
    });
});

// ---------------------------------------------------------------------------
// replaceSlideshowEvent
// ---------------------------------------------------------------------------

describe('replaceSlideshowEvent', () => {
    test('sets type to replace-slideshow', () => {
        expect(replaceSlideshowEvent(MINIMAL_SLIDESHOW).type).toBe('replace-slideshow');
    });

    test('sets payload to the given SlideShow', () => {
        expect(replaceSlideshowEvent(MINIMAL_SLIDESHOW).payload).toEqual(MINIMAL_SLIDESHOW);
    });

    test('remoteOnly defaults to false when omitted', () => {
        expect(replaceSlideshowEvent(MINIMAL_SLIDESHOW).remoteOnly).toBe(false);
    });

    test('remoteOnly is true when passed true', () => {
        expect(replaceSlideshowEvent(MINIMAL_SLIDESHOW, true).remoteOnly).toBe(true);
    });

    test('remoteOnly is false when passed false explicitly', () => {
        expect(replaceSlideshowEvent(MINIMAL_SLIDESHOW, false).remoteOnly).toBe(false);
    });

    test('id starts with the event- prefix', () => {
        expect(replaceSlideshowEvent(MINIMAL_SLIDESHOW).id).toMatch(/^event-/);
    });
});
