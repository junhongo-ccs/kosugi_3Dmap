# Flood Risk GeoJSON Workflow

This document records the QGIS workflow used to replace the initial PoC flood rectangle with official flood inundation data.

## Goal

Create a public web map layer that is faithful to the source flood inundation dataset for the Musashi-Kosugi area.

The app now uses:

```txt
public/data/flood_risk.geojson
```

`public/data/map-data.json` still contains legacy seed geometry for compatibility with older checks, but the production flood layer is rendered from `flood_risk.geojson`, not from the old hand-drawn rectangle.

## Source Data

Primary source:

- 国土数値情報 洪水浸水想定区域データ（河川単位）
- https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31.html

Reference / visual validation:

- 川崎市 洪水ハザードマップ
- https://www.city.kawasaki.jp/530/page/0000018174.html

For this project, the first official layer uses:

- River / water system: 多摩川
- Scenario: 想定最大規模
- Type: 浸水深
- Area of interest: 武蔵小杉駅周辺 and 多摩川方面

If 鶴見川 or 内水氾濫 is added later, keep it as a separate layer and do not merge it into the first `flood_risk.geojson` without updating the legend and source labels.

## Local Tools

Use the local QGIS installation documented in the README:

```txt
C:\Program Files\QGIS 3.44.9\bin\ogr2ogr.exe
```

Confirm GDAL from PowerShell:

```powershell
& "C:\Program Files\QGIS 3.44.9\bin\ogr2ogr.exe" --version
```

Use QGIS for visual inspection, attribute checks, clipping, geometry repair, and final export.

## Recommended Area Of Interest

Initial bounding box for the Musashi-Kosugi PoC:

```txt
West:  139.645
East:  139.675
South: 35.568
North: 35.596
CRS:   EPSG:4326
```

This covers Musashi-Kosugi station, Shin-Maruko, Todoroki side references, and the nearby Tamagawa river area.

Adjust the box if the official polygon is clipped too tightly around the edge of the presentation camera views.

## QGIS Procedure Used

1. Download the flood inundation dataset from 国土数値情報.

   Prefer GeoJSON if available. If only GML is available, load the GML in QGIS and export to GeoJSON after filtering and clipping.

2. Add the dataset to QGIS.

   Use `Layer > Add Layer > Add Vector Layer`.

3. Inspect the attribute table.

   Identify fields for river name, water system, scenario, flood depth rank, and source metadata. Field names can differ by dataset version, so do not assume stable names without checking the downloaded file.

4. Filter to the target flood scenario.

   Use 多摩川 and 想定最大規模. Keep only the inundation depth polygons needed for the app layer.

5. Clip to the area of interest.

   Use either:

   - `Vector > Geoprocessing Tools > Clip`
   - `Processing Toolbox > Extract by extent`

   Use the bounding box in this document as the initial extent, then adjust enough to cover the Musashi-Kosugi, Shin-Maruko, and Uvance Todoroki Stadium presentation views.

6. Repair geometries.

   Run `Processing Toolbox > Fix geometries` before export. This avoids invalid rings or multipolygon issues in browser rendering.

7. Simplify only if necessary.

   First export without simplification. If the web app becomes too slow or the GeoJSON is too large, create a second simplified candidate.

   Suggested starting tolerance:

   ```txt
   2m to 5m
   ```

   Do not simplify until the visual difference has been checked against the original layer and the Kawasaki hazard map PDF.

8. Export as GeoJSON.

   Right click the final layer and choose `Export > Save Features As`.

   Required settings:

   ```txt
   Format: GeoJSON
   File name: C:\github\3Dmaps\public\data\flood_risk.geojson
   CRS: EPSG:4326 - WGS 84
   Encoding: UTF-8
   ```

## Output Schema

The exported GeoJSON should be a `FeatureCollection` containing `Polygon` or `MultiPolygon` features.

Keep only the properties needed for display, legend, and source review. Use stable English property names in the final exported file, even if the source fields are Japanese.

Current display properties:

```json
{
  "river": "多摩川",
  "scenario": "想定最大規模",
  "depth_rank_code": "4",
  "depth_rank": "3.0m-5.0m",
  "depth_min_m": 3.0,
  "depth_max_m": 5.0,
  "source": "国土数値情報 洪水浸水想定区域データ（河川単位）",
  "source_year": "2025"
}
```

If the original data uses categorical depth labels only, keep the label and derive numeric min/max carefully. Do not invent numeric ranges unless they correspond to the official legend.

## Validation Checklist

Before committing `flood_risk.geojson`, check:

- The layer aligns with Musashi-Kosugi, Shin-Maruko, and the Tamagawa river corridor in QGIS.
- The exported CRS is EPSG:4326.
- The GeoJSON has no invalid geometries after `Fix geometries`.
- The visible area roughly matches the Kawasaki flood hazard map for 中原区 / 多摩川 / 浸水深.
- The layer includes all inundation depth classes relevant to the clipped area.
- The file size is reasonable for a static Next.js public asset.
- The file does not include unnecessary nationwide or prefecture-wide polygons.
- The source URL, data year, scenario, and processing notes are recorded.

## Accuracy Notes

If this workflow is followed with no simplification, the boundary accuracy should be essentially the same as the downloaded official dataset within the clipped area.

The app may still show apparent differences because:

- Google 3D Maps terrain/building rendering is independent from the flood dataset.
- The flood layer will be draped or placed with a fixed altitude mode.
- Browser rendering may simplify or triangulate complex polygons visually.
- The hazard map PDF can include cartographic styling that is not identical to the vector dataset.

Do not describe the app layer as a substitute for official disaster guidance. Use wording such as:

```txt
浸水想定は国土数値情報を加工した表示です。避難判断には川崎市など公的機関の最新ハザードマップを確認してください。
```

## App Integration Notes

Current implementation:

- Load `public/data/flood_risk.geojson`.
- Support both `Polygon` and `MultiPolygon`.
- Render each polygon as a Google Maps 3D polygon.
- Color by the official inundation depth class.
- Raise the 3D polygon height by the depth class so the maximum expected inundation depth is visible in the scene.
- Show source labels for 国土数値情報, Kawasaki shelter data, OpenStreetMap, and manual seed data.
- Keep the old placeholder out of production demos.

Depth colors should follow the official hazard map legend as closely as possible. If exact colors are unavailable, choose a sequential water-risk palette and document the mapping.

## Versioning

When replacing the data file, add a short processing note in the commit message or PR description:

```txt
Source: 国土数値情報 洪水浸水想定区域データ
Year: 2025
River: 多摩川
Scenario: 想定最大規模
Processing: clipped to Musashi-Kosugi bbox, fixed geometries, exported EPSG:4326 GeoJSON
```
