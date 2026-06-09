<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Demo Value Before Platform Expansion
- Template principle 2 -> II. Static-First Maps Architecture
- Template principle 3 -> III. Traceable GIS Data and Attribution
- Template principle 4 -> IV. Cost and Key Safety by Default
- Template principle 5 -> V. Responsive, Verifiable User Experience
Added sections:
- Project Constraints
- Spec Kit Workflow
Removed sections:
- Template placeholder sections
Templates requiring updates:
- updated .specify/templates/plan-template.md
- updated .specify/templates/spec-template.md
- updated .specify/templates/tasks-template.md
Follow-up TODOs: none
-->
# Musashi-Kosugi 3D Walk + Safety Explorer Constitution

## Core Principles

### I. Demo Value Before Platform Expansion

Every feature MUST support the MVP story: exploring walkability and safety around
Musashi-Kosugi Station in a single 3D map experience. The first usable slice MUST
remain focused on the 1.5 km target area, camera presets, walk spots, route,
flood-risk layer, shelter candidates, and a three-step presentation flow.

New platform capabilities such as Google Places API, PostGIS, MVT delivery,
multi-area comparison, or route generation MUST be treated as future extensions
unless a spec explicitly proves they are required for the MVP acceptance criteria.

### II. Static-First Maps Architecture

The MVP MUST remain deployable as a static Next.js export on Render. Features MUST
avoid server-only dependencies, API Routes, dynamic SSR requirements, and runtime
state that cannot work from static assets unless the implementation plan documents
a deliberate migration to a Render Web Service.

Client-side code MUST handle missing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` without
crashing and MUST provide a clear fallback in the map area. Environment-specific
configuration MUST use documented environment variables and MUST NOT require
committed secrets.

### III. Traceable GIS Data and Attribution

Map layers MUST use free GIS data or manual seed data that can be traced to a
source. Any GeoJSON placed under `public/data/` MUST be clipped to the documented
Musashi-Kosugi target area, simplified enough for client delivery, and limited to
attributes needed for map rendering or the detail panel.

Every data-backed feature MUST document source, processing method, coordinate
assumptions, and attribution text in the relevant spec or data task. Manual seed
data is allowed for MVP speed, but it MUST be labeled as manual and separable from
official sources.

### IV. Cost and Key Safety by Default

Google Maps Platform usage MUST be designed with cost guardrails before public
deployment. Specs and plans that add or change Google APIs MUST identify enabled
APIs, expected billing surface, API-key restrictions, quota or budget controls, and
Render environment variable requirements.

The project MUST NOT add Places API or other paid Google services to MVP scope
without an explicit cost and value justification. Local and production API keys
MUST be separate and restricted by HTTP referrer and API scope.

### V. Responsive, Verifiable User Experience

The application MUST prioritize a usable map-first experience on desktop and
mobile. Core controls for camera presets and presentation mode MUST remain
reachable on both desktop and 360 px mobile widths. Layer controls and detail
content MUST avoid covering the map excessively on mobile.

Features that affect UI behavior MUST be verified with `npm run lint` and
`npm run build`; map or interaction changes SHOULD include focused browser or E2E
verification when an API key or deterministic fallback makes it possible. Any
known unverified map behavior MUST be documented in the implementation summary.

## Project Constraints

The frontend stack is Next.js, TypeScript, React, and Tailwind CSS. Static export
is the default deployment target. MVP data lives under `public/data/` as static
GeoJSON. Large, frequently updated, or complex GIS datasets MUST be clipped and
simplified before delivery to the browser.

The local GIS processing baseline is QGIS 3.44.9 with its bundled GDAL/`ogr2ogr`.
QGIS is used for visual inspection, attribute checks, and boundary sanity checks.
Turf.js may be used for buffer and intersect operations when preparing target-area
data.

The UI MUST avoid explanation-heavy screens in favor of operational controls and
direct map feedback. README remains the canonical place for purpose, setup, data
source notes, cost guardrails, and deployment guidance.

## Spec Kit Workflow

Work proceeds through `constitution -> specify -> plan -> tasks -> implement`.
Each feature spec MUST define independently testable user stories and acceptance
scenarios. Plans MUST pass the Constitution Check before Phase 0 research and
again after Phase 1 design.

Tasks MUST be grouped by user story so each increment can be implemented and
demonstrated independently. Cross-cutting tasks for attribution, environment
configuration, cost guardrails, responsive behavior, and verification MUST be
included whenever a feature touches those areas.

## Governance

This constitution supersedes ad hoc project preferences. Specs, plans, tasks, and
implementation summaries MUST call out any intentional deviation from these
principles and explain why the deviation is necessary.

Amendments require updating this file, recording the impact in the Sync Impact
Report, and checking dependent Spec Kit templates for alignment. Versioning uses
semantic versioning: MAJOR for incompatible governance or principle changes, MINOR
for new or materially expanded principles, and PATCH for clarifications.

Compliance is reviewed during `/speckit.plan`, `/speckit.tasks`, and before
implementation is considered complete. A feature is not complete until lint/build
verification is reported or the reason it could not be run is documented.

**Version**: 1.0.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-09
