/**
 * PWA Service Worker Registration Utilities
 * 
 * Note: This app is designed as an offline-first PWA.
 * To enable full PWA functionality in production:
 * 
 * 1. Add a manifest.json file to your public directory
 * 2. Register a service worker for offline caching
 * 3. Add icons for different device sizes
 * 
 * Example manifest.json:
 * {
 *   "name": "Field Responder",
 *   "short_name": "Field Responder",
 *   "description": "Emergency Response PWA for Field Workers",
 *   "start_url": "/",
 *   "display": "standalone",
 *   "background_color": "#F5E6D3",
 *   "theme_color": "#800020",
 *   "icons": [
 *     {
 *       "src": "/icon-192.png",
 *       "sizes": "192x192",
 *       "type": "image/png"
 *     },
 *     {
 *       "src": "/icon-512.png",
 *       "sizes": "512x512",
 *       "type": "image/png"
 *     }
 *   ]
 * }
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
