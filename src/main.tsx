import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  registerServiceWorker,
  shouldEnableServiceWorker,
  unregisterServiceWorkersAndClearCaches,
} from "./lib/pwa";

// Enable PWA only on published app hosts.
// In preview/dev, an active Service Worker can cache Vite chunks and mix old/new React runtime files.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (shouldEnableServiceWorker()) {
      registerServiceWorker().catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });
      return;
    }

    unregisterServiceWorkersAndClearCaches();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
