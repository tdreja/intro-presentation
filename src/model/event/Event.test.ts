import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
    EVENT_CONVERTER,
    goToSlideEvent,
    replaceSlideshowEvent,
    updateCountdownEvent,
    asGoToSlideEvent,
    asReplaceSlideshowEvent,
    asUpdateCountdownEvent,
} from './Event';
import type { AppEvent } from './Event';
import type { AppId } from '../identifier/AppId';
import type { SlideShow } from '../slides/SlideShow';
import type { Countdown } from '../slides/Countdown';

const VALID_ID = 'evt-2026-08-19-10-00-00-000' as AppId;
const SOURCE_ID = 'src-2026-08-19-10-00-00-000' as AppId;
const SLIDE_ID = 'slide-2026-08-19-10-00-00-000' as AppId;

function makeGoToSlide(overrides: Partial<AppEvent<AppId | null>> = {}): AppEvent<AppId | null> {
    return { id: VALID_ID, type: 'go-to-slide', payload: SLIDE_ID, source: SOURCE_ID, ...overrides };
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
        expect(EVENT_CONVERTER.fromJson({ type: 'go-to-slide', payload: 1 })).toBeNull();
    });

    test('returns null when id has invalid format', () => {
        expect(EVENT_CONVERTER.fromJson({ id: 'not-an-id', type: 'go-to-slide', payload: 1 })).toBeNull();
    });

    test('returns null when type is missing', () => {
        expect(EVENT_CONVERTER.fromJson({ id: VALID_ID, payload: 1 })).toBeNull();
    });

    test('returns null when type is an unknown string', () => {
        expect(EVENT_CONVERTER.fromJson({ id: VALID_ID, type: 'unknown-type', payload: 1 })).toBeNull();
    });

    test('parses a valid go-to-slide event with a number payload', () => {
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: 7 });
        expect(result).toEqual({ id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: null });
    });

    test('parses a valid go-to-slide event with an AppId payload', () => {
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: SLIDE_ID });
        expect(result).toEqual({ id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: SLIDE_ID });
    });

    test('parses a go-to-slide event with null payload', () => {
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: null });
        expect(result).toEqual({ id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: null });
    });

    test('parses a valid replace-slideshow event with an object payload', () => {
        const payload = { id: 'ss-2026-01-01-00-00-00-000', slides: [], timePerSlide: 'PT10S' };
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, source: SOURCE_ID, type: 'replace-slideshow', payload });
        expect(result).not.toBeNull();
        expect(result?.type).toBe('replace-slideshow');
        expect((result?.payload as SlideShow).id).toBe('ss-2026-01-01-00-00-00-000');
    });

    test('returns null when replace-slideshow payload is not a valid SlideShow', () => {
        const payload = { nested: { value: 42 } };
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, type: 'replace-slideshow', payload });
        expect(result).toBeNull();
    });

    test('parses a valid update-countdown event', () => {
        const raw = {
            id: VALID_ID,
            source: SOURCE_ID,
            type: 'update-countdown',
            payload: {
                countdownId: 'countdown-2026-09-01-09-00-00-000',
                countdownTime: '2026-09-01T09:00:00',
                showSmallCountdownFor: 'PT5M',
                showLargeCountdownFor: 'PT1M',
            },
        };
        const result = EVENT_CONVERTER.fromJson(raw);
        expect(result?.type).toBe('update-countdown');
        expect(result?.payload).toEqual(MINIMAL_COUNTDOWN);
    });

    test('returns update-countdown event with null payload when payload is not a valid Countdown', () => {
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, source: SOURCE_ID, type: 'update-countdown', payload: { bad: true } });
        expect(result?.type).toBe('update-countdown');
        expect(result?.payload).toBeNull();
    });

    test('parses an update-countdown event with null payload', () => {
        const result = EVENT_CONVERTER.fromJson({ id: VALID_ID, source: SOURCE_ID, type: 'update-countdown', payload: null });
        expect(result?.type).toBe('update-countdown');
        expect(result?.payload).toBeNull();
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
        expect(result).toEqual({ id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: SLIDE_ID });
    });

    test('serializes a go-to-slide event with null payload', () => {
        const event = makeGoToSlide({ payload: null });
        const result = EVENT_CONVERTER.toJson(event);
        expect(result).toEqual({ id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: null });
    });

    test('serializes replace-slideshow payload via SLIDE_SHOW_CONVERTER (missing fields serialize as null)', () => {
        const payload = { some: 'object' };
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'replace-slideshow', payload };
        const result = EVENT_CONVERTER.toJson(event);
        expect(result?.payload).toEqual({ id: null, slides: null, timePerSlide: null });
    });

    test('round-trip: toJson then fromJson returns an equal event', () => {
        const event = makeGoToSlide({ payload: SLIDE_ID });
        const json = EVENT_CONVERTER.toJson(event);
        const restored = EVENT_CONVERTER.fromJson(json);
        expect(restored).toEqual(event);
    });

    test('round-trip: toJson then fromJson for go-to-slide with null payload', () => {
        const event = makeGoToSlide({ payload: null });
        const json = EVENT_CONVERTER.toJson(event);
        const restored = EVENT_CONVERTER.fromJson(json);
        expect(restored).toEqual(event);
    });

    test('serializes an update-countdown event to the expected shape', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'update-countdown', payload: MINIMAL_COUNTDOWN };
        const result = EVENT_CONVERTER.toJson(event);
        expect(result?.type).toBe('update-countdown');
        expect(result?.payload).toEqual({
            countdownId: 'countdown-2026-09-01-09-00-00-000',
            countdownTime: '2026-09-01T09:00:00',
            showSmallCountdownFor: 'PT5M',
            showLargeCountdownFor: 'PT1M',
        });
    });

    test('round-trip: toJson then fromJson for update-countdown returns an equal event', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'update-countdown', payload: MINIMAL_COUNTDOWN };
        const json = EVENT_CONVERTER.toJson(event);
        const restored = EVENT_CONVERTER.fromJson(json);
        expect(restored).toEqual(event);
    });

    test('round-trip: toJson then fromJson for update-countdown with minimal (ID-only) countdown', () => {
        const minimal: Countdown = { countdownId: 'countdown-2026-09-01-09-00-00-000' };
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'update-countdown', payload: minimal };
        const json = EVENT_CONVERTER.toJson(event);
        const restored = EVENT_CONVERTER.fromJson(json);
        expect(restored?.type).toBe('update-countdown');
        expect((restored?.payload as Countdown).countdownId).toBe(minimal.countdownId);
    });
});

