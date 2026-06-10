import { readFile, writeFile } from "node:fs/promises";

const mapDataPath = new URL("../public/data/map-data.json", import.meta.url);
const floodRiskPath = new URL("../public/data/flood_risk.geojson", import.meta.url);

function isPointOnSegment(point, start, end) {
  const [px, py] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const cross = (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1);

  if (Math.abs(cross) > 1e-10) {
    return false;
  }

  return (
    px >= Math.min(x1, x2) - 1e-10 &&
    px <= Math.max(x1, x2) + 1e-10 &&
    py >= Math.min(y1, y2) - 1e-10 &&
    py <= Math.max(y1, y2) + 1e-10
  );
}

function isPointInRing(point, ring) {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];

    if (isPointOnSegment(point, currentPoint, previousPoint)) {
      return true;
    }

    const [x, y] = point;
    const [xi, yi] = currentPoint;
    const [xj, yj] = previousPoint;
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInPolygon(point, polygon) {
  const [outerRing, ...holes] = polygon;

  if (!outerRing || !isPointInRing(point, outerRing)) {
    return false;
  }

  return holes.every((hole) => !isPointInRing(point, hole));
}

function isPointInGeometry(point, geometry) {
  if (geometry.type === "Polygon") {
    return isPointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
  }

  return false;
}

function toCm(meters) {
  return typeof meters === "number" ? Math.round(meters * 100) : null;
}

function formatDepthLabel(minCm, maxCm) {
  if (typeof minCm === "number" && typeof maxCm === "number") {
    return `${minCm}〜${maxCm}cm`;
  }

  if (typeof minCm === "number") {
    return `${minCm}cm以上`;
  }

  return "浸水深不明";
}

function getSpotFloodRisk(spot, floodFeatures) {
  const point = [spot.position.lng, spot.position.lat];
  const matches = floodFeatures.filter((feature) => isPointInGeometry(point, feature.geometry));

  if (matches.length === 0) {
    return null;
  }

  const deepest = matches.reduce((currentDeepest, feature) => {
    const currentCode = Number(currentDeepest.properties.depth_rank_code ?? 0);
    const nextCode = Number(feature.properties.depth_rank_code ?? 0);
    return nextCode > currentCode ? feature : currentDeepest;
  });
  const minCm = toCm(deepest.properties.depth_min_m);
  const maxCm = toCm(deepest.properties.depth_max_m);

  return {
    scenario: deepest.properties.scenario,
    depthRank: deepest.properties.depth_rank,
    depthRankCode: Number(deepest.properties.depth_rank_code),
    depthMinCm: minCm,
    depthMaxCm: maxCm,
    label: formatDepthLabel(minCm, maxCm),
    source: deepest.properties.source,
    sourceYear: deepest.properties.source_year,
  };
}

function annotateSpot(spot, floodFeatures) {
  const floodRisk = getSpotFloodRisk(spot, floodFeatures);
  const { floodRisk: _previousFloodRisk, ...spotWithoutFloodRisk } = spot;

  return {
    ...spotWithoutFloodRisk,
    floodStatus: floodRisk ? "浸水想定区域内" : "浸水想定区域外",
    ...(floodRisk ? { floodRisk } : {}),
  };
}

const [mapData, floodRisk] = await Promise.all([
  readFile(mapDataPath, "utf8").then(JSON.parse),
  readFile(floodRiskPath, "utf8").then(JSON.parse),
]);

const annotated = {
  ...mapData,
  walkSpots: mapData.walkSpots.map((spot) => annotateSpot(spot, floodRisk.features)),
  shelters: mapData.shelters.map((spot) => annotateSpot(spot, floodRisk.features)),
};

await writeFile(mapDataPath, `${JSON.stringify(annotated, null, 2)}\n`);

for (const spot of [...annotated.walkSpots, ...annotated.shelters]) {
  console.log(`${spot.name}: ${spot.floodRisk?.label ?? "浸水想定区域外"}`);
}
