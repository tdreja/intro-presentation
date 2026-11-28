import { afterEach, describe, expect, test, vi } from 'vitest';
import { i18n } from './I18N';
import { i18n_de } from './I18N_de';
import { i18n_en } from './I18N_en';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('i18n', () => {
    test.each(['de', 'de-DE', 'de-AT'])('picks German for %s', (language) => {
        vi.stubGlobal('navigator', { language });
        expect(i18n()).toBe(i18n_de);
    });

    test.each(['en', 'en-US', 'fr-FR', ''])('picks English for "%s"', (language) => {
        vi.stubGlobal('navigator', { language });
        expect(i18n()).toBe(i18n_en);
    });

    test('picks English without a navigator', () => {
        vi.stubGlobal('navigator', undefined);
        expect(i18n()).toBe(i18n_en);
    });

    test('sets the language of the labels', () => {
        expect(i18n_en.language).toBe('en');
        expect(i18n_de.language).toBe('de');
    });
});

describe('labels with values', () => {
    test('minutes uses singular and plural', () => {
        expect(i18n_en.countdownSettings.minutes(1)).toBe('1 Minute');
        expect(i18n_en.countdownSettings.minutes(5)).toBe('5 Minutes');
        expect(i18n_de.countdownSettings.minutes(1)).toBe('1 Minute');
        expect(i18n_de.countdownSettings.minutes(5)).toBe('5 Minuten');
    });

    test('slide number and area type are put into the text', () => {
        expect(i18n_en.slideOverview.ariaSelectSlide(3)).toBe('Select slide 3');
        expect(i18n_de.slideOverview.ariaSelectSlide(3)).toBe('Folie 3 auswählen');
        expect(i18n_en.areaToolbar.tooltipAddArea(i18n_en.areaTypes.image)).toBe('Add Image area');
        expect(i18n_de.areaToolbar.tooltipAddArea(i18n_de.areaTypes.image)).toBe('Bereich „Bild“ hinzufügen');
    });
});