// ---------------------------------------------------------------------------
// Helper fixtures
// ---------------------------------------------------------------------------

const MINIMAL_SLIDESHOW: SlideShow = {
    id: 'ss-2026-01-01-00-00-00-000' as AppId,
    slides: [],
    timePerSlide: Temporal.Duration.from({ seconds: 10 }),
};

const MINIMAL_COUNTDOWN: Countdown = {
    countdownId: 'countdown-2026-09-01-09-00-00-000',
    countdownTime: Temporal.PlainDateTime.from('2026-09-01T09:00:00'),
    showSmallCountdownFor: Temporal.Duration.from({ minutes: 5 }),
    showLargeCountdownFor: Temporal.Duration.from({ minutes: 1 }),
};

// ---------------------------------------------------------------------------
// goToSlideEvent
// ---------------------------------------------------------------------------

describe('goToSlideEvent', () => {
    test('sets type to go-to-slide', () => {
        expect(goToSlideEvent(SOURCE_ID, SLIDE_ID).type).toBe('go-to-slide');
    });

    test('sets payload to the given slide AppId', () => {
        expect(goToSlideEvent(SOURCE_ID, SLIDE_ID).payload).toBe(SLIDE_ID);
    });

    test('sets payload to null when null is passed', () => {
        expect(goToSlideEvent(SOURCE_ID, null).payload).toBeNull();
    });

    test('id starts with the event- prefix', () => {
        expect(goToSlideEvent(SOURCE_ID, SLIDE_ID).id).toMatch(/^event-/);
    });
});

