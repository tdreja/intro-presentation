import type { CSSProperties, ReactElement } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { QrCode } from '../../model/slides/QrCode.ts';

const CORNER_STYLE: Record<QrCode['corner'], CSSProperties> = {
    'top-left': { top: '1rem', left: '1rem' },
    'top-right': { top: '1rem', right: '1rem' },
    'bottom-left': { bottom: '1rem', left: '1rem' },
    'bottom-right': { bottom: '1rem', right: '1rem' },
};

interface QrCodeOverlayProps {
    qrCode: QrCode
}

export const QrCodeOverlay = ({ qrCode }: QrCodeOverlayProps): ReactElement => {
    return (
        <div style={{
            position: 'absolute',
            zIndex: 10,
            ...CORNER_STYLE[qrCode.corner],
        }}
        >
            <QRCodeSVG value={qrCode.data} />
        </div>
    );
};
