import type { CSSProperties, ReactElement } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { QrCode } from '../../model/slides/QrCode.ts';

const CORNER_STYLE: Record<QrCode['corner'], CSSProperties> = {
    'top-left': { top: '1rem', left: '1rem' },
    'top-right': { top: '1rem', right: '1rem' },
    'bottom-left': { bottom: '1rem', left: '1rem' },
    'bottom-right': { bottom: '1rem', right: '1rem' },
};

const QR_FG_LIGHT = '#1a1a1a';
const QR_FG_DARK = '#ffffff';

interface QrCodeOverlayProps {
    qrCode: QrCode
    darkMode?: boolean | null
}

export const QrCodeOverlay = ({ qrCode, darkMode }: QrCodeOverlayProps): ReactElement => {
    return (
        <div
            id="qrcode"
            style={{
                position: 'absolute',
                zIndex: 10,
                ...CORNER_STYLE[qrCode.corner],
            }}
        >
            <QRCodeSVG
                value={qrCode.data}
                bgColor="transparent"
                fgColor={darkMode === true ? QR_FG_DARK : QR_FG_LIGHT}
            />
        </div>
    );
};
