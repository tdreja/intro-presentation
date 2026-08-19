import { type ReactElement, useState } from 'react';
import { AppEventBus, AppEventContext, type ChannelListener } from './AppEventBus.ts';

type Props = {
    children?: ReactElement | ReactElement[]
};

const channel: BroadcastChannel = new BroadcastChannel('intro-presentation-channel');
let lastListener: ChannelListener = () => {
};

/**
 * Provides access to the AppEventBus for all child components
 * @constructor
 */
export const EventBus = ({ children }: Props): ReactElement => {
    // Set up the state for the app context
    const [eventBus] = useState<AppEventBus>(() => {
        const bus = new AppEventBus(channel, lastListener);
        lastListener = bus.channelListener;
        return bus;
    });
    return (
        <AppEventContext.Provider value={eventBus}>
            {children}
        </AppEventContext.Provider>
    );
};
