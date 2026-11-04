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
 * Downloads the page with the given slideshow and countdown baked in. There is no server to download from,
 * so the HTML is rebuilt from the page snapshot and saved through a temporary link.
 */
export function downloadPresentation(slideShow: SlideShow, countdown: Countdown, fileName?: string): void {
    const snapshot = pageSnapshot ?? (document.documentElement.cloneNode(true) as HTMLElement);
    const html = buildPresentationHtml(snapshot, slideShow, countdown);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName ?? downloadFileName(window.location.pathname);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser a moment to start the download before the URL becomes invalid
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
