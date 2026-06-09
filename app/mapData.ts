import dataset from "../public/data/map-data.json";
import type { MapDataset } from "./mapTypes";

export const mapData = dataset as MapDataset;

export const {
  cameraPresets,
  walkSpots,
  shelters,
  routePath,
  floodArea,
} = mapData;
