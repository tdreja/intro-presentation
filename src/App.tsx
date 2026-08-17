import { type ReactElement } from 'react';
import { EventBus } from './communication/EventBus.tsx';

export const App = (): ReactElement => {
    return (
        <EventBus>
            <p>Test</p>
        </EventBus>
    );
};
