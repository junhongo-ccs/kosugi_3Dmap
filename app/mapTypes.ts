export type LatLngAltitude = {
  lat: number;
  lng: number;
  altitude?: number;
};

export type CameraPreset = {
  id: string;
  label: string;
  center: LatLngAltitude;
  range: number;
  tilt: number;
  heading: number;
};

export type Spot = {
  id: string;
  name: string;
  category: string;
  role: string;
  walkMemo: string;
  safetyMemo: string;
  floodStatus: string;
  nearestShelter: string;
  source: string;
  position: LatLngAltitude;
};

export type LayerKey = "spots" | "route" | "flood" | "shelters";

export type MapDataset = {
  cameraPresets: CameraPreset[];
  walkSpots: Spot[];
  shelters: Spot[];
  routePath: LatLngAltitude[];
  floodArea: LatLngAltitude[];
};

export type CameraState = Pick<CameraPreset, "center" | "range" | "tilt" | "heading">;

export type Map3DElementLike = HTMLElement & {
  center: LatLngAltitude;
  range: number;
  tilt: number;
  heading: number;
  mode: string;
  flyCameraTo?: (options: {
    endCamera: CameraState;
    durationMillis?: number;
  }) => void;
  stopCameraAnimation?: () => void;
};

export type Map3DElementOptions = CameraState & {
  mode: string;
  gestureHandling: string;
  defaultUIHidden: boolean;
  description: string;
};

export type Marker3DElementOptions = {
  position: LatLngAltitude;
  label: string;
  extruded: boolean;
  altitudeMode: string;
};

export type Polyline3DElementOptions = {
  path: LatLngAltitude[];
  strokeColor: string;
  strokeWidth: number;
  outerColor?: string;
  outerWidth?: number;
  drawsOccludedSegments: boolean;
  altitudeMode: string;
};

export type Polygon3DElementOptions = {
  path: LatLngAltitude[];
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  drawsOccludedSegments: boolean;
  altitudeMode: string;
};

export type Maps3DLibrary = {
  Map3DElement: new (options: Map3DElementOptions) => Map3DElementLike;
  Marker3DElement: new (options: Marker3DElementOptions) => HTMLElement;
  Polyline3DElement: new (options: Polyline3DElementOptions) => HTMLElement;
  Polygon3DElement: new (options: Polygon3DElementOptions) => HTMLElement;
};

export type PinElementOptions = {
  background: string;
  borderColor: string;
  glyphColor: string;
  glyphText: string;
  scale?: number;
};

export type PinElementLike = HTMLElement & {
  element?: HTMLElement;
};

export type MarkerLibrary = {
  PinElement: new (options: PinElementOptions) => PinElementLike;
};

export type GoogleMapsNamespace = {
  importLibrary: (library: string) => Promise<unknown>;
};
