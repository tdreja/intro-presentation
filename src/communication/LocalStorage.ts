import type { JsonConverter } from '../model/json/json.ts';
import { APP_ID_CONVERTER, type AppId } from '../model/identifier/AppId.ts';
import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../model/slides/SlideShow.ts';
import { Temporal } from '@js-temporal/polyfill';
import { DATE_TIME_CONVERTER } from '../model/json/common.ts';

export function fromStorage<DATA, JSON>(converter: JsonConverter<DATA, JSON>, key: string): DATA | null {
    const string = localStorage.getItem(key);
    if (string && typeof string === 'string') {
        try {
            return converter.fromJson(JSON.parse(string));
        }
        catch {
            return null;
        }
    }
    return null;
}

export function toStorage<DATA, JSON>(
    converter: JsonConverter<DATA, JSON>,
    key: string,
    data: DATA,
    isNewerThan: (potentialNewer: DATA, potentialOlder: DATA) => boolean,
): void {
    const existing = fromStorage(converter, key);
    if (existing && isNewerThan(existing, data)) {
        return;
    }
    localStorage.setItem(key, JSON.stringify(converter.toJson(data)));
}

export function slideShowToStorage(slideShow: SlideShow) {
    return toStorage(SLIDE_SHOW_CONVERTER, 'slide-show', slideShow, (newer, older) => newer.id >= older.id);
}

export function slideShowFromStorage(): SlideShow | null {
    return fromStorage(SLIDE_SHOW_CONVERTER, 'slide-show');
}

export function currentSlideIdToStorage(currentSlideId: AppId) {
    return toStorage(APP_ID_CONVERTER, 'current-slide-id', currentSlideId, (newer, older) => newer >= older);
}

export function currentSlideIdFromStorage(): AppId | null {
    return fromStorage(APP_ID_CONVERTER, 'current-slide-id');
}

export function countdownTimeToStorage(countdownTime: Temporal.PlainDateTime) {
    return toStorage(DATE_TIME_CONVERTER, 'countdown-time', countdownTime, (newer, older) => Temporal.PlainDateTime.compare(newer, older) >= 0);
}

export function countdownTimeFromStorage(): Temporal.PlainDateTime | null {
    return fromStorage(DATE_TIME_CONVERTER, 'countdown-time');
}
