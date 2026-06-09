"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExplorerPanel from "./ExplorerPanel";
import SpotDetailModal from "./SpotDetailModal";
import { loadGoogleMaps } from "./googleMapsLoader";
import { cameraPresets, floodArea, routePath, shelters, walkSpots } from "./mapData";
import type {
  CameraPreset,
  LayerKey,
  Map3DElementLike,
  Maps3DLibrary,
  MarkerLibrary,
  PinElementLike,
  Spot,
} from "./mapTypes";

const keyName = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY";

const layerLabels: Record<LayerKey, string> = {
  spots: "回遊スポット",
  route: "仮回遊ルート",
  flood: "浸水想定",
  shelters: "指定避難所",
};

const layerDefaults: Record<LayerKey, boolean> = {
  spots: true,
  route: false,
  flood: true,
  shelters: true,
};

const markerStyles = {
  spot: {
    background: "#007c89",
    borderColor: "#e6fffb",
    glyphColor: "#ffffff",
    glyphText: "S",
    scale: 1.05,
  },
  shelter: {
    background: "#d92d20",
    borderColor: "#fff1f0",
    glyphColor: "#ffffff",
    glyphText: "避",
    scale: 1.12,
  },
};

function appendMarkerPin(marker: HTMLElement, pin: PinElementLike) {
  marker.append(pin.element ?? pin);
}

