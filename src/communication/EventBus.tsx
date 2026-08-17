import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import {
    type AppEvent,
    type AppEventBus,
    AppEventContext,
    type AppEventListener,
    type AppEventListenerOperation,
} from './Event.ts';
import { CHANNEL_NAME, type ChannelListener } from './common.ts';

type Props = {
    children?: ReactElement | ReactElement[]
};

const channel: BroadcastChannel = new BroadcastChannel(CHANNEL_NAME);
let channelListener: ChannelListener = () => {
};

export const EventBus = ({ children }: Props): ReactElement => {
    // Setup the state for the app context
    const [eventListeners, setEventListeners] = useState<Array<AppEventListener>>([]);
    const registerEventListener = useCallback<AppEventListenerOperation>((input) => {
        setEventListeners(prev => [...prev, input]);
    }, [setEventListeners]);
    const unregisterEventListener = useCallback<AppEventListenerOperation>((input) => {
        setEventListeners(prev => prev.filter(listener => listener !== input));
    }, [setEventListeners]);
    const dispatchEvent = useCallback((event: AppEvent) => {
        // Notify all local listeners
        eventListeners.forEach(listener => listener(event));
        // Notify all global listeners
        channel.postMessage(JSON.stringify(event));
    }, [eventListeners]);

    // Attach the events to the global pipeline
    const onChannelEvent: ChannelListener = useCallback<ChannelListener>((event) => {
        console.log('Received message from channel', event.data);
    }, []);
    useEffect(() => {
        channel.removeEventListener('message', channelListener);
        channelListener = onChannelEvent;
        channel.addEventListener('message', channelListener);
    }, [onChannelEvent]);

    // Store the bus as a memoized value to avoid unnecessary re-renders of the context provider
    const eventBus: AppEventBus = useMemo(() => ({
        dispatchEvent,
        registerListener: registerEventListener,
        unregisterListener: unregisterEventListener,
    }), [dispatchEvent, registerEventListener, unregisterEventListener]);

    return (
        <AppEventContext.Provider value={eventBus}>
            {children}
        </AppEventContext.Provider>
    );
};
