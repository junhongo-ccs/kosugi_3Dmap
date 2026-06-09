"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LatLngAltitude = {
  lat: number;
  lng: number;
  altitude?: number;
};

type CameraPreset = {
  id: string;
  label: string;
  center: LatLngAltitude;
  range: number;
  tilt: number;
  heading: number;
};

type Spot = {
  id: string;
  name: string;
  category: string;
  description: string;
  source: string;
  memo: string;
  position: LatLngAltitude;
};

type LayerKey = "spots" | "route" | "flood" | "shelters" | "boundary";

type Map3DElementLike = HTMLElement & {
  center: LatLngAltitude;
  range: number;
  tilt: number;
  heading: number;
  mode: string;
  flyCameraTo?: (options: {
    endCamera: Pick<CameraPreset, "center" | "range" | "tilt" | "heading">;
    durationMillis?: number;
  }) => void;
};

type Maps3DLibrary = {
  Map3DElement: new (options: Record<string, unknown>) => Map3DElementLike;
  Marker3DElement: new (options: Record<string, unknown>) => HTMLElement;
  Polyline3DElement: new (options: Record<string, unknown>) => HTMLElement;
  Polygon3DElement: new (options: Record<string, unknown>) => HTMLElement;
};

type GoogleMapsNamespace = {
  importLibrary: (library: string) => Promise<unknown>;
};

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsNamespace;
    };
    __kosugiMapsLoaded?: () => void;
  }
}

const keyName = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY";
const scriptId = "google-maps-js-api";

const cameraPresets: CameraPreset[] = [
  {
    id: "station",
    label: "駅俯瞰",
    center: { lat: 35.5761, lng: 139.6566, altitude: 120 },
    range: 1900,
    tilt: 57,
    heading: 35,
  },
  {
    id: "tamagawa",
    label: "多摩川方向",
    center: { lat: 35.5868, lng: 139.6674, altitude: 90 },
    range: 2400,
    tilt: 62,
    heading: 330,
  },
  {
    id: "walk",
    label: "街歩き視点",
    center: { lat: 35.5754, lng: 139.6598, altitude: 35 },
    range: 620,
    tilt: 72,
    heading: 92,
  },
  {
    id: "safety",
    label: "防災説明視点",
    center: { lat: 35.5837, lng: 139.6618, altitude: 110 },
    range: 2100,
    tilt: 64,
    heading: 18,
  },
];

const layerLabels: Record<LayerKey, string> = {
  spots: "回遊スポット",
  route: "回遊ルート",
  flood: "浸水想定",
  shelters: "避難所",
  boundary: "行政/町丁目境界",
};

const layerDefaults: Record<LayerKey, boolean> = {
  spots: true,
  route: true,
  flood: true,
  shelters: true,
  boundary: false,
};

const walkSpots: Spot[] = [
  {
    id: "station",
    name: "武蔵小杉駅",
    category: "交通結節点",
    description: "JR線と東急線が交差する回遊の起点。",
    source: "Manual seed data",
    memo: "駅俯瞰プリセットの中心。",
    position: { lat: 35.5761, lng: 139.6566, altitude: 30 },
  },
  {
    id: "grand-tree",
    name: "グランツリー武蔵小杉",
    category: "商業施設",
    description: "駅東側の主要な滞在スポット。",
    source: "Manual seed data",
    memo: "街歩きルートの序盤に置くと説明しやすい。",
    position: { lat: 35.5735, lng: 139.6606, altitude: 30 },
  },
  {
    id: "kosugi-core",
    name: "こすぎコアパーク",
    category: "広場",
    description: "駅周辺イベントや待ち合わせに使われる公開空間。",
    source: "Manual seed data",
    memo: "駅前滞留と導線を説明する地点。",
    position: { lat: 35.5773, lng: 139.6592, altitude: 25 },
  },
  {
    id: "todoroki",
    name: "等々力緑地方面",
    category: "公園・広域避難候補",
    description: "北側の広い緑地空間へ向かう防災文脈の参照点。",
    source: "Manual seed data",
    memo: "実データ投入時に避難場所属性を確認する。",
    position: { lat: 35.5869, lng: 139.6504, altitude: 35 },
  },
  {
    id: "tamagawa",
    name: "多摩川沿い",
    category: "河川空間",
    description: "浸水想定と親水空間を同時に説明しやすい地点。",
    source: "Manual seed data",
    memo: "防災説明視点と組み合わせる。",
    position: { lat: 35.5901, lng: 139.666, altitude: 35 },
  },
];

const shelters: Spot[] = [
  {
    id: "nakahara-civic",
    name: "中原市民館周辺",
    category: "避難所候補",
    description: "公共施設レイヤー投入前の候補地点。",
    source: "Manual seed data",
    memo: "国土数値情報/自治体データで後続確認する。",
    position: { lat: 35.5769, lng: 139.6551, altitude: 35 },
  },
  {
    id: "school-north",
    name: "駅北側学校施設周辺",
    category: "避難所候補",
    description: "避難施設データ取り込み時の差し替え対象。",
    source: "Manual seed data",
    memo: "正式名称と種別は実データで確定する。",
    position: { lat: 35.582, lng: 139.6578, altitude: 35 },
  },
];

