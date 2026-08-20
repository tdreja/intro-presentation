import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppEventBus } from './AppEventBus';
import { EVENT_CONVERTER, type AppEvent, type GoToSlideEvent, type ReplaceSlideshowEvent } from '../model/event/Event';
import { PLACEHOLDER_IMAGE } from '../model/slides/Image';
import type { AppId } from '../model/identifier/AppId';
import type { FullImageSlide } from '../model/slides/Slide';
import type { SlideShow } from '../model/slides/SlideShow';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EVT_ID = 'evt-2026-08-19-10-00-00-000' as AppId;
const SOURCE_ID = 'src-2026-08-19-10-00-00-000' as AppId;
const SHOW_ID = 'show-2026-01-01-10-00-00-000' as AppId;
const SLIDE_ID = 'slide-2026-01-01-10-00-00-000' as AppId;

const SLIDE: FullImageSlide = {
    slideId: SLIDE_ID,
    slideType: 'full-image',
    image: PLACEHOLDER_IMAGE,
};

const SLIDESHOW: SlideShow = {
    id: SHOW_ID,
    slides: [SLIDE],
};

const GO_TO_SLIDE: GoToSlideEvent = {
    id: EVT_ID,
    type: 'go-to-slide',
    remoteOnly: false,
    payload: 3,
    source: SOURCE_ID,
};

const REPLACE_SLIDESHOW: ReplaceSlideshowEvent = {
    id: EVT_ID,
    type: 'replace-slideshow',
    remoteOnly: false,
    payload: SLIDESHOW,
    source: SOURCE_ID,
};

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const makeMockChannel = () => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    postMessage: vi.fn(),
});

type MockChannel = ReturnType<typeof makeMockChannel>;

