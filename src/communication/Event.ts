import { type Context, createContext, useContext } from 'react';

/**
 * Marker interface for all events within this app
 */
export interface AppEvent {

}

/**
 * Listener receives events and reacts to them
 */
export type AppEventListener = (event: AppEvent) => void;

/**
 * Shortcut for operations on AppEventListeners, such as registering or unregistering them
 */
export type AppEventListenerOperation = (listener: AppEventListener) => void;

/**
 * Main interaction point for all events within the application
 */
export interface AppEventBus {
    /**
     * Registers a listener to receive events
     */
    registerListener: AppEventListenerOperation
    /**
     * Unregisters a listener so it no longer receives events
     */
    unregisterListener: AppEventListenerOperation
    /**
     * Dispatches an event to all registered listeners
     */
    dispatchEvent: (event: AppEvent) => void
}

const noopAppEventBus: AppEventBus = {
    registerListener: (_: AppEventListener) => {},
    unregisterListener: (_: AppEventListener) => {},
    dispatchEvent: (_: AppEvent) => {},
};

/**
 * Context to access the AppEventBus from any component within the application
 */
export const AppEventContext: Context<AppEventBus> = createContext<AppEventBus>(noopAppEventBus);

/**
 * Accesses the AppEventBus from any component within the application
 */
export const useAppEventBus = (): AppEventBus => useContext(AppEventContext);
