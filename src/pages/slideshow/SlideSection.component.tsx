import type { ReactElement } from 'react';
import Markdown from 'react-markdown';
import { getImageFromSection, getTextFromSection, type SlideSection } from '../../model/slides/Slide.ts';

type Props = {
    section: SlideSection
};

export const SlideSectionComponent = ({ section }: Props): ReactElement | null => {
    const image = getImageFromSection(section);
    if (image) {
        return (
            <div
                className="overflow-hidden flex-shrink-0"
                style={{ flexBasis: `${section.widthPercent}%` }}
            >
                <img
                    src={image}
                    alt="Slide"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                />
            </div>
        );
    }

    const text = getTextFromSection(section);
    if (text) {
        return (
            <div
                className="overflow-auto p-4 flex-shrink-0"
                style={{ flexBasis: `${section.widthPercent}%` }}
            >
                <Markdown>{text}</Markdown>
            </div>
        );
    }

    return null;
};
