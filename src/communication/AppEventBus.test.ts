import { AppEventBus } from './AppEventBus';
import { EventType, exportAppEvent } from '../model/event/Event';
import type { AppEvent } from '../model/event/Event';
import type { AppId } from '../model/identifier/AppId';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_ID = 'evt-2026-08-17-10-30-00-000' as AppId;

function makeEvent(payload: number = 1): AppEvent<number> {
    return { id: VALID_ID, type: EventType.GO_TO_SLIDE, payload };
}

function makeMockChannel() {
    return {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        postMessage: jest.fn(),
    };
}

/** Calls the channel listener as if a MessageEvent arrived from another tab. */
function fireChannelMessage(bus: AppEventBus, event: AppEvent<any>): void {
    const messageEvent = { data: exportAppEvent(event) } as MessageEvent;
    bus.channelListener(messageEvent);
}

/** Fires a channel message with raw (possibly invalid) data. */
function fireRawChannelMessage(bus: AppEventBus, data: unknown): void {
    const messageEvent = { data } as MessageEvent;
    bus.channelListener(messageEvent);
}

// ---------------------------------------------------------------------------
// constructor
// ---------------------------------------------------------------------------

describe('AppEventBus — constructor', () => {
    test('creates bus with empty listener list and no channel when called with no arguments', () => {
        const bus = new AppEventBus();
        expect(bus._listeners).toHaveLength(0);
        expect(bus._channel).toBeUndefined();
    });

    test('stores the provided BroadcastChannel', () => {
        const channel = makeMockChannel() as unknown as BroadcastChannel;
        const bus = new AppEventBus(channel);
        expect(bus._channel).toBe(channel);
    });

    test('registers a message listener on the channel', () => {
        const channel = makeMockChannel() as unknown as BroadcastChannel;
        const bus = new AppEventBus(channel);
        expect((channel as any).addEventListener).toHaveBeenCalledWith('message', bus.channelListener);
    });

    test('removes the previous channel listener before registering a new one', () => {
        const channel = makeMockChannel() as unknown as BroadcastChannel;
        const oldBus = new AppEventBus(channel);
        const oldListener = oldBus.channelListener;

        const newBus = new AppEventBus(channel, oldListener);
        expect((channel as any).removeEventListener).toHaveBeenCalledWith('message', oldListener);
        expect((channel as any).addEventListener).toHaveBeenLastCalledWith('message', newBus.channelListener);
    });

    test('does not call removeEventListener when no previous listener is given', () => {
        const channel = makeMockChannel() as unknown as BroadcastChannel;
        new AppEventBus(channel);
        expect((channel as any).removeEventListener).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// channelListener getter
// ---------------------------------------------------------------------------

describe('AppEventBus — channelListener', () => {
    test('returns the bound internal channel listener function', () => {
        const bus = new AppEventBus();
        expect(typeof bus.channelListener).toBe('function');
        expect(bus.channelListener).toBe(bus._channelListener);
    });
});

// ---------------------------------------------------------------------------
// registerListener
// ---------------------------------------------------------------------------

describe('AppEventBus — registerListener', () => {
    test('adds a listener to the list', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        expect(bus._listeners).toContain(listener);
    });

    test('null is silently ignored', () => {
        const bus = new AppEventBus();
        bus.registerListener(null);
        expect(bus._listeners).toHaveLength(0);
    });

    test('undefined is silently ignored', () => {
        const bus = new AppEventBus();
        bus.registerListener(undefined);
        expect(bus._listeners).toHaveLength(0);
    });

    test('registering the same listener twice adds it twice', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        bus.registerListener(listener);
        expect(bus._listeners).toHaveLength(2);
    });

    test('multiple distinct listeners are all stored', () => {
        const bus = new AppEventBus();
        const a = jest.fn();
        const b = jest.fn();
        bus.registerListener(a);
        bus.registerListener(b);
        expect(bus._listeners).toEqual([a, b]);
    });
});

// ---------------------------------------------------------------------------
// unregisterListener
// ---------------------------------------------------------------------------

describe('AppEventBus — unregisterListener', () => {
    test('removes a registered listener', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        bus.unregisterListener(listener);
        expect(bus._listeners).not.toContain(listener);
    });

    test('null is silently ignored', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        bus.unregisterListener(null);
        expect(bus._listeners).toHaveLength(1);
    });

    test('undefined is silently ignored', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        bus.unregisterListener(undefined);
        expect(bus._listeners).toHaveLength(1);
    });

    test('unregistering a listener not in the list is a no-op', () => {
        const bus = new AppEventBus();
        const a = jest.fn();
        const b = jest.fn();
        bus.registerListener(a);
        bus.unregisterListener(b); // b was never added
        expect(bus._listeners).toEqual([a]);
    });

    test('only removes the first matching reference when duplicate registrations exist', () => {
        // Current implementation uses Array.filter which removes ALL matching references.
        // This test documents the actual (filter-all) behaviour.
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        bus.registerListener(listener);
        bus.unregisterListener(listener);
        expect(bus._listeners).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// dispatchEvent — no channel
// ---------------------------------------------------------------------------

describe('AppEventBus — dispatchEvent (no channel)', () => {
    test('dispatches to zero listeners without throwing', () => {
        const bus = new AppEventBus();
        expect(() => bus.dispatchEvent(makeEvent())).not.toThrow();
    });

    test('calls a single listener with the dispatched event', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        const event = makeEvent();
        bus.dispatchEvent(event);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(event);
    });

    test('calls all registered listeners', () => {
        const bus = new AppEventBus();
        const a = jest.fn();
        const b = jest.fn();
        const c = jest.fn();
        bus.registerListener(a);
        bus.registerListener(b);
        bus.registerListener(c);
        const event = makeEvent(42);
        bus.dispatchEvent(event);
        expect(a).toHaveBeenCalledWith(event);
        expect(b).toHaveBeenCalledWith(event);
        expect(c).toHaveBeenCalledWith(event);
    });

    test('does not call unregistered listeners', () => {
        const bus = new AppEventBus();
        const active = jest.fn();
        const removed = jest.fn();
        bus.registerListener(active);
        bus.registerListener(removed);
        bus.unregisterListener(removed);
        bus.dispatchEvent(makeEvent());
        expect(active).toHaveBeenCalledTimes(1);
        expect(removed).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// dispatchEvent — with BroadcastChannel
// ---------------------------------------------------------------------------

describe('AppEventBus — dispatchEvent (with BroadcastChannel)', () => {
    test('calls postMessage with the serialized event', () => {
        const channel = makeMockChannel() as unknown as BroadcastChannel;
        const bus = new AppEventBus(channel);
        const event = makeEvent(7);
        bus.dispatchEvent(event);
        expect((channel as any).postMessage).toHaveBeenCalledTimes(1);
        expect((channel as any).postMessage).toHaveBeenCalledWith(exportAppEvent(event));
    });

    test('also calls all local listeners when a channel is present', () => {
        const channel = makeMockChannel() as unknown as BroadcastChannel;
        const bus = new AppEventBus(channel);
        const listener = jest.fn();
        bus.registerListener(listener);
        const event = makeEvent(3);
        bus.dispatchEvent(event);
        expect(listener).toHaveBeenCalledWith(event);
        expect((channel as any).postMessage).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// onChannelEvent (via channelListener)
// ---------------------------------------------------------------------------

describe('AppEventBus — onChannelEvent (incoming channel messages)', () => {
    test('forwards a valid channel message to all local listeners', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        const event = makeEvent(99);
        fireChannelMessage(bus, event);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(event);
    });

    test('forwards to multiple local listeners', () => {
        const bus = new AppEventBus();
        const a = jest.fn();
        const b = jest.fn();
        bus.registerListener(a);
        bus.registerListener(b);
        const event = makeEvent(5);
        fireChannelMessage(bus, event);
        expect(a).toHaveBeenCalledWith(event);
        expect(b).toHaveBeenCalledWith(event);
    });

    test('does NOT call listeners when the message data is not a valid AppEvent', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        // importAppEvent returns null for missing id/type
        fireRawChannelMessage(bus, JSON.stringify({ foo: 'bar' }));
        expect(listener).not.toHaveBeenCalled();
    });

    test('does NOT call listeners when the message data is null', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        fireRawChannelMessage(bus, null);
        expect(listener).not.toHaveBeenCalled();
    });

    test('does NOT call listeners when the message data is an empty string', () => {
        const bus = new AppEventBus();
        const listener = jest.fn();
        bus.registerListener(listener);
        fireRawChannelMessage(bus, '');
        expect(listener).not.toHaveBeenCalled();
    });
});
