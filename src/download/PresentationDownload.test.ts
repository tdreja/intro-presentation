// @vitest-environment jsdom
import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import type { AppId } from '../model/identifier/AppId';
import { PLACEHOLDER_IMAGE } from '../model/slides/Image';
import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../model/slides/SlideShow';
import { COUNTDOWN_CONVERTER, type Countdown } from '../model/slides/Countdown';
import {
    buildPresentationHtml,
    downloadFileName,
    STARTUP_SCRIPT_ID,
    startupScriptContent,
} from './PresentationDownload';

const SLIDE_SHOW: SlideShow = {
    id: 'show-2026-11-04-12-00-00-000' as AppId,
    timePerSlide: Temporal.Duration.from({ seconds: 10 }),
    darkMode: true,
    slides: [
        {
            slideId: 'slide-2026-11-04-12-00-00-001' as AppId,
            slices: [
                { sliceType: 'text', width: 60, text: '# Hi\n\n</script><script>alert(1)</script> <!-- x -->', verticalAlign: 'bottom' },
                { sliceType: 'image', width: 40, image: PLACEHOLDER_IMAGE },
            ],
        },
    ],
};

const COUNTDOWN: Countdown = {
    countdownId: 'countdown-2026-11-04-12-00-00-000' as AppId,
    countdownTime: Temporal.PlainDateTime.from('2099-01-01T10:00:00'),
    showSmallCountdownFor: Temporal.Duration.from({ minutes: 5 }),
    showLargeCountdownFor: Temporal.Duration.from({ minutes: 1 }),
};

const OLD_DATA = 'window.startupSlideShow = { id: "old" }; window.startupCountdown = null;';

function page(head: string, body = '<div id="root"></div>'): HTMLElement {
    const doc = document.implementation.createHTMLDocument('');
    doc.documentElement.innerHTML = `<head>${head}</head><body>${body}</body>`;
    return doc.documentElement;
}

function parse(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Runs a startup script in isolation and returns what it assigned to window.
 */
function runStartupScript(content: string): { startupSlideShow?: unknown, startupCountdown?: unknown } {
    const fakeWindow: Record<string, unknown> = {};
    new Function('window', content)(fakeWindow);
    return fakeWindow;
}

describe('startupScriptContent', () => {
    test('restores the same slideshow and countdown', () => {
        const result = runStartupScript(startupScriptContent(SLIDE_SHOW, COUNTDOWN));
        expect(SLIDE_SHOW_CONVERTER.fromJson(result.startupSlideShow)).toEqual(SLIDE_SHOW);
        expect(COUNTDOWN_CONVERTER.fromJson(result.startupCountdown)).toEqual(COUNTDOWN);
    });

    test('escapes "<" so texts cannot end the script', () => {
        const content = startupScriptContent(SLIDE_SHOW, COUNTDOWN);
        expect(content).not.toContain('</script>');
        expect(content).not.toContain('<!--');
        expect(content).toContain('\\u003c/script>');
    });
});

describe('buildPresentationHtml', () => {
    test('replaces the startup script found by its ID', () => {
        const snapshot = page(`<script id="${STARTUP_SCRIPT_ID}">${OLD_DATA}</script><script type="module">app()</script>`);
        const doc = parse(buildPresentationHtml(snapshot, SLIDE_SHOW, COUNTDOWN));
        const scripts = doc.querySelectorAll('script');
        expect(scripts).toHaveLength(2);
        expect(scripts[0].id).toBe(STARTUP_SCRIPT_ID);
        expect(scripts[0].textContent).toBe(startupScriptContent(SLIDE_SHOW, COUNTDOWN));
        expect(scripts[1].textContent).toBe('app()');
    });

    test('finds a startup script without ID by its content', () => {
        const snapshot = page(`<script>${OLD_DATA}</script><script type="module">app()</script>`);
        const doc = parse(buildPresentationHtml(snapshot, SLIDE_SHOW, COUNTDOWN));
        expect(doc.querySelectorAll('script')).toHaveLength(2);
        expect(doc.querySelectorAll('script')[0].textContent).toBe(startupScriptContent(SLIDE_SHOW, COUNTDOWN));
    });

    test('inserts a startup script before the app when there is none', () => {
        const snapshot = page('<title>x</title><script type="module">app()</script>');
        const doc = parse(buildPresentationHtml(snapshot, SLIDE_SHOW, COUNTDOWN));
        const scripts = doc.querySelectorAll('script');
        expect(scripts).toHaveLength(2);
        expect(scripts[0].id).toBe(STARTUP_SCRIPT_ID);
        expect(scripts[1].textContent).toBe('app()');
    });

    test('the generated page parses back to the same data, despite "</script>" in a text', () => {
        const snapshot = page(`<script id="${STARTUP_SCRIPT_ID}">${OLD_DATA}</script>`);
        const doc = parse(buildPresentationHtml(snapshot, SLIDE_SHOW, COUNTDOWN));
        const result = runStartupScript(doc.getElementById(STARTUP_SCRIPT_ID)!.textContent!);
        expect(SLIDE_SHOW_CONVERTER.fromJson(result.startupSlideShow)).toEqual(SLIDE_SHOW);
    });

    test('starts with a doctype, keeps the rest of the page and empties #root', () => {
        const snapshot = page('<style>.a{}</style>', '<div id="root"><p>rendered</p></div>');
        const html = buildPresentationHtml(snapshot, SLIDE_SHOW, COUNTDOWN);
        expect(html.startsWith('<!doctype html>\n<html')).toBe(true);
        const doc = parse(html);
        expect(doc.querySelector('style')?.textContent).toBe('.a{}');
        expect(doc.getElementById('root')?.childNodes).toHaveLength(0);
    });

    test('does not change the snapshot', () => {
        const snapshot = page(`<script id="${STARTUP_SCRIPT_ID}">${OLD_DATA}</script>`, '<div id="root"><p>x</p></div>');
        const before = snapshot.outerHTML;
        buildPresentationHtml(snapshot, SLIDE_SHOW, COUNTDOWN);
        expect(snapshot.outerHTML).toBe(before);
    });
});

describe('downloadFileName', () => {
    test.each([
        ['/presentations/intro.html', 'intro.html'],
        ['/C:/Users/me/My%20Talk.htm', 'My Talk.htm'],
        ['/', 'presentation.html'],
        ['/app/', 'presentation.html'],
        ['/download.php', 'presentation.html'],
    ])('%s → %s', (pathname, expected) => {
        expect(downloadFileName(pathname)).toBe(expected);
    });
});