const routePath: LatLngAltitude[] = [
  { lat: 35.5761, lng: 139.6566, altitude: 18 },
  { lat: 35.5773, lng: 139.6592, altitude: 18 },
  { lat: 35.5735, lng: 139.6606, altitude: 18 },
  { lat: 35.5782, lng: 139.6637, altitude: 18 },
  { lat: 35.5901, lng: 139.666, altitude: 18 },
];

const floodArea: LatLngAltitude[] = [
  { lat: 35.5812, lng: 139.6508, altitude: 8 },
  { lat: 35.5924, lng: 139.6564, altitude: 8 },
  { lat: 35.594, lng: 139.6708, altitude: 8 },
  { lat: 35.5855, lng: 139.6729, altitude: 8 },
  { lat: 35.579, lng: 139.6638, altitude: 8 },
];

const boundaryArea: LatLngAltitude[] = [
  { lat: 35.5655, lng: 139.6477, altitude: 10 },
  { lat: 35.5889, lng: 139.6477, altitude: 10 },
  { lat: 35.592, lng: 139.6723, altitude: 10 },
  { lat: 35.5672, lng: 139.6741, altitude: 10 },
];

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  return new Promise<GoogleMapsNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    window.__kosugiMapsLoaded = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps namespace was not initialized."));
      }
    };

    if (existingScript) {
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
      reject(new Error(`Google Maps JavaScript API failed to load. (${eventType})`));
    };

    document.head.append(script);
  });
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
  const presentationTimers = useRef<number[]>([]);

  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    apiKey ? "loading" : "idle",
  );
  const [loadError, setLoadError] = useState("");
  const [activePreset, setActivePreset] = useState(cameraPresets[0].id);
  const [activeSpot, setActiveSpot] = useState<Spot>(walkSpots[0]);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(layerDefaults);
  const [presentationStep, setPresentationStep] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

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
          marker.addEventListener("click", () => setActiveSpot(spot));
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
          marker.addEventListener("click", () => setActiveSpot(spot));
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

        const boundary = new Polygon3DElement({
          path: boundaryArea,
          fillColor: "rgba(255, 255, 255, 0.04)",
          strokeColor: "#475569",
          strokeWidth: 2,
          drawsOccludedSegments: true,
          altitudeMode: "RELATIVE_TO_GROUND",
        });
        createdMap.append(boundary);

        const layerElements = {
          spots: spotMarkers,
          shelters: shelterMarkers,
          route: [route],
          flood: [flood],
          boundary: [boundary],
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
    const activeTimers = presentationTimers.current;

    return () => {
      cancelled = true;
      activeTimers.forEach((timer) => window.clearTimeout(timer));
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
    setIsPresenting(false);
    setPresentationStep(0);
    presentationTimers.current.forEach((timer) => window.clearTimeout(timer));
    flyTo(mapRef.current, preset);
  }

  function toggleLayer(key: LayerKey) {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  }

  function startPresentation() {
    const steps = [cameraPresets[0], cameraPresets[2], cameraPresets[3]];

    presentationTimers.current.forEach((timer) => window.clearTimeout(timer));
    setIsPresenting(true);

    steps.forEach((preset, index) => {
      const timer = window.setTimeout(() => {
        setPresentationStep(index + 1);
        setActivePreset(preset.id);
        flyTo(mapRef.current, preset, index === 0 ? 800 : 1800);

        if (index === 1) {
          setLayers((current) => ({ ...current, spots: true, route: true }));
          setActiveSpot(walkSpots[1]);
        }

        if (index === 2) {
          setLayers((current) => ({ ...current, flood: true, shelters: true }));
          setActiveSpot(walkSpots[4]);
          setIsPresenting(false);
        }
      }, index * 2600);
      presentationTimers.current.push(timer);
    });
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
          <button className="btn btn-primary" type="button" onClick={startPresentation}>
            {isPresenting ? `ステップ ${presentationStep}/3` : "プレゼンモード開始"}
          </button>
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

        <aside className="panel" aria-label="layer controls and detail panel">
          <section className="panel-section">
            <h2>Layer Controls</h2>
            <p className="panel-note">Google標準の地名・店舗アイコンはベースマップ表示です。</p>
            <div className="group">
              {allLayerEntries.map(([key, label]) => (
                <label className="row" key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={() => toggleLayer(key)}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h2>表示情報</h2>
            <div className="detail">
              <p className="detail-kind">{activeSpot.category}</p>
              <h3>{activeSpot.name}</h3>
              <p>{activeSpot.description}</p>
            </div>
            <div className="group compact">
              <p className="row">
                <span>浸水想定</span>
                <strong>{activeSpot.id === "tamagawa" ? "要確認" : "未判定"}</strong>
              </p>
              <p className="row">
                <span>最寄り避難所候補</span>
                <strong>{shelters[0].name}</strong>
              </p>
              <p className="row">
                <span>出典</span>
                <strong>{activeSpot.source}</strong>
              </p>
            </div>
            <p className="memo">{activeSpot.memo}</p>
          </section>

          <small>出典表示エリア: 国土数値情報 / OSM / Manual seed data</small>
        </aside>
      </section>
    </main>
  );
}
