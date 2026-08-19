import { importSlideShow, importSlideShowJSON, type SlideShow } from '../model/slides/SlideShow.ts';

const SLIDESHOW_STORAGE_KEY = 'slideshow';

function pickNewest(a: SlideShow, b: SlideShow): SlideShow {
    return a.id >= b.id ? a : b;
}

export function loadSlideshowFromStorage(exportedSlideshow?: unknown): SlideShow | null {
    const fromStorage = importSlideShowJSON(localStorage.getItem(SLIDESHOW_STORAGE_KEY));
    const fromExport = exportedSlideshow
        ? importSlideShow(exportedSlideshow)
        : null;

    if (fromStorage && fromExport) {
        return pickNewest(fromStorage, fromExport);
    }
    return fromStorage ?? fromExport;
}
