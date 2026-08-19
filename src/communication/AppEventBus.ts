import { type AppEvent, exportAppEvent, importAppEvent } from '../model/event/Event.ts';
import { createContext, useContext } from 'react';

/**
 * Listener receives events and reacts to them
 */
export type AppEventListener<PAYLOAD> = (event: AppEvent<PAYLOAD>) => void;

/**
 * Listener receives events from the broadcast channel from other tabs
 */
export type ChannelListener = (event: MessageEvent) => void;

/**
 * Main interface for all events within the application
 */
export class AppEventBus {
    readonly _channel?: BroadcastChannel;
    readonly _channelListener: ChannelListener;
    readonly _listeners: Map<string, AppEventListener<unknown>>;

    constructor(channel?: BroadcastChannel, lastChannelListener?: ChannelListener) {
        this._channel = channel;
        this._listeners = new Map<string, AppEventListener<unknown>>();
        this._channelListener = ev => this.onChannelEvent(ev);
        if (this._channel) {
            if (lastChannelListener) {
                this._channel.removeEventListener('message', lastChannelListener);
            }
            this._channel.addEventListener('message', this._channelListener);
        }
    }

    public registerListener<PAYLOAD>(listenerName?: string, listener?: AppEventListener<PAYLOAD> | null): void {
        if (listenerName && listener) {
            this._listeners.set(listenerName, listener as AppEventListener<unknown>);
        }
    }

    public unregisterListener(listenerName?: string): void {
        if (listenerName) {
            this._listeners.delete(listenerName);
        }
    }

    public dispatchEvent<PAYLOAD>(event: AppEvent<PAYLOAD>): void {
        if (!event.remoteOnly) {
            this._listeners.forEach(onEvent => onEvent(event));
        }
        if (this._channel) {
            this._channel.postMessage(exportAppEvent(event));
        }
    }

    get channelListener(): ChannelListener {
        return this._channelListener;
    }

    private onChannelEvent(event: MessageEvent): void {
        const appEvent = importAppEvent(event.data);
        if (appEvent) {
            console.debug('Received event from another tab.', appEvent);
            this._listeners.forEach(onEvent => onEvent(appEvent));
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
