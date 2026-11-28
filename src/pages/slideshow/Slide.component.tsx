import { type PointerEventHandler, type ReactElement, type ReactNode, useRef } from 'react';
import Markdown from 'react-markdown';
import { QRCodeSVG } from 'qrcode.react';
import type { Slide } from '../../model/slides/Slide.ts';
import {
    type Area,
    type ImageArea,
    type QrCodeArea,
    textAlignOf,
    type TextArea,
    type VerticalAlign,
    verticalAlignOf,
} from '../../model/slides/Area.ts';
import { fitScale, scaleBounds } from '../../model/slides/SlideScale.ts';
import { useElementSize } from '../common/useElementSize.ts';
import { remarkLineBreaks } from './RemarkLineBreaks.ts';

const REMARK_PLUGINS = [remarkLineBreaks];

const QR_FG_LIGHT = '#1a1a1a';
const QR_FG_DARK = '#ffffff';

const OBJECT_POSITION: Record<VerticalAlign, string> = {
    top: 'center top',
    middle: 'center center',
    bottom: 'center bottom',
};

const ALIGN_ITEMS: Record<VerticalAlign, string> = {
    top: 'align-items-start',
    middle: 'align-items-center',
    bottom: 'align-items-end',
};

/**
 * Auto margins push the text down instead of justify-content, so overflowing text still scrolls from its first line.
 */
const TEXT_MARGINS: Record<VerticalAlign, { marginTop?: 'auto', marginBottom?: 'auto' }> = {
    top: { marginBottom: 'auto' },
    middle: { marginTop: 'auto', marginBottom: 'auto' },
    bottom: { marginTop: 'auto' },
};

/**
 * The image covers the area; the alignment decides which part stays visible when it is cropped vertically.
 */
const ImageAreaComponent = ({ area }: { area: ImageArea }): ReactElement => (
    <img
        src={area.image}
        alt=""
        className="w-100 h-100 d-block"
        style={{ objectFit: 'cover', objectPosition: OBJECT_POSITION[verticalAlignOf(area)] }}
    />
);

const TextAreaComponent = ({ area }: { area: TextArea }): ReactElement => (
    <div className="w-100 h-100 overflow-auto p-4 d-flex flex-column">
        <div className="slide-text" style={{ ...TEXT_MARGINS[verticalAlignOf(area)], textAlign: textAlignOf(area) }}>
            <Markdown remarkPlugins={REMARK_PLUGINS}>{area.text}</Markdown>
        </div>
    </div>
);

const QrCodeAreaComponent = ({ area, darkMode }: { area: QrCodeArea, darkMode?: boolean | null }): ReactElement => (
    <div className={`w-100 h-100 d-flex justify-content-center p-4 ${ALIGN_ITEMS[verticalAlignOf(area)]}`}>
        <QRCodeSVG
            value={area.data}
            bgColor="transparent"
            fgColor={darkMode === true ? QR_FG_DARK : QR_FG_LIGHT}
            style={{ width: '100%', height: 'auto', maxWidth: '100%', maxHeight: '100%', aspectRatio: 1 }}
        />
    </div>
);

/**
 * Content of an area as shown in the slideshow, at its unscaled size.
 */
export const AreaContent = ({ area, darkMode }: { area: Area, darkMode?: boolean | null }): ReactElement => {
    switch (area.areaType) {
        case 'image':
            return <ImageAreaComponent area={area} />;
        case 'text':
            return <TextAreaComponent area={area} />;
        case 'qr-code':
            return <QrCodeAreaComponent area={area} darkMode={darkMode} />;
    }
};

type AreaBoxProps = {
    area: Area
    scale: number
    /**
     * Content, laid out at the unscaled size of the area and scaled down (or up) as a whole
     */
    children: ReactNode
    /**
     * Drawn on top of the content in screen pixels, e.g. the frame and handles of the editor
     */
    overlay?: ReactNode
    className?: string
    onPointerDown?: PointerEventHandler<HTMLDivElement>
};

/**
 * Places an area on a slide: its position and size are scaled, and so is its content,
 * so text and QR codes keep their proportions to the slide at any screen size.
 */
export const AreaBox = ({ area, scale, children, overlay, className, onPointerDown }: AreaBoxProps): ReactElement => {
    const bounds = scaleBounds(area, scale);
    return (
        <div
            className={`position-absolute ${className ?? ''}`}
            style={{ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }}
            onPointerDown={onPointerDown}
        >
            <div className="overflow-hidden w-100 h-100">
                <div
                    style={{
                        width: area.width,
                        height: area.height,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                    }}
                >
                    {children}
                </div>
            </div>
            {overlay}
        </div>
    );
};

type Props = {
    slide: Slide
    /**
     * Factor between slide units and screen pixels
     */
    scale: number
    darkMode?: boolean | null
};

/**
 * Renders a slide at the given scale, with its areas placed on it in paint order.
 */
export const SlideComponent = ({ slide, scale, darkMode }: Props): ReactElement => (
    <div
        className="slide position-relative overflow-hidden flex-shrink-0"
        style={{ width: slide.width * scale, height: slide.height * scale }}
    >
        {slide.areas.map((area, index) => (
            <AreaBox key={index} area={area} scale={scale}>
                <AreaContent area={area} darkMode={darkMode} />
            </AreaBox>
        ))}
    </div>
);

type CanvasProps = {
    slide: Slide
    darkMode?: boolean | null
    /**
     * Renders the scaled slide, e.g. the editor instead of the plain slide
     */
    render?: (scale: number) => ReactNode
    className?: string
};

/**
 * Fills the available space and scales the slide to the largest size that fits, keeping its aspect ratio, centered.
 */
export const SlideCanvas = ({ slide, darkMode, render, className }: CanvasProps): ReactElement => {
    const ref = useRef<HTMLDivElement>(null);
    const size = useElementSize(ref);
    const scale = fitScale(slide.width, slide.height, size.width, size.height);
    return (
        <div ref={ref} className={`w-100 h-100 d-flex justify-content-center align-items-center overflow-hidden ${className ?? ''}`}>
            {scale > 0 && (render ? render(scale) : <SlideComponent slide={slide} scale={scale} darkMode={darkMode} />)}
        </div>
    );
};
