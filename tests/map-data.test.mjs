import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataset = JSON.parse(await readFile(new URL("../public/data/map-data.json", import.meta.url)));
const floodRisk = JSON.parse(
  await readFile(new URL("../public/data/flood_risk.geojson", import.meta.url)),
);

test("walk spots reference known official shelters", () => {
  const shelterNames = new Set(dataset.shelters.map((shelter) => shelter.name));

  for (const spot of dataset.walkSpots) {
    assert.ok(
      shelterNames.has(spot.nearestShelter),
      `${spot.name} references unknown shelter: ${spot.nearestShelter}`,
    );
  }
});

test("shelter layer uses official Kawasaki designated shelter data", () => {
  for (const shelter of dataset.shelters) {
    assert.equal(shelter.category, "指定避難所");
    assert.match(shelter.source, /川崎市 指定避難所一覧/);
    assert.equal(typeof shelter.position.lat, "number");
    assert.equal(typeof shelter.position.lng, "number");
  }
});

test("dataset does not contain rejected placeholder shelter labels", () => {
  const serialized = JSON.stringify(dataset);

  assert.equal(serialized.includes("中原市民館周辺"), false);
  assert.equal(serialized.includes("駅北側学校施設周辺"), false);
  assert.equal(serialized.includes("避難所候補"), false);
  assert.equal(serialized.includes("PoC対象範囲"), false);
});

test("Musashi-Kosugi station is split into JR and Tokyu spots", () => {
  const spotNames = dataset.walkSpots.map((spot) => spot.name);

  assert.ok(spotNames.includes("JR武蔵小杉駅"));
  assert.ok(spotNames.includes("東急武蔵小杉駅"));
  assert.equal(spotNames.includes("武蔵小杉駅"), false);
});

test("map geometry has enough points to render route and polygons", () => {
  assert.ok(dataset.cameraPresets.length >= 4);
  assert.ok(dataset.routePath.length >= 2);
  assert.ok(dataset.floodArea.length >= 3);
});

test("spots include official flood depth annotations where applicable", () => {
  const spots = [...dataset.walkSpots, ...dataset.shelters];
  const spotsInFloodArea = spots.filter((spot) => spot.floodStatus === "浸水想定区域内");

  assert.ok(spotsInFloodArea.length > 0);

  for (const spot of spotsInFloodArea) {
    assert.ok(spot.floodRisk, `${spot.name} should include floodRisk details`);
    assert.match(spot.floodRisk.label, /cm/);
    assert.match(spot.floodRisk.source, /国土数値情報 洪水浸水想定区域データ/);
    assert.equal(spot.floodRisk.sourceYear, "2025");
  }
});

test("official flood risk layer is clipped and depth-ranked", () => {
  assert.equal(floodRisk.type, "FeatureCollection");
  assert.ok(floodRisk.features.length > 100);

  const depthRanks = new Set(floodRisk.features.map((feature) => feature.properties.depth_rank));

  assert.ok(depthRanks.has("0.5m-3.0m"));
  assert.ok(depthRanks.has("3.0m-5.0m"));

  for (const feature of floodRisk.features) {
    assert.ok(["Polygon", "MultiPolygon"].includes(feature.geometry.type));
    assert.equal(feature.properties.river, "多摩川");
    assert.equal(feature.properties.scenario, "想定最大規模");
  }
});

test("draft walking route stays in the station and Grand Tree area", () => {
  for (const point of dataset.routePath) {
    assert.ok(point.lat < 35.579, `route point is too far north for the current draft: ${point.lat}`);
    assert.ok(point.lng < 139.662, `route point is too far east for the current draft: ${point.lng}`);
  }
});
