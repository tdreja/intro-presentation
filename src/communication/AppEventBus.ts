import { createContext, useContext } from 'react';
import { type AppEvent, EVENT_CONVERTER, type EventType } from '../model/event/Event.ts';

/**
 * Listener receives events and reacts to them
 */
export type AppEventListener<PAYLOAD> = (event: AppEvent<PAYLOAD>) => void;

/**
 * Listener receives events from the broadcast channel from other tabs
 */
export type ChannelListener = (event: MessageEvent) => void;

interface InternalListener {
    readonly onEvent: AppEventListener<unknown>
    readonly eventType: EventType
}

/**
 * Main interface for all events within the application
 */
export class AppEventBus {
    readonly _channel?: BroadcastChannel;
    readonly _channelListener: ChannelListener;
    readonly _listeners: Map<string, InternalListener>;

    constructor(channel?: BroadcastChannel, lastChannelListener?: ChannelListener) {
        this._channel = channel;
        this._listeners = new Map<string, InternalListener>();
        this._channelListener = ev => this.onChannelEvent(ev);
        if (this._channel) {
            if (lastChannelListener) {
                this._channel.removeEventListener('message', lastChannelListener);
            }
            this._channel.addEventListener('message', this._channelListener);
        }
    }

    public registerListener<PAYLOAD>(
        listenerName?: string,
        eventType?: EventType,
        listener?: AppEventListener<PAYLOAD> | null,
    ): void {
        if (listenerName && listener && eventType) {
            this._listeners.set(listenerName, {
                eventType,
                onEvent: listener as AppEventListener<unknown>,
            });
        }
    }

    public unregisterListener(listenerName?: string): void {
        if (listenerName) {
            this._listeners.delete(listenerName);
        }
    }

    public dispatchEvent<PAYLOAD>(event: AppEvent<PAYLOAD>): void {
        if (!event.remoteOnly) {
            for (const listener of this._listeners.values()) {
                if (listener.eventType === event.type) {
                    listener.onEvent(event);
                }
            }
        }
        if (this._channel) {
            this._channel.postMessage(JSON.stringify(EVENT_CONVERTER.toJson(event)));
        }
    }

    get channelListener(): ChannelListener {
        return this._channelListener;
    }

    private onChannelEvent(event: MessageEvent): void {
        const str = event.data;
        if (typeof str !== 'string') {
            return;
        }
        const appEvent = EVENT_CONVERTER.fromJson(JSON.parse(str));
        if (appEvent) {
            console.debug('Received event from another tab.', appEvent);
            for (const listener of this._listeners.values()) {
                if (listener.eventType === appEvent.type) {
                    listener.onEvent(appEvent);
                }
            }
        }
    }
}

/**
 * Context to allow access to the AppEventBus from any component
 */
export const AppEventContext = createContext<AppEventBus>(new AppEventBus());

/**
 * Hook to access the AppEventBus from any component
 */
export const useAppEventBus = () => useContext(AppEventContext);
