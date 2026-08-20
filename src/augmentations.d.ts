/// <reference types="vite/client" />

import type { RawJsonSlideShow } from './model/slides/SlideShow.ts';
import type { RawJsonCountdown } from './model/slides/Countdown.ts';

declare module '*.svg?raw' {
    const content: string;
    export default content;
}

declare global {
    interface Window {
        startupSlideShow?: RawJsonSlideShow
        startupCountdown?: RawJsonCountdown
    }
}
