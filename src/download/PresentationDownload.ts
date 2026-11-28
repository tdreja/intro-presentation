import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../model/slides/SlideShow.ts';
import { COUNTDOWN_CONVERTER, type Countdown } from '../model/slides/Countdown.ts';

/**
 * ID of the inline script in index.html that sets window.startupSlideShow and window.startupCountdown.
 */
export const STARTUP_SCRIPT_ID = 'startup-data';

const FALLBACK_FILE_NAME = 'presentation.html';

/**
 * Copy of the page as it was shipped, taken before React renders into it.
 */
let pageSnapshot: HTMLElement | null = null;

/**
 * Remembers the page as it was loaded. Must run before React renders, so the copy has an empty #root
 * and none of the runtime changes (theme attribute, portals, ...).
 */
export function capturePageSnapshot(): void {
    pageSnapshot = document.documentElement.cloneNode(true) as HTMLElement;
}

/**
 * Serializes a value as a JS literal that is safe inside an inline <script>:
 * escaping every "<" keeps texts like "</script>" or "<!--" from ending the script early.
 */
function toScriptLiteral(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * Content of the startup script that restores the given slideshow and countdown when the page is opened.
 */
export function startupScriptContent(slideShow: SlideShow, countdown: Countdown): string {
    return [
        '',
        `window.startupSlideShow = ${toScriptLiteral(SLIDE_SHOW_CONVERTER.toJson(slideShow))};`,
        `window.startupCountdown = ${toScriptLiteral(COUNTDOWN_CONVERTER.toJson(countdown))};`,
        '',
    ].join('\n');
}

function findStartupScript(root: HTMLElement): HTMLScriptElement | null {
    const byId = root.querySelector<HTMLScriptElement>(`script#${STARTUP_SCRIPT_ID}`);
    if (byId) {
        return byId;
    }
    // Pages built before the script had an ID
    return Array.from(root.querySelectorAll<HTMLScriptElement>('head script'))
        .find(script => !script.src && script.textContent?.includes('window.startupSlideShow')) ?? null;
}

/**
 * Rebuilds the full HTML of the page from the snapshot, with the given slideshow and countdown as startup data.
 * The snapshot itself is not changed.
 */
export function buildPresentationHtml(snapshot: HTMLElement, slideShow: SlideShow, countdown: Countdown): string {
    const page = snapshot.cloneNode(true) as HTMLElement;
    const content = startupScriptContent(slideShow, countdown);
    const existing = findStartupScript(page);
    if (existing) {
        existing.textContent = content;
    }
    else {
        const script = page.ownerDocument.createElement('script');
        script.id = STARTUP_SCRIPT_ID;
        script.textContent = content;
        const head = page.querySelector('head') ?? page;
        // Before the app bundle, so the data is set when the app starts
        head.insertBefore(script, head.querySelector('script'));
    }
    // React renders into #root on startup; anything in there would only flash before being replaced
    page.querySelector('#root')?.replaceChildren();
    return `<!doctype html>\n${page.outerHTML}`;
}

/**
 * Name of the downloaded file: the name of the current page, if it is an HTML file.
 */
export function downloadFileName(pathname: string): string {
    const name = decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1));
    return /\.html?$/i.test(name) ? name : FALLBACK_FILE_NAME;
}

/**
 * Name of the downloaded JSON file: the name of the current page with a .json extension.
 */
export function jsonFileName(pathname: string): string {
    return downloadFileName(pathname).replace(/\.html?$/i, '.json');
}

/**
 * The slideshow and countdown as a JSON file, which {@link parsePresentationJson} reads back.
 */
export function presentationJson(slideShow: SlideShow, countdown: Countdown): string {
    return JSON.stringify({
        slideShow: SLIDE_SHOW_CONVERTER.toJson(slideShow),
        countdown: COUNTDOWN_CONVERTER.toJson(countdown),
    }, null, 2);
}

/**
 * Reads a file written by {@link presentationJson}; a bare slideshow is accepted as well.
 * Null if the text is no valid JSON or holds no valid slideshow. The countdown is optional.
 */
export function parsePresentationJson(text: string): { slideShow: SlideShow, countdown: Countdown | null } | null {
    let json: unknown;
    try {
        json = JSON.parse(text);
    }
    catch {
        return null;
    }
    if (!json || typeof json !== 'object') {
        return null;
    }
    const wrapped = 'slideShow' in json;
    const parsed = json as { slideShow?: unknown, countdown?: unknown };
    const slideShow = SLIDE_SHOW_CONVERTER.fromJson(wrapped ? parsed.slideShow : json);
    if (!slideShow) {
        return null;
    }
    const countdown = wrapped ? COUNTDOWN_CONVERTER.fromJson(parsed.countdown) : null;
    return { slideShow, countdown };
}

/**
 * Downloads the slideshow and countdown as a JSON file.
 */
export function downloadPresentationJson(slideShow: SlideShow, countdown: Countdown, fileName?: string): void {
    saveFile(
        presentationJson(slideShow, countdown),
        'application/json;charset=utf-8',
        fileName ?? jsonFileName(window.location.pathname),
    );
}

/**
 * Downloads the page with the given slideshow and countdown baked in. There is no server to download from,
 * so the HTML is rebuilt from the page snapshot and saved through a temporary link.
 */
export function downloadPresentation(slideShow: SlideShow, countdown: Countdown, fileName?: string): void {
    const snapshot = pageSnapshot ?? (document.documentElement.cloneNode(true) as HTMLElement);
    const html = buildPresentationHtml(snapshot, slideShow, countdown);
    saveFile(html, 'text/html;charset=utf-8', fileName ?? downloadFileName(window.location.pathname));
}

/**
 * Saves the content as a file through a temporary link.
 */
function saveFile(content: string, type: string, fileName: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser a moment to start the download before the URL becomes invalid
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
