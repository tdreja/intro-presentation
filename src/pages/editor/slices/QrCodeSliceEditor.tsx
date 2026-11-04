import { type ReactElement, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { QRCodeSVG } from 'qrcode.react';
import type { QrCodeSlice } from '../../../model/slides/Slice.ts';

type Props = {
    slice: QrCodeSlice
    darkMode?: boolean | null
    onUpdate: (slice: QrCodeSlice) => void
};

/**
 * Shows the QR code and lets the user enter new content, applied with the Update button.
 */
export const QrCodeSliceEditor = ({ slice, darkMode, onUpdate }: Props): ReactElement => {
    const [draft, setDraft] = useState<string>(slice.data);
    const trimmed = draft.trim();
    const canUpdate = trimmed.length > 0 && trimmed !== slice.data;

    return (
        <Form
            className="d-flex flex-column gap-2 h-100"
            onSubmit={(event) => {
                event.preventDefault();
                if (canUpdate) {
                    onUpdate({ ...slice, data: trimmed });
                }
            }}
        >
            <div className="flex-grow-1 d-flex justify-content-center align-items-center p-2" style={{ minHeight: 0 }}>
                <QRCodeSVG
                    value={trimmed || slice.data}
                    bgColor="transparent"
                    fgColor={darkMode === true ? '#ffffff' : '#1a1a1a'}
                    style={{ width: '100%', height: '100%', maxWidth: 320, maxHeight: 320 }}
                />
            </div>
            <Form.Control
                type="text"
                size="sm"
                value={draft}
                placeholder="https://example.com"
                aria-label="QR code content"
                onChange={event => setDraft(event.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary align-self-end" disabled={!canUpdate}>
                Update
            </button>
        </Form>
    );
};
