/// <reference types="vite/client" />

import type { RawJsonSlideShow } from './model/slides/SlideShow.ts';

declare module '*.svg?raw' {
    const content: string;
    export default content;
}

declare global {
    interface Window {
        DEFAULT_SLIDESHOW?: RawJsonSlideShow;
    }
}
