import { type ReactElement, useState } from 'react';
import Form from 'react-bootstrap/Form';
import type { QrCodeArea } from '../../../model/slides/Area.ts';
import { useI18n } from '../../../i18n/I18N.ts';

type Props = {
    area: QrCodeArea
    onUpdate: (area: QrCodeArea) => void
};

/**
 * Input for the content of a QR code, applied while typing. An empty input is not applied;
 * leaving it empty restores the stored content.
 */
export const QrCodeAreaControls = ({ area, onUpdate }: Props): ReactElement => {
    const labels = useI18n().areaEditing;
    const [draft, setDraft] = useState<string>(area.data);
    const [stored, setStored] = useState<string>(area.data);

    // Takes over content changed elsewhere, e.g. in another tab
    if (area.data !== stored) {
        setStored(area.data);
        if (area.data !== draft.trim()) {
            setDraft(area.data);
        }
    }

    const change = (value: string) => {
        setDraft(value);
        const trimmed = value.trim();
        if (trimmed.length > 0 && trimmed !== area.data) {
            onUpdate({ ...area, data: trimmed });
        }
    };

    return (
        <Form.Control
            type="text"
            size="sm"
            style={{ width: 220 }}
            value={draft}
            placeholder="https://example.com"
            aria-label={labels.ariaQrCodeUrl}
            onChange={event => change(event.target.value)}
            onBlur={() => setDraft(area.data)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    setDraft(area.data);
                }
            }}
        />
    );
};