// ---------------------------------------------------------------------------
// replaceSlideshowEvent
// ---------------------------------------------------------------------------

describe('replaceSlideshowEvent', () => {
    test('sets type to replace-slideshow', () => {
        expect(replaceSlideshowEvent(SOURCE_ID, MINIMAL_SLIDESHOW).type).toBe('replace-slideshow');
    });

    test('sets payload to the given SlideShow', () => {
        expect(replaceSlideshowEvent(SOURCE_ID, MINIMAL_SLIDESHOW).payload).toEqual(MINIMAL_SLIDESHOW);
    });

    test('id starts with the event- prefix', () => {
        expect(replaceSlideshowEvent(SOURCE_ID, MINIMAL_SLIDESHOW).id).toMatch(/^event-/);
    });
});

// ---------------------------------------------------------------------------
// updateCountdownEvent
// ---------------------------------------------------------------------------

describe('updateCountdownEvent', () => {
    test('sets type to update-countdown', () => {
        expect(updateCountdownEvent(SOURCE_ID, MINIMAL_COUNTDOWN).type).toBe('update-countdown');
    });

    test('sets payload to the given Countdown', () => {
        expect(updateCountdownEvent(SOURCE_ID, MINIMAL_COUNTDOWN).payload).toEqual(MINIMAL_COUNTDOWN);
    });

    test('sets source to the given source id', () => {
        expect(updateCountdownEvent(SOURCE_ID, MINIMAL_COUNTDOWN).source).toBe(SOURCE_ID);
    });

    test('id starts with the event- prefix', () => {
        expect(updateCountdownEvent(SOURCE_ID, MINIMAL_COUNTDOWN).id).toMatch(/^event-/);
    });
});

// ---------------------------------------------------------------------------
// asGoToSlideEvent
// ---------------------------------------------------------------------------

describe('asGoToSlideEvent', () => {
    test('returns the event when type is go-to-slide', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: SLIDE_ID };
        expect(asGoToSlideEvent(event)).toBe(event);
    });

    test('returns the event when type is go-to-slide with null payload', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: null };
        expect(asGoToSlideEvent(event)).toBe(event);
    });

    test('returns null when type is replace-slideshow', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'replace-slideshow', payload: MINIMAL_SLIDESHOW };
        expect(asGoToSlideEvent(event)).toBeNull();
    });

    test('returns null when type is update-countdown', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'update-countdown', payload: MINIMAL_COUNTDOWN };
        expect(asGoToSlideEvent(event)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// asReplaceSlideshowEvent
// ---------------------------------------------------------------------------

describe('asReplaceSlideshowEvent', () => {
    test('returns the event when type is replace-slideshow', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'replace-slideshow', payload: MINIMAL_SLIDESHOW };
        expect(asReplaceSlideshowEvent(event)).toBe(event);
    });

    test('returns null when type is go-to-slide', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: SLIDE_ID };
        expect(asReplaceSlideshowEvent(event)).toBeNull();
    });

    test('returns null when type is update-countdown', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'update-countdown', payload: MINIMAL_COUNTDOWN };
        expect(asReplaceSlideshowEvent(event)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// asUpdateCountdownEvent
// ---------------------------------------------------------------------------

describe('asUpdateCountdownEvent', () => {
    test('returns the event when type is update-countdown', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'update-countdown', payload: MINIMAL_COUNTDOWN };
        expect(asUpdateCountdownEvent(event)).toBe(event);
    });

    test('returns null when type is go-to-slide', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'go-to-slide', payload: SLIDE_ID };
        expect(asUpdateCountdownEvent(event)).toBeNull();
    });

    test('returns null when type is replace-slideshow', () => {
        const event: AppEvent<unknown> = { id: VALID_ID, source: SOURCE_ID, type: 'replace-slideshow', payload: MINIMAL_SLIDESHOW };
        expect(asUpdateCountdownEvent(event)).toBeNull();
    });
});