function formatError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error instanceof Event) {
    return `${fallback} (${error.type})`;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

function flyTo(map: Map3DElementLike | null, preset: CameraPreset, durationMillis = 1400) {
  if (!map) {
    return;
  }

  const camera = {
    center: preset.center,
    range: preset.range,
    tilt: preset.tilt,
    heading: preset.heading,
  };

  if (typeof map.flyCameraTo === "function") {
    map.flyCameraTo({ endCamera: camera, durationMillis });
    return;
  }

  map.center = preset.center;
  map.range = preset.range;
  map.tilt = preset.tilt;
  map.heading = preset.heading;
}

function flyToSpot(map: Map3DElementLike | null, spot: Spot) {
  flyTo(map, {
    id: spot.id,
    label: spot.name,
    center: { ...spot.position, altitude: Math.max(spot.position.altitude ?? 30, 70) },
    range: spot.id === "tamagawa" || spot.id === "todoroki" ? 1300 : 650,
    tilt: 68,
    heading: spot.id === "tamagawa" ? 325 : 45,
  });
}

function applyLayerVisibility(
  map: Map3DElementLike | null,
  currentLayers: Record<LayerKey, boolean>,
  currentElements: Partial<Record<LayerKey, HTMLElement[]>>,
) {
  if (!map) {
    return;
  }

  for (const [key, visible] of Object.entries(currentLayers) as Array<[LayerKey, boolean]>) {
    currentElements[key]?.forEach((element) => {
      try {
        if (visible && !element.parentNode) {
          map.append(element);
        }

        if (!visible && element.parentNode) {
          element.remove();
        }
      } catch (error) {
        console.warn(`Layer visibility update failed for ${key}:`, error);
      }
    });
  }
}

export default function MapExplorer({ apiKey }: { apiKey?: string }) {
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map3DElementLike | null>(null);
  const elementRefs = useRef<Partial<Record<LayerKey, HTMLElement[]>>>({});
  const layersRef = useRef<Record<LayerKey, boolean>>(layerDefaults);

  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    apiKey ? "loading" : "idle",
  );
  const [loadError, setLoadError] = useState("");
  const [activePreset, setActivePreset] = useState(cameraPresets[0].id);
  const [activeSpot, setActiveSpot] = useState<Spot>(walkSpots[0]);
  const [detailSpot, setDetailSpot] = useState<Spot | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(layerDefaults);

  const allLayerEntries = useMemo(
    () => Object.entries(layerLabels) as Array<[LayerKey, string]>,
    [],
  );

  useEffect(() => {
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (event.reason instanceof Event) {
        event.preventDefault();
        console.warn("Ignored non-fatal Google Maps event rejection:", event.reason.type);
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    if (!apiKey || !mapHostRef.current || mapRef.current) {
      return;
    }

    const mapsApiKey = apiKey;
    let cancelled = false;
    let createdMap: Map3DElementLike | null = null;

    async function initMap() {
      try {
        setLoadState("loading");
        const googleMaps = await loadGoogleMaps(mapsApiKey);
        const {
          Map3DElement,
          Marker3DElement,
          Polyline3DElement,
          Polygon3DElement,
        } = (await googleMaps.importLibrary("maps3d")) as Maps3DLibrary;
        const { PinElement } = (await googleMaps.importLibrary("marker")) as MarkerLibrary;

        if (cancelled || !mapHostRef.current) {
          return;
        }

        const firstPreset = cameraPresets[0];
        createdMap = new Map3DElement({
          center: firstPreset.center,
          range: firstPreset.range,
          tilt: firstPreset.tilt,
          heading: firstPreset.heading,
          mode: "HYBRID",
          gestureHandling: "GREEDY",
          defaultUIHidden: false,
          description: "武蔵小杉駅周辺の3D地図",
        });
        createdMap.classList.add("map-3d");

        const spotMarkers = walkSpots.map((spot) => {
          const marker = new Marker3DElement({
            position: spot.position,
            label: spot.name,
            extruded: true,
            altitudeMode: "RELATIVE_TO_GROUND",
          });
          marker.classList.add("map-marker");
          appendMarkerPin(marker, new PinElement(markerStyles.spot));
          marker.addEventListener("click", () => {
            setActiveSpot(spot);
            setDetailSpot(spot);
          });
          createdMap?.append(marker);
          return marker;
        });

        const shelterMarkers = shelters.map((spot) => {
          const marker = new Marker3DElement({
            position: spot.position,
            label: spot.name,
            extruded: true,
            altitudeMode: "RELATIVE_TO_GROUND",
          });
          marker.classList.add("map-marker", "map-marker-shelter");
          appendMarkerPin(marker, new PinElement(markerStyles.shelter));
          marker.addEventListener("click", () => {
            setActiveSpot(spot);
            setDetailSpot(spot);
          });
          createdMap?.append(marker);
          return marker;
        });

        const route = new Polyline3DElement({
          path: routePath,
          strokeColor: "#f97316",
          strokeWidth: 8,
          outerColor: "#ffffff",
          outerWidth: 1,
          drawsOccludedSegments: true,
          altitudeMode: "RELATIVE_TO_GROUND",
        });
        createdMap.append(route);

        const flood = new Polygon3DElement({
          path: floodArea,
          fillColor: "rgba(14, 116, 144, 0.34)",
          strokeColor: "#0e7490",
          strokeWidth: 3,
          drawsOccludedSegments: false,
          altitudeMode: "RELATIVE_TO_GROUND",
        });
        createdMap.append(flood);

        const layerElements = {
          spots: spotMarkers,
          shelters: shelterMarkers,
          route: [route],
          flood: [flood],
        };
        elementRefs.current = layerElements;
        applyLayerVisibility(createdMap, layersRef.current, layerElements);

        mapHostRef.current.replaceChildren(createdMap);
        mapRef.current = createdMap;
        setLoadState("ready");
      } catch (error) {
        if (!cancelled) {
          setLoadState("error");
          setLoadError(formatError(error, "地図の初期化に失敗しました。"));
        }
      }
    }

    initMap();
    return () => {
      cancelled = true;
      if (createdMap) {
        createdMap.remove();
      }
      mapRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    applyLayerVisibility(mapRef.current, layers, elementRefs.current);
  }, [layers, loadState]);

  function selectPreset(preset: CameraPreset) {
    setActivePreset(preset.id);
    mapRef.current?.stopCameraAnimation?.();
    flyTo(mapRef.current, preset);
  }

  function toggleLayer(key: LayerKey) {
    setLayers((current) => ({ ...layerDefaults, ...current, [key]: !Boolean(current[key]) }));
  }

  function selectSpot(spot: Spot) {
    setActiveSpot(spot);
    mapRef.current?.stopCameraAnimation?.();
    setLayers((current) => ({ ...current, spots: true }));
    flyToSpot(mapRef.current, spot);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Musashi-Kosugi</p>
          <h1 className="title">3D Walk + Safety Explorer</h1>
        </div>
        <div className="controls" aria-label="camera presets">
          {cameraPresets.map((preset) => (
            <button
              key={preset.id}
              className={preset.id === activePreset ? "btn btn-active" : "btn"}
              type="button"
              onClick={() => selectPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </header>

      <section className="main">
        <article className="map-area" aria-label="3D map">
          <div ref={mapHostRef} className="map-host" />

          {!apiKey && (
            <div className="map-overlay">
              <h2>Google 3D Maps APIキーが未設定です</h2>
              <p>
                {keyName} を `.env.local` または Render 環境変数に設定すると、
                武蔵小杉駅周辺の3D地図を読み込みます。
              </p>
            </div>
          )}

          {apiKey && loadState === "loading" && (
            <div className="map-overlay">
              <h2>3D地図を読み込み中</h2>
              <p>Maps JavaScript API の beta チャンネルから maps3d ライブラリを取得しています。</p>
            </div>
          )}

          {loadState === "error" && (
            <div className="map-overlay map-overlay-error">
              <h2>3D地図を読み込めませんでした</h2>
              <p>{loadError}</p>
            </div>
          )}
        </article>

        <ExplorerPanel
          layerEntries={allLayerEntries}
          layers={layers}
          activeSpot={activeSpot}
          spots={walkSpots}
          onToggleLayer={toggleLayer}
          onSelectSpot={selectSpot}
          onOpenSpotDetail={setDetailSpot}
        />
      </section>

      <SpotDetailModal spot={detailSpot} onClose={() => setDetailSpot(null)} />
    </main>
  );
}
