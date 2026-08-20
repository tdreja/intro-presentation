import type { ReactElement } from 'react';
import Markdown from 'react-markdown';
import type { HalfTextHalfImageSlide, SlideLayout } from '../../model/slides/Slide.ts';

type Props = {
    slide: HalfTextHalfImageSlide
};

type ColumnWidths = { textBasis: string, imageBasis: string, imageFirst: boolean };

function columnWidths(layout: SlideLayout): ColumnWidths {
    switch (layout) {
        case 'half-half':
            return { textBasis: '50%', imageBasis: '50%', imageFirst: false };
        case 'one-third-left':
            return { textBasis: '67%', imageBasis: '33%', imageFirst: true };
        case 'one-third-right':
            return { textBasis: '67%', imageBasis: '33%', imageFirst: false };
    }
}

export const HalfTextHalfImageSlideComponent = ({ slide }: Props): ReactElement => {
    const { textBasis, imageBasis, imageFirst } = columnWidths(slide.layout);

    const imageCol = (
        <div
            key="image"
            className="overflow-hidden flex-shrink-0"
            style={{ flexBasis: imageBasis }}
        >
            <img
                src={slide.image}
                alt={slide.headline ?? 'Slide image'}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
            />
        </div>
    );

    const textCol = (
        <div
            key="text"
            className="overflow-auto p-4 flex-shrink-0"
            style={{ flexBasis: textBasis }}
        >
            <Markdown>{slide.text}</Markdown>
        </div>
    );

    return (
        <div className="d-flex flex-column w-100 h-100 overflow-hidden">
            {slide.headline && (
                <h2 className="p-3 mb-0 border-bottom flex-shrink-0 text-center">{slide.headline}</h2>
            )}
            <div className="d-flex flex-grow-1 overflow-hidden">
                {imageFirst ? [imageCol, textCol] : [textCol, imageCol]}
            </div>
        </div>
    );
};
