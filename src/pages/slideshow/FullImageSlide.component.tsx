import type { ReactElement } from 'react';
import type { FullImageSlide } from '../../model/slides/Slide.ts';

type Props = {
    slide: FullImageSlide
};

export const FullImageSlideComponent = ({ slide }: Props): ReactElement => {
    return (
        <div className="position-relative w-100 h-100 overflow-hidden">
            <img
                src={slide.image}
                alt={slide.headline ?? 'Slide image'}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
            />
            {slide.headline && (
                <div className="position-absolute top-0 start-0 m-3 px-3 py-2 rounded fs-3 text-white bg-dark bg-opacity-50">
                    {slide.headline}
                </div>
            )}
        </div>
    );
};
