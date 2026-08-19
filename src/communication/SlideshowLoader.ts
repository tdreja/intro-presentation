import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../model/slides/SlideShow.ts';

const SLIDESHOW_STORAGE_KEY = 'slideshow';

function pickNewest(a: SlideShow, b: SlideShow): SlideShow {
    return a.id >= b.id ? a : b;
}

function loadFromStorage(): SlideShow | null {
    const stringValue = localStorage.getItem(SLIDESHOW_STORAGE_KEY);
    if (stringValue) {
        try {
            return SLIDE_SHOW_CONVERTER.fromJson(JSON.parse(stringValue));
        }
        catch {
            return null;
        }
    }
    return null;
}

export function loadSlideshowFromStorage(exportedSlideshow?: unknown): SlideShow | null {
    const fromStorage = loadFromStorage();
    const fromExport = SLIDE_SHOW_CONVERTER.fromJson(exportedSlideshow);
    if (fromStorage && fromExport) {
        return pickNewest(fromStorage, fromExport);
    }
    return fromStorage ?? fromExport;
}

export function storeSlideshowToStorage(slideshow: SlideShow): void {
    const fromStorage = loadFromStorage();
    if (fromStorage && fromStorage.id >= slideshow.id) {
        return;
    }
    localStorage.setItem(SLIDESHOW_STORAGE_KEY, JSON.stringify(SLIDE_SHOW_CONVERTER.toJson(slideshow)));
}
