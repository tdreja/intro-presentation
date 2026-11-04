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
    slideShowFromStorage,
    slideShowToStorage,
} from './communication/LocalStorage.ts';
import { FALLBACK_SLIDESHOW, SlideShowContext, type SlideShowState } from './communication/context/Slideshow.context.ts';
import { CurrentSlideContext, type CurrentSlideState } from './communication/context/CurrentSlide.context.ts';
import { CountdownContext, type CountdownState } from './communication/context/Countdown.context.ts';
import { type AppEvent, goToSlideEvent, replaceSlideshowEvent, updateCountdownEvent } from './model/event/Event.ts';
import { SlideShowPage } from './pages/slideshow/SlideShow.page.tsx';
import { EditorPage } from './pages/editor/Editor.page.tsx';
import { compressSlideShowImages } from './model/slides/ImageCompression.ts';

export const App = (): ReactElement => {
    const [source] = useState<AppId>(() => newAppId('app'));
    // Local to this tab: each tab decides itself whether it presents or edits
    const [mode, setMode] = useState<'slideshow' | 'editor'>('slideshow');

    // Set up the event bus — channel is created here so eventBus always owns it
    const [eventBus] = useState<AppEventBus>(() => {
        const channel = new BroadcastChannel('intro-presentation-channel');
        return new AppEventBus(channel);
    });

    // Pick the newest of the stored data and the data embedded in the HTML, e.g. a downloaded presentation
    const [startup] = useState(() => {
        const storedSlideShow = slideShowFromStorage();
        const htmlSlideShow = SLIDE_SHOW_CONVERTER.fromJson(window.startupSlideShow);
        const slideShow = pickNewest(storedSlideShow, htmlSlideShow) ?? FALLBACK_SLIDESHOW;
        const storedCountdown = countdownFromStorage();
        const htmlCountdown = COUNTDOWN_CONVERTER.fromJson(window.startupCountdown);
        const countdown = pickNewestAllowedCountdown(htmlCountdown, storedCountdown) ?? FALLBACK_COUNTDOWN;
        return {
            slideShow,
            countdown,
            // Skip rewriting what is already stored (the slideshow can be several MB)
            slideShowStored: slideShow === storedSlideShow,
            countdownStored: countdown === storedCountdown,
            // The HTML brought something newer than this browser knew: it replaces the stored data
            slideShowFromHtml: !!htmlSlideShow && slideShow === htmlSlideShow
              && (!storedSlideShow || htmlSlideShow.id > storedSlideShow.id),
            countdownFromHtml: !!htmlCountdown && countdown === htmlCountdown
              && (!storedCountdown || htmlCountdown.countdownId > storedCountdown.countdownId),
        };
    });

    // Prepare the local state for this app!
    const [localSlideShow, setLocalSlideShow] = useState<SlideShow>(startup.slideShow);
    const [localCurrentSlide, setLocalCurrentSlide] = useState<AppId | null>(() => currentSlideIdFromStorage());
    const [localCountdown, setLocalCountdown] = useState<Countdown>(startup.countdown);

    // Add setters with attachment to the eventbus
    const setSlideShow = useCallback((slide: SlideShow) => {
        setLocalSlideShow(slide);
        slideShowToStorage(slide);
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
        let cancelled = false;
        compressSlideShowImages(localSlideShow).then((compressed) => {
            if (!cancelled && compressed !== localSlideShow) {
                setLocalSlideShow(compressed);
                slideShowToStorage(compressed);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [localSlideShow]);

    // Theme for both the slideshow and the editor
    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', localSlideShow.darkMode === true ? 'dark' : 'light');
        return () => document.documentElement.removeAttribute('data-bs-theme');
    }, [localSlideShow.darkMode]);

    // Keep what was picked on startup, so other tabs and later visits see it too (older data is never overwritten).
    // Open tabs are only told when the HTML brought something newer, e.g. a downloaded presentation.
    useEffect(() => {
        if (!startup.slideShowStored) {
            slideShowToStorage(startup.slideShow);
        }
        if (!startup.countdownStored) {
            countdownToStorage(startup.countdown);
        }
        if (startup.slideShowFromHtml) {
            eventBus.dispatchEvent(replaceSlideshowEvent(source, startup.slideShow));
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

    return (
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
    );
};
