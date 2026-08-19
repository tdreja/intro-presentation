import { type ReactElement } from 'react';
import { EventBus } from './communication/EventBus.tsx';
import { PLACEHOLDER_IMAGE } from './model/slides/Image.ts';

export const App = (): ReactElement => {
    return (
        <EventBus>
            <p>Test</p>
            <img src={PLACEHOLDER_IMAGE} alt="Placeholder" />
        </EventBus>
    );
};
