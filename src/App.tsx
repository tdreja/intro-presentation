import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { AppEventBus, AppEventContext } from './communication/AppEventBus.ts';
import { findSlideOrFirst, pickNewest, SLIDE_SHOW_CONVERTER, type SlideShow } from './model/slides/SlideShow.ts';
import { type AppId, newAppId } from './model/identifier/AppId.ts';
import {
    type Countdown,
    COUNTDOWN_CONVERTER,
    FALLBACK_COUNTDOWN,
    pickNewestAllowedCountdown,
} from './model/slides/Countdown.ts';
import {
    countdownFromStorage,
    countdownToStorage,
    currentSlideIdFromStorage,
    currentSlideIdToStorage,
} from './communication/LocalStorage.ts';
import { loadSlideShow, requestPersistentStorage, writeSlideShow } from './communication/SlideShowDatabase.ts';
import { Spinner } from 'react-bootstrap';
import { FALLBACK_SLIDESHOW, SlideShowContext, type SlideShowState } from './communication/context/Slideshow.context.ts';
import { CurrentSlideContext, type CurrentSlideState } from './communication/context/CurrentSlide.context.ts';
import { CountdownContext, type CountdownState } from './communication/context/Countdown.context.ts';
import { type AppEvent, goToSlideEvent, replaceSlideshowEvent, updateCountdownEvent } from './model/event/Event.ts';
import { SlideShowPage } from './pages/slideshow/SlideShow.page.tsx';
import { EditorPage } from './pages/editor/Editor.page.tsx';
import { compressSlideShowImages } from './model/slides/ImageCompression.ts';
import { I18N, i18n, type Labels } from './i18n/I18N.ts';

