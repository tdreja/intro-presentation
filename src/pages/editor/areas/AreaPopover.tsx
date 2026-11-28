import type { ReactElement } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import type { Area } from '../../../model/slides/Area.ts';
import { ImageAreaControls } from './ImageAreaControls.tsx';
import { QrCodeAreaControls } from './QrCodeAreaControls.tsx';

type Props = {
    area: Area
    /**
     * Element the popover is attached to, the frame of the area
     */
    target: HTMLElement | null
    show: boolean
    onUpdate: (area: Area) => void
};

/**
 * Floating controls for the content of an image or QR code area: below the area, or above it when there is no space below.
 * Text areas have none; they are edited in place.
 */
export const AreaPopover = ({ area, target, show, onUpdate }: Props): ReactElement | null => {
    if (area.areaType === 'text') {
        return null;
    }
    return (
        <Overlay target={target} show={show && !!target} placement="bottom" flip>
            <Popover className="area-popover">
                <Popover.Body className="p-2">
                    {area.areaType === 'image'
                        ? <ImageAreaControls area={area} onUpdate={onUpdate} />
                        : <QrCodeAreaControls key={area.data} area={area} onUpdate={onUpdate} />}
                </Popover.Body>
            </Popover>
        </Overlay>
    );
};