function makeMessageEvent(event: AppEvent<unknown>): MessageEvent {
    return { data: JSON.stringify(EVENT_CONVERTER.toJson(event)) } as MessageEvent;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// constructor
// ---------------------------------------------------------------------------

describe('AppEventBus — constructor', () => {
    test('1. no channel: constructs without error, _channel is undefined', () => {
        const bus = new AppEventBus();
        expect(bus._channel).toBeUndefined();
    });

    test('2. with channel: addEventListener called once with "message"', () => {
        const ch = makeMockChannel();
        new AppEventBus(ch as unknown as BroadcastChannel);
        expect(ch.addEventListener).toHaveBeenCalledTimes(1);
        expect(ch.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    test('3. with channel + lastChannelListener: removeEventListener called before addEventListener', () => {
        const ch = makeMockChannel();
        const oldListener = vi.fn();
        new AppEventBus(ch as unknown as BroadcastChannel, oldListener);
        expect(ch.removeEventListener).toHaveBeenCalledWith('message', oldListener);
        expect(ch.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
        const removeOrder = ch.removeEventListener.mock.invocationCallOrder[0];
        const addOrder = ch.addEventListener.mock.invocationCallOrder[0];
        expect(removeOrder).toBeLessThan(addOrder);
    });

    test('4. without lastChannelListener: removeEventListener is NOT called', () => {
        const ch = makeMockChannel();
        new AppEventBus(ch as unknown as BroadcastChannel);
        expect(ch.removeEventListener).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// registerListener / unregisterListener
// ---------------------------------------------------------------------------

describe('AppEventBus — registerListener / unregisterListener', () => {
    test('5. registerListener for go-to-slide: _listeners has one entry', () => {
        const bus = new AppEventBus();
        bus.registerListener('l1', 'go-to-slide', vi.fn());
        expect(bus._listeners.size).toBe(1);
    });

    test('6. registerListener for replace-slideshow: _listeners has one entry', () => {
        const bus = new AppEventBus();
        bus.registerListener('l1', 'replace-slideshow', vi.fn());
        expect(bus._listeners.size).toBe(1);
    });

    test('7. unregisterListener: _listeners is empty afterwards', () => {
        const bus = new AppEventBus();
        bus.registerListener('l1', 'go-to-slide', vi.fn());
        bus.unregisterListener('l1');
        expect(bus._listeners.size).toBe(0);
    });

    test('8. no-op when listenerName is undefined', () => {
        const bus = new AppEventBus();
        expect(() => bus.registerListener(undefined, 'go-to-slide', vi.fn())).not.toThrow();
        expect(bus._listeners.size).toBe(0);
    });

    test('9. no-op when listener is null', () => {
        const bus = new AppEventBus();
        expect(() => bus.registerListener('l1', 'go-to-slide', null)).not.toThrow();
        expect(bus._listeners.size).toBe(0);
    });

    test('10. no-op when eventType is undefined', () => {
        const bus = new AppEventBus();
        expect(() => bus.registerListener('l1', undefined, vi.fn())).not.toThrow();
        expect(bus._listeners.size).toBe(0);
    });

    test('11. same name registered twice: replaces first entry (size stays 1)', () => {
        const bus = new AppEventBus();
        bus.registerListener('l1', 'go-to-slide', vi.fn());
        bus.registerListener('l1', 'replace-slideshow', vi.fn());
        expect(bus._listeners.size).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// dispatchEvent — local, no channel
// ---------------------------------------------------------------------------

describe('AppEventBus — dispatchEvent (local, no channel)', () => {
    test('12. GoToSlideEvent with matching listener: listener is called with the event', () => {
        const bus = new AppEventBus();
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        bus.dispatchEvent(GO_TO_SLIDE);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(GO_TO_SLIDE);
    });

    test('13. ReplaceSlideshowEvent with matching listener: listener is called with the event and payload equals SLIDESHOW', () => {
        const bus = new AppEventBus();
        const fn = vi.fn();
        bus.registerListener('l', 'replace-slideshow', fn);
        bus.dispatchEvent(REPLACE_SLIDESHOW);
        expect(fn).toHaveBeenCalledTimes(1);
        expect((fn.mock.calls[0][0] as ReplaceSlideshowEvent).payload).toEqual(SLIDESHOW);
    });

    test('14. GoToSlideEvent dispatched: replace-slideshow listener is NOT called', () => {
        const bus = new AppEventBus();
        const fn = vi.fn();
        bus.registerListener('l', 'replace-slideshow', fn);
        bus.dispatchEvent(GO_TO_SLIDE);
        expect(fn).not.toHaveBeenCalled();
    });

    test('15. ReplaceSlideshowEvent dispatched: go-to-slide listener is NOT called', () => {
        const bus = new AppEventBus();
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        bus.dispatchEvent(REPLACE_SLIDESHOW);
        expect(fn).not.toHaveBeenCalled();
    });

    test('16. Multiple listeners (one per type): only the matching one fires', () => {
        const bus = new AppEventBus();
        const goFn = vi.fn();
        const replaceFn = vi.fn();
        bus.registerListener('go', 'go-to-slide', goFn);
        bus.registerListener('replace', 'replace-slideshow', replaceFn);
        bus.dispatchEvent(GO_TO_SLIDE);
        expect(goFn).toHaveBeenCalledTimes(1);
        expect(replaceFn).not.toHaveBeenCalled();
    });

    test('17. GoToSlideEvent with remoteOnly: true — local listener is NOT called', () => {
        const bus = new AppEventBus();
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        bus.dispatchEvent({ ...GO_TO_SLIDE, remoteOnly: true });
        expect(fn).not.toHaveBeenCalled();
    });

    test('18. ReplaceSlideshowEvent with remoteOnly: true — local listener is NOT called', () => {
        const bus = new AppEventBus();
        const fn = vi.fn();
        bus.registerListener('l', 'replace-slideshow', fn);
        bus.dispatchEvent({ ...REPLACE_SLIDESHOW, remoteOnly: true });
        expect(fn).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// dispatchEvent — with channel
// ---------------------------------------------------------------------------

describe('AppEventBus — dispatchEvent (with channel)', () => {
    let ch: MockChannel;
    let bus: AppEventBus;

    beforeEach(() => {
        ch = makeMockChannel();
        bus = new AppEventBus(ch as unknown as BroadcastChannel);
    });

    test('19. GoToSlideEvent: channel.postMessage called with a string', () => {
        bus.dispatchEvent(GO_TO_SLIDE);
        expect(ch.postMessage).toHaveBeenCalledTimes(1);
        expect(typeof ch.postMessage.mock.calls[0][0]).toBe('string');
    });

    test('20. ReplaceSlideshowEvent: channel.postMessage called with a string', () => {
        bus.dispatchEvent(REPLACE_SLIDESHOW);
        expect(ch.postMessage).toHaveBeenCalledTimes(1);
        expect(typeof ch.postMessage.mock.calls[0][0]).toBe('string');
    });

    test('21. GoToSlideEvent: posted JSON round-trips back to an equal event', () => {
        bus.dispatchEvent(GO_TO_SLIDE);
        const posted = ch.postMessage.mock.calls[0][0] as string;
        const restored = EVENT_CONVERTER.fromJson(JSON.parse(posted));
        expect(restored).toEqual(GO_TO_SLIDE);
    });

    test('22. ReplaceSlideshowEvent: posted JSON round-trips back; payload id survives', () => {
        bus.dispatchEvent(REPLACE_SLIDESHOW);
        const posted = ch.postMessage.mock.calls[0][0] as string;
        const restored = EVENT_CONVERTER.fromJson(JSON.parse(posted)) as ReplaceSlideshowEvent;
        expect(restored).not.toBeNull();
        expect(restored.payload.id).toBe(SHOW_ID);
    });

    test('23. GoToSlideEvent remoteOnly: true — postMessage IS called', () => {
        bus.dispatchEvent({ ...GO_TO_SLIDE, remoteOnly: true });
        expect(ch.postMessage).toHaveBeenCalledTimes(1);
    });

    test('24. ReplaceSlideshowEvent remoteOnly: true — postMessage IS called', () => {
        bus.dispatchEvent({ ...REPLACE_SLIDESHOW, remoteOnly: true });
        expect(ch.postMessage).toHaveBeenCalledTimes(1);
    });

    test('25. GoToSlideEvent remoteOnly: false — both local listener AND postMessage fire', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        bus.dispatchEvent(GO_TO_SLIDE);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(ch.postMessage).toHaveBeenCalledTimes(1);
    });

    test('26. ReplaceSlideshowEvent remoteOnly: false — both local listener AND postMessage fire', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'replace-slideshow', fn);
        bus.dispatchEvent(REPLACE_SLIDESHOW);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(ch.postMessage).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// onChannelEvent — via _channelListener (full deserialization path)
// ---------------------------------------------------------------------------

describe('AppEventBus — onChannelEvent (via _channelListener)', () => {
    let bus: AppEventBus;

    beforeEach(() => {
        bus = new AppEventBus();
    });

    test('27. non-string data: no listener called, no error', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        expect(() => bus._channelListener({ data: 42 } as unknown as MessageEvent)).not.toThrow();
        expect(fn).not.toHaveBeenCalled();
    });

    test('28. valid go-to-slide JSON: matching listener called with parsed GoToSlideEvent, payload equals 3', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        bus._channelListener(makeMessageEvent(GO_TO_SLIDE));
        expect(fn).toHaveBeenCalledTimes(1);
        expect((fn.mock.calls[0][0] as GoToSlideEvent).payload).toBe(3);
    });

    test('29. valid replace-slideshow JSON: listener called; payload.id equals SHOW_ID and slides has length 1', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'replace-slideshow', fn);
        bus._channelListener(makeMessageEvent(REPLACE_SLIDESHOW));
        expect(fn).toHaveBeenCalledTimes(1);
        const received = fn.mock.calls[0][0] as ReplaceSlideshowEvent;
        expect(received.payload.id).toBe(SHOW_ID);
        expect(received.payload.slides).toHaveLength(1);
    });

    test('30. incoming go-to-slide: replace-slideshow listener is NOT called', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'replace-slideshow', fn);
        bus._channelListener(makeMessageEvent(GO_TO_SLIDE));
        expect(fn).not.toHaveBeenCalled();
    });

    test('31. incoming replace-slideshow: go-to-slide listener is NOT called', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        bus._channelListener(makeMessageEvent(REPLACE_SLIDESHOW));
        expect(fn).not.toHaveBeenCalled();
    });

    test('32. JSON with missing id: EVENT_CONVERTER returns null, listener not called', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        const badJson = JSON.stringify({ type: 'go-to-slide', remoteOnly: false, payload: 5 });
        expect(() => bus._channelListener({ data: badJson } as MessageEvent)).not.toThrow();
        expect(fn).not.toHaveBeenCalled();
    });

    test('33. completely malformed JSON string: listener not called', () => {
        const fn = vi.fn();
        bus.registerListener('l', 'go-to-slide', fn);
        expect(() => bus._channelListener({ data: '{not valid json' } as MessageEvent)).not.toThrow();
        expect(fn).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Full round-trip: dispatch → postMessage → _channelListener → listener
// ---------------------------------------------------------------------------

describe('AppEventBus — full round-trip', () => {
    test('34. GoToSlideEvent: dispatched string fed back into receiving bus; listener gets payload 3', () => {
        const senderCh = makeMockChannel();
        const sender = new AppEventBus(senderCh as unknown as BroadcastChannel);
        const receiver = new AppEventBus();

        const fn = vi.fn();
        receiver.registerListener('l', 'go-to-slide', fn);

        sender.dispatchEvent(GO_TO_SLIDE);
        const posted = senderCh.postMessage.mock.calls[0][0] as string;
        receiver._channelListener({ data: posted } as MessageEvent);

        expect(fn).toHaveBeenCalledTimes(1);
        expect((fn.mock.calls[0][0] as GoToSlideEvent).payload).toBe(3);
    });

    test('35. ReplaceSlideshowEvent: dispatched string fed back into receiving bus; payload survives round-trip', () => {
        const senderCh = makeMockChannel();
        const sender = new AppEventBus(senderCh as unknown as BroadcastChannel);
        const receiver = new AppEventBus();

        const fn = vi.fn();
        receiver.registerListener('l', 'replace-slideshow', fn);

        sender.dispatchEvent(REPLACE_SLIDESHOW);
        const posted = senderCh.postMessage.mock.calls[0][0] as string;
        receiver._channelListener({ data: posted } as MessageEvent);

        expect(fn).toHaveBeenCalledTimes(1);
        const received = fn.mock.calls[0][0] as ReplaceSlideshowEvent;
        expect(received.payload.id).toBe(SHOW_ID);
        expect(received.payload.slides).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// channelListener getter
// ---------------------------------------------------------------------------

describe('AppEventBus — channelListener getter', () => {
    test('36. returns the same function reference stored in _channelListener', () => {
        const bus = new AppEventBus();
        expect(bus.channelListener).toBe(bus._channelListener);
    });
});
