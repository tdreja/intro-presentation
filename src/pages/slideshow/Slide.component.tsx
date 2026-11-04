import type { ReactElement } from 'react';
import Markdown from 'react-markdown';
import { QRCodeSVG } from 'qrcode.react';
import type { Slide } from '../../model/slides/Slide.ts';
import {
    type ImageSlice,
    type QrCodeSlice,
    type Slice,
    type TextSlice,
    type VerticalAlign,
    verticalAlignOf,
} from '../../model/slides/Slice.ts';

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
 * The image covers the slice; the alignment decides which part stays visible when it is cropped vertically.
 */
const ImageSliceComponent = ({ slice }: { slice: ImageSlice }): ReactElement => (
    <img
        src={slice.image}
        alt=""
        className="w-100 h-100 d-block"
        style={{ objectFit: 'cover', objectPosition: OBJECT_POSITION[verticalAlignOf(slice)] }}
    />
);

const TextSliceComponent = ({ slice }: { slice: TextSlice }): ReactElement => (
    <div className="w-100 h-100 overflow-auto p-4 d-flex flex-column">
        <div style={TEXT_MARGINS[verticalAlignOf(slice)]}>
            <Markdown>{slice.text}</Markdown>
        </div>
    </div>
);

const QrCodeSliceComponent = ({ slice, darkMode }: { slice: QrCodeSlice, darkMode?: boolean | null }): ReactElement => (
    <div className={`w-100 h-100 d-flex justify-content-center p-4 ${ALIGN_ITEMS[verticalAlignOf(slice)]}`}>
        <QRCodeSVG
            value={slice.data}
            bgColor="transparent"
            fgColor={darkMode === true ? QR_FG_DARK : QR_FG_LIGHT}
            style={{ width: '100%', height: 'auto', maxWidth: '100%', maxHeight: '100%', aspectRatio: 1 }}
        />
    </div>
);

const SliceContent = ({ slice, darkMode }: { slice: Slice, darkMode?: boolean | null }): ReactElement => {
    switch (slice.sliceType) {
        case 'image':
            return <ImageSliceComponent slice={slice} />;
        case 'text':
            return <TextSliceComponent slice={slice} />;
        case 'qr-code':
            return <QrCodeSliceComponent slice={slice} darkMode={darkMode} />;
    }
};

type Props = {
    slide: Slide
    darkMode?: boolean | null
};

/**
 * Renders a slide as a row of vertical slices, each taking its share of the width.
 */
export const SlideComponent = ({ slide, darkMode }: Props): ReactElement => (
    <div className="d-flex w-100 h-100 overflow-hidden">
        {slide.slices.map((slice, index) => (
            <div
                key={index}
                className="h-100 overflow-hidden"
                style={{ flex: `0 0 ${slice.width}%` }}
            >
                <SliceContent slice={slice} darkMode={darkMode} />
            </div>
        ))}
    </div>
);
