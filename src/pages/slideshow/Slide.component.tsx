import type { ReactElement } from 'react';
import Markdown from 'react-markdown';
import { QRCodeSVG } from 'qrcode.react';
import type { Slide } from '../../model/slides/Slide.ts';
import type { ImageSlice, QrCodeSlice, Slice, TextSlice } from '../../model/slides/Slice.ts';

const QR_FG_LIGHT = '#1a1a1a';
const QR_FG_DARK = '#ffffff';

const ImageSliceComponent = ({ slice }: { slice: ImageSlice }): ReactElement => (
    <img
        src={slice.image}
        alt=""
        className="w-100 h-100 d-block"
        style={{ objectFit: 'cover' }}
    />
);

const TextSliceComponent = ({ slice }: { slice: TextSlice }): ReactElement => (
    <div className="w-100 h-100 overflow-auto p-4">
        <Markdown>{slice.text}</Markdown>
    </div>
);

const QrCodeSliceComponent = ({ slice, darkMode }: { slice: QrCodeSlice, darkMode?: boolean | null }): ReactElement => (
    <div className="w-100 h-100 d-flex justify-content-center align-items-center p-4">
        <QRCodeSVG
            value={slice.data}
            bgColor="transparent"
            fgColor={darkMode === true ? QR_FG_DARK : QR_FG_LIGHT}
            style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
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
