# Engineering Studio

One web app for HVAC/plumbing engineering calculations done as markups on PDF drawings.
Each calculation is a **module** on a shared base (sheets, drawing canvas, undo, project file, reports).
Modules live in one place but stay independent unless a link is deliberately added.

Started as a copy of HVAC Studio (repo `HVAC-Calculator`, commit 05549a4, 2026-11-11).
That repo and the separate Static Pressure and Pressurization apps stay as they are; do not edit them from here.

Stack: React 19 + TypeScript + Vite, pdf.js. Drawing is SVG over a pdf.js canvas.
Build: `npm run build` (tsc -b && vite build). Dev: `npm run dev`.

## Modules

| Module | Status | Shares |
|---|---|---|
| HVAC (ventilation → loads → mechanical equipment) | Most refined, in use on real projects | Room geometry |
| Plumbing fixtures (WA: 2021 UPC as adopted, WAC 51-56) | In use | Room geometry |
| Pressurization (doors, room pressure network) | To be ported from the Pressurization app | Room geometry only |
| Static pressure (duct sections, fittings, critical path) | To be ported from the Static Pressure app | Sheets and canvas only, no rooms |

## Rules

1. **Do not change how the HVAC/ventilation and plumbing modules calculate or behave** unless the user asks for that change. Restructuring must give identical results (see Regression check).
2. **A module may read shared geometry (sheets, rooms). It never reads or writes another module's data.** Links between modules are added only when the user asks.
3. Pressurization keeps its own supply/return/exhaust/pressure data, stored by room id. It does not use the unused `solveFor / supplyCfm / returnCfm / exhaustCfm / pressureInwg / leakageIn2` fields on `Room`; those belong to the HVAC module.
4. Static pressure objects (ducts, terminals) are not linked to rooms.
5. One drawing system for the whole app: zoom, pan, snapping, ortho, calibration and selection come from the shared canvas. Modules add their own tools (room polygon, door, duct run, fixture), not their own canvas.
6. Calculation math goes in plain functions with no React in them, so it can be tested and reused.
7. When asked to change one module, edit only that module's folder (plus shared code only if the change truly needs it, and say so).
8. Coordinates are PDF points (1/72 in) on the sheet at scale 1. Scale is stored per sheet.
9. New features must not break existing ones. Old project files must keep opening (add migrations, never drop fields silently).

## Target layout (we move toward this step by step; not all of it exists yet)

```
src/
  core/        sheets, canvas, project store + undo, file save/load, shared UI
  modules/
    hvac/          ventilation, loads, mechanical
    plumbing/
    pressurization/
    static-pressure/
  reference/   code tables (ASHRAE 62.1, UPC) — data, not logic
```

## Plan

1. Core, in parts. HVAC + plumbing must work exactly as before after each part.
   - 1a (done): sheets. `src/core/sheets.ts`. A project holds many sheets (one PDF page each, several sheets can share a PDF), each with its own scale, rooms, undo history and zoom. The active sheet is edited through App's existing working state (`pdf, pageNumber, scale, customFeetPerPoint, rooms`); `allSheets()` merges it back. Project file version 2 (`app: 'engineering-studio'`); version 1 HVAC Studio files open as one sheet and are never overwritten in place. Reports and CSV cover every sheet (each room at its own sheet's scale); the room list, room table and totals show the active sheet.
   - 1b: pull the canvas (PDF render, zoom/pan, snapping, calibration) out of App.tsx into `src/core/`.
   - 1c: reducer-style project store with one undo stack; PDFs stored outside the project JSON if file size becomes a problem.
2. Pressurization module: port the pressure solver and door leakage math; doors sit on a room edge and find the rooms on each side (gap tolerance ~12 in, adjustable), and move when that wall moves.
3. Static pressure module: port `engine/` (airflow, network, library) as-is; rebuild the duct tool on the shared canvas; system type per duct system instead of per project.

## Regression check (run before and after every restructuring step)

Use a real project file. Before the change, export the room schedule and reports (CSV/PDF) and keep them.
After the change, open the same file and export again. Numbers must match exactly.
