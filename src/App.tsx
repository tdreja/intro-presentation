import { type ReactElement } from 'react';
import { EventBus } from './communication/EventBus.tsx';
import { PLACEHOLDER_IMAGE } from './model/slides/Image.ts';
import { AppState } from './communication/AppState.tsx';

export const App = (): ReactElement => {
    return (
        <EventBus>
            <AppState>
                <p>Test</p>
                <img src={PLACEHOLDER_IMAGE} alt="Placeholder" />
            </AppState>
        </EventBus>
    );
};
