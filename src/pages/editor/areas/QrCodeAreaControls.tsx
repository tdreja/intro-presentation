import { type ReactElement, useState } from 'react';
import Form from 'react-bootstrap/Form';
import type { QrCodeArea } from '../../../model/slides/Area.ts';

type Props = {
    area: QrCodeArea
    onUpdate: (area: QrCodeArea) => void
};

/**
 * Input for the content of a QR code, applied on Enter or when leaving the input.
 * The parent remounts it when the stored content changes.
 */
export const QrCodeAreaControls = ({ area, onUpdate }: Props): ReactElement => {
    const [draft, setDraft] = useState<string>(area.data);

    const commit = () => {
        const trimmed = draft.trim();
        if (trimmed.length > 0 && trimmed !== area.data) {
            onUpdate({ ...area, data: trimmed });
        }
        else {
            setDraft(area.data);
        }
    };

    return (
        <Form.Control
            type="text"
            size="sm"
            style={{ width: 220 }}
            value={draft}
            placeholder="https://example.com"
            aria-label="QR code content"
            onChange={event => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    commit();
                }
            }}
        />
    );
};