export const App = (): ReactElement => {
    const [source] = useState<AppId>(() => newAppId('app'));
    // Picked once from the browser language
    const [labels] = useState<Labels>(() => i18n());
    // Local to this tab: each tab decides itself whether it presents or edits
    const [mode, setMode] = useState<'slideshow' | 'editor'>('slideshow');

    // Set up the event bus — channel is created here so eventBus always owns it
    const [eventBus] = useState<AppEventBus>(() => {
        const channel = new BroadcastChannel('intro-presentation-channel');
        return new AppEventBus(channel);
    });

    // Pick the newest of the stored data and the data embedded in the HTML, e.g. a downloaded presentation.
    // The stored slideshow comes from IndexedDB (async, see below); until then the HTML one is used.
    const [startup] = useState(() => {
        const htmlSlideShow = SLIDE_SHOW_CONVERTER.fromJson(window.startupSlideShow);
        const storedCountdown = countdownFromStorage();
        const htmlCountdown = COUNTDOWN_CONVERTER.fromJson(window.startupCountdown);
        const countdown = pickNewestAllowedCountdown(htmlCountdown, storedCountdown) ?? FALLBACK_COUNTDOWN;
        return {
            htmlSlideShow,
            countdown,
            countdownStored: countdown === storedCountdown,
            // The HTML brought something newer than this browser knew: it replaces the stored data
            countdownFromHtml: !!htmlCountdown && countdown === htmlCountdown
              && (!storedCountdown || htmlCountdown.countdownId > storedCountdown.countdownId),
        };
    });

    // Prepare the local state for this app!
    const [localSlideShow, setLocalSlideShow] = useState<SlideShow>(startup.htmlSlideShow ?? FALLBACK_SLIDESHOW);
    // Whether the stored slideshow was loaded from IndexedDB; nothing is shown or edited before
    const [slideShowLoaded, setSlideShowLoaded] = useState(false);
    const [localCurrentSlide, setLocalCurrentSlide] = useState<AppId | null>(() => currentSlideIdFromStorage());
    const [localCountdown, setLocalCountdown] = useState<Countdown>(startup.countdown);

    // Add setters with attachment to the eventbus
    const setSlideShow = useCallback((slide: SlideShow) => {
        setLocalSlideShow(slide);
        void writeSlideShow(slide);
        eventBus.dispatchEvent(replaceSlideshowEvent(source, slide));
    }, [eventBus, source, setLocalSlideShow]);
    const setCurrentSlide = useCallback((slideId: AppId | null) => {
        console.log('Setting current slide to', slideId);
        setLocalCurrentSlide(slideId);
        currentSlideIdToStorage(slideId);
        eventBus.dispatchEvent(goToSlideEvent(source, slideId));
    }, [eventBus, source, setLocalCurrentSlide]);
    const setCountdown = useCallback((countdown: Countdown) => {
        setLocalCountdown(countdown);
        countdownToStorage(countdown);
        eventBus.dispatchEvent(updateCountdownEvent(source, countdown));
    }, [eventBus, source, setLocalCountdown]);

    // Re-encode raster images as WEBP (max 2000px wide) in the background, then keep the smaller copy.
    // Not broadcast: every tab loading the same slideshow does this itself.
    useEffect(() => {
        if (!slideShowLoaded) {
            return;
        }
        let cancelled = false;
        compressSlideShowImages(localSlideShow).then((compressed) => {
            if (!cancelled && compressed !== localSlideShow) {
                setLocalSlideShow(compressed);
                void writeSlideShow(compressed);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [localSlideShow, slideShowLoaded]);

    useEffect(() => {
        document.documentElement.lang = labels.language;
    }, [labels.language]);

    // Theme for both the slideshow and the editor
    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', localSlideShow.darkMode === true ? 'dark' : 'light');
        return () => document.documentElement.removeAttribute('data-bs-theme');
    }, [localSlideShow.darkMode]);

    // Keep what was picked on startup, so other tabs and later visits see it too (older data is never overwritten).
    // Open tabs are only told when the HTML brought something newer, e.g. a downloaded presentation.
    useEffect(() => {
        let cancelled = false;
        requestPersistentStorage();
        loadSlideShow().then((stored) => {
            if (cancelled) {
                return;
            }
            const html = startup.htmlSlideShow;
            const slideShow = pickNewest(stored, html) ?? FALLBACK_SLIDESHOW;
            // A newer slideshow may have arrived from another tab while loading
            setLocalSlideShow(current => pickNewest(slideShow, current) ?? slideShow);
            if (slideShow !== stored) {
                // Skip rewriting what is already stored (the slideshow can be several MB)
                void writeSlideShow(slideShow);
            }
            if (html && slideShow === html && (!stored || html.id > stored.id)) {
                eventBus.dispatchEvent(replaceSlideshowEvent(source, html));
            }
            setSlideShowLoaded(true);
        });
        return () => {
            cancelled = true;
        };
    }, [startup, eventBus, source]);
    useEffect(() => {
        if (!startup.countdownStored) {
            countdownToStorage(startup.countdown);
        }
        if (startup.countdownFromHtml) {
            eventBus.dispatchEvent(updateCountdownEvent(source, startup.countdown));
        }
    }, [startup, eventBus, source]);

    // Attach listeners for the remote events!
    useEffect(() => {
        eventBus.registerListener('app-slide-show', 'replace-slideshow', (ev: AppEvent<SlideShow>) => {
            console.log('Received replace-slideshow event', source, ev);
            if (ev.source !== source) {
                // Ignore older slideshows, e.g. from a tab that was opened with an outdated file.
                // Equal IDs are accepted: edits within the same millisecond keep the ID.
                setLocalSlideShow(current => (ev.payload.id >= current.id ? ev.payload : current));
            }
        });
        eventBus.registerListener('app-count-down', 'update-countdown', (ev: AppEvent<Countdown>) => {
            console.log('Received update-countdown event', source, ev);
            if (ev.source !== source) {
                setLocalCountdown(current => (ev.payload.countdownId >= current.countdownId ? ev.payload : current));
            }
        });
        eventBus.registerListener('app-current-slide', 'go-to-slide', (ev: AppEvent<AppId | null>) => {
            console.log('Received go-to-slide event', source, ev);
            if (ev.source !== source) {
                setLocalCurrentSlide(ev.payload);
            }
        });
    }, [source, setLocalSlideShow, setLocalCurrentSlide, setLocalCountdown, eventBus]);

    // Memoize the state tuples for the rest of the app
    const slideShowState: SlideShowState = useMemo(() => [localSlideShow, setSlideShow],
        [localSlideShow, setSlideShow]);
    const currentSlideState: CurrentSlideState = useMemo(() => [findSlideOrFirst(localSlideShow, localCurrentSlide), setCurrentSlide],
        [localSlideShow, localCurrentSlide, setCurrentSlide]);
    const countdownState: CountdownState = useMemo(() => [localCountdown, setCountdown],
        [localCountdown, setCountdown]);

    if (!slideShowLoaded) {
        return (
            <div className="d-flex vh-100 align-items-center justify-content-center">
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    return (
        <I18N.Provider value={labels}>
            <AppEventContext.Provider value={eventBus}>
                <SlideShowContext.Provider value={slideShowState}>
                    <CurrentSlideContext.Provider value={currentSlideState}>
                        <CountdownContext.Provider value={countdownState}>
                            {mode === 'editor'
                                ? <EditorPage onClose={() => setMode('slideshow')} />
                                : <SlideShowPage onOpenEditor={() => setMode('editor')} />}
                        </CountdownContext.Provider>
                    </CurrentSlideContext.Provider>
                </SlideShowContext.Provider>
            </AppEventContext.Provider>
        </I18N.Provider>
    );
};
