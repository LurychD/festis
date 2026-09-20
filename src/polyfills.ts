import * as bufferLib from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  window.Buffer = window.Buffer || bufferLib.Buffer;
  (window as any).buffer = bufferLib;

  // Intercept and safely handle screen wake lock requests to prevent permissions policy issues in iframes
  if (typeof navigator !== 'undefined' && navigator.wakeLock && navigator.wakeLock.request) {
    const originalRequest = navigator.wakeLock.request;
    navigator.wakeLock.request = async function(type: any) {
      try {
        return await originalRequest.call(navigator.wakeLock, type);
      } catch (err: any) {
        console.warn("[WakeLock Polyfill] Request blocked by permissions policy in iframe:", err);
        // Return a mock wake lock object so callers don't throw errors
        return {
          released: false,
          type: type,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
          release: async () => {
            console.log("[WakeLock Polyfill] Mock lock released");
          }
        } as any;
      }
    };
  }
}
