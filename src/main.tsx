import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any stale Service Worker that could intercept requests or serve outdated JS chunks
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch((err) => console.warn('SW unregister notice:', err));
}

createRoot(document.getElementById('root')!).render(<App />);
