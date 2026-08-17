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
 * </ul>
 */
export type AppId = `${string}-${number}-${number}-${number}-${number}-${number}-${number}`;

const APP_ID_REGEX = /^[a-zA-Z]+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/;

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
 * @param date Override the current time
 */
export function newAppId(prefix?: string | null, date?: Date | null): AppId {
    const pre = prefix ?? 'app';
    const now = date ?? new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${pre}-${year}-${month}-${day}-${hour}-${minute}-${second}` as AppId;
}
