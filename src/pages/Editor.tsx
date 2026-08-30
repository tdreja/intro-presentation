import { useEffect } from 'react';
import { menuBar, Wordgard } from 'wordgard/editor';
import { fullSchema } from 'wordgard/schema';
import { history } from 'wordgard/history';

export const Editor = () => {
    useEffect(() => {
        const editor = Wordgard.create({
            parent: document.getElementById('main-editor')!,
            doc: `<h2>Hello World</h2>`,
            config: [fullSchema(), history(), menuBar()],
        });
        return () => {
            editor.flush();
            editor.dom.remove();
        };
    }, []);

    return (
        <div id="main-editor">
        </div>
    );
};
