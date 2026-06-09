import type { GoogleMapsNamespace } from "./mapTypes";

const scriptId = "google-maps-js-api";

let mapsLoadPromise: Promise<GoogleMapsNamespace> | null = null;

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsNamespace;
    };
    __kosugiMapsLoaded?: () => void;
  }
}

export function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  if (mapsLoadPromise) {
    return mapsLoadPromise;
  }

  mapsLoadPromise = new Promise<GoogleMapsNamespace>((resolve, reject) => {
    window.__kosugiMapsLoaded = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        mapsLoadPromise = null;
        reject(new Error("Google Maps namespace was not initialized."));
      }
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("error", () => {
        mapsLoadPromise = null;
        reject(new Error("Google Maps JavaScript API failed to load."));
      });
      return;
    }

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "beta",
      language: "ja",
      region: "JP",
      loading: "async",
      callback: "__kosugiMapsLoaded",
    });

    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = (event) => {
      const eventType = event instanceof Event ? event.type : "error";
      mapsLoadPromise = null;
      reject(new Error(`Google Maps JavaScript API failed to load. (${eventType})`));
    };

    document.head.append(script);
  });

  return mapsLoadPromise;
}
