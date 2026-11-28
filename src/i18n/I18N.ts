import { createContext, useContext } from 'react';
import type { AreaType, TextAlign, VerticalAlign } from '../model/slides/Area.ts';
import { i18n_de } from './I18N_de.ts';
import { i18n_en } from './I18N_en.ts';

/**
 * Overall API with all translations used by the application
 */
export interface Labels {
    /**
     * Language of the labels, set as the lang attribute of the page
     */
    language: string
    slideShow: SlideShowLabels
    editor: EditorLabels
    countdownSettings: CountdownSettingsLabels
    slideOverview: SlideOverviewLabels
    areaToolbar: AreaToolbarLabels
    areaEditing: AreaEditingLabels
    areaTypes: AreaTypeLabels
    verticalAligns: VerticalAlignLabels
    textAligns: TextAlignLabels
    defaults: DefaultContentLabels
}

/**
 * Labels for the types of areas.
 */
export type AreaTypeLabels = {
    [type in AreaType]: string;
};

/**
 * Labels for the vertical alignments of an area.
 */
export type VerticalAlignLabels = {
    [align in VerticalAlign]: string;
};

/**
 * Labels for the horizontal alignments of a text area.
 */
export type TextAlignLabels = {
    [align in TextAlign]: string;
};

/**
 * Labels used in the slideshow page.
 */
export interface SlideShowLabels {
    noSlideSelected: string
    tooltipEditSlideshow: string
    ariaNextSlide: string
    ariaCurrentTime: string
    ariaCountdown: string
}

/**
 * Labels used in the navbar of the editor page.
 */
export interface EditorLabels {
    title: string
    labelDarkMode: string
    actionDownload: string
    tooltipDownload: string
    actionDownloadJson: string
    tooltipDownloadJson: string
    actionImportJson: string
    tooltipImportJson: string
    errorImportJson: string
    actionBackToSlideshow: string
    noSlideSelected: string
}

/**
 * Labels used in the countdown settings of the editor.
 */
export interface CountdownSettingsLabels {
    labelCountdown: string
    ariaTargetTime: string
    warningInPast: string
    labelShowFor: string
    minutes: (minutes: number) => string
}

/**
 * Labels used in the slide overview of the editor.
 */
export interface SlideOverviewLabels {
    ariaSelectSlide: (slideNumber: number) => string
    tooltipMoveUp: string
    ariaMoveUp: string
    tooltipMoveDown: string
    ariaMoveDown: string
    tooltipDuplicate: string
    tooltipDelete: string
    actionNewSlide: string
}

/**
 * Labels used in the toolbar above the slide in the editor.
 */
export interface AreaToolbarLabels {
    ariaVerticalAlign: string
    ariaTextAlign: string
    ariaOrder: string
    tooltipSendBackward: string
    ariaSendBackward: string
    tooltipBringForward: string
    ariaBringForward: string
    tooltipDeleteArea: string
    hintSelectArea: string
    ariaAddArea: string
    tooltipAddArea: (areaType: string) => string
}

/**
 * Labels used on the areas in the editor: the handles and the popover controls.
 */
export interface AreaEditingLabels {
    tooltipMove: string
    ariaMove: string
    tooltipResize: string
    ariaResize: string
    actionUploadImage: string
    ariaPickImage: string
    errorReadImage: string
    ariaQrCodeUrl: string
    actionFullWidth: string
    tooltipFullWidth: string
    actionFullHeight: string
    tooltipFullHeight: string
}

/**
 * Content the app writes into the slideshow, e.g. the starting text of a new text area.
 */
export interface DefaultContentLabels {
    newText: string
}

/**
 * Fetches the appropriate labels based on the user's language settings.
 * Defaults to English if no specific language is detected.
 */
export function i18n(): Labels {
    const language = globalThis.navigator?.language;
    if (language && language.startsWith('de')) {
        return i18n_de;
    }
    return i18n_en;
}

export const I18N = createContext<Labels>(i18n_en);

export const useI18n = () => useContext(I18N);
