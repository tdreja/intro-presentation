import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './custom-style.css';
import { capturePageSnapshot } from './download/PresentationDownload.ts';

// Before React renders: the download rebuilds the page from this untouched copy
capturePageSnapshot();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
