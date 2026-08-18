import { Temporal } from '@js-temporal/polyfill';

/**
 * Describes an internal App-ID number with the following scheme:
 * <ul>
 *     <li>Relevant prefix describing the type of ID</li>
 *     <li>First number: Year of the ID</li>
 *     <li>Second number: Month of the ID</li>
 *     <li>Third number: Day of the ID</li>
 *     <li>Fourth number: Hour of the ID</li>
 *     <li>Fifth number: Minute of the ID</li>
 *     <li>Sixth number: Second of the ID</li>
 *     <li>Seventh number: Millisecond of the ID</li>
 * </ul>
 */
export type AppId = `${string}-${number}-${number}-${number}-${number}-${number}-${number}-${number}`;

const APP_ID_REGEX = /^[a-zA-Z]+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/;

/**
 * Parses the given String as AppId or null
 * @param id Input ID
 */
export function asAppId(id?: string | null): AppId | null {
    if (id && APP_ID_REGEX.test(id)) {
        return id as AppId;
    }
    return null;
}

/**
 * Creates a new AppID for the current time
 * @param prefix Optional prefix of the ID
 * @param date Override the current time as a {@link Temporal.PlainDateTime}
 */
export function newAppId(prefix?: string | null, date?: Temporal.PlainDateTime | null): AppId {
    const pre = prefix ?? 'app';
    const now = date ?? Temporal.Now.plainDateTimeISO();
    const year = now.year;
    const month = String(now.month).padStart(2, '0');
    const day = String(now.day).padStart(2, '0');
    const hour = String(now.hour).padStart(2, '0');
    const minute = String(now.minute).padStart(2, '0');
    const second = String(now.second).padStart(2, '0');
    const millisecond = String(now.millisecond).padStart(3, '0');
    return `${pre}-${year}-${month}-${day}-${hour}-${minute}-${second}-${millisecond}` as AppId;
}
