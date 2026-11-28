import type { JsonConverter } from '../model/json/json.ts';
import { APP_ID_CONVERTER, type AppId } from '../model/identifier/AppId.ts';
import { COUNTDOWN_CONVERTER, type Countdown } from '../model/slides/Countdown.ts';

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
    try {
        localStorage.setItem(key, JSON.stringify(converter.toJson(data)));
    }
    catch (error) {
        // e.g. QuotaExceededError: never let a full storage break the UI
        console.error(`Could not write '${key}' to localStorage`, error);
    }
}

export function currentSlideIdToStorage(currentSlideId: AppId | null) {
    return toStorage(APP_ID_CONVERTER, 'current-slide-id', currentSlideId, (newer, older) => !!(newer && older) && newer >= older);
}

export function currentSlideIdFromStorage(): AppId | null {
    return fromStorage(APP_ID_CONVERTER, 'current-slide-id');
}

export function countdownToStorage(countdown: Countdown) {
    return toStorage(COUNTDOWN_CONVERTER, 'countdown-time', countdown, (newer, older) => newer.countdownId >= older.countdownId);
}

export function countdownFromStorage(): Countdown | null {
    return fromStorage(COUNTDOWN_CONVERTER, 'countdown-time');
}
