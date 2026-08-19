import { type ReactElement } from 'react';
import { EventBus } from './communication/EventBus.tsx';
import { PLACEHOLDER_IMAGE } from './model/slides/Image.ts';
import { AppSlideshow } from './communication/AppSlideshow.tsx';

export const App = (): ReactElement => {
    return (
        <EventBus>
            <AppSlideshow>
                <p>Test</p>
                <img src={PLACEHOLDER_IMAGE} alt="Placeholder" />
            </AppSlideshow>
        </EventBus>
    );
};
