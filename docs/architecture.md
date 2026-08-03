# Application Architecture
**F20DV Group 3 – Olympics & GDP Data Story**
**Dubai Campus · Heriot-Watt University · 2025–2026**

---

## Overview

This is a single-page, client-side web application built with D3.js v7 and vanilla
JavaScript. There is no build step, no server-side code, and no framework dependencies.
All four charts are rendered as SVG elements inside the browser using D3, and the page
loads data dynamically from local CSV files and a public GeoJSON source.

---

## File Structure

```
f-20-dv-du-group-3/
│
├── index.html                   ← Single HTML entry point; all markup and script tags
│
├── styles/
│   ├── main.css                 ← Variables, reset, layout, hero, controls,
│   │                               story sections, conclusion, responsive breakpoints
│   └── charts.css               ← Chart container panels, axes, grid, tooltip,
│                                   per-chart element styles, HTML bubble legend
│
├── scripts/
│   ├── state.js                 ← Module 1: constants + shared state object
│   ├── utils.js                 ← Module 2: tooltip, number formatting, hero stats
│   ├── bubble.js                ← Module 3: Chart 1 – GDP vs Medals bubble chart
│   ├── map.js                   ← Module 4: Chart 2 – Medal Efficiency choropleth map
│   ├── bump.js                  ← Module 5: Chart 3 – Medal Rank bump chart (creative)
│   ├── timeline.js              ← Module 6: Chart 4 – Country Medals + GDP timeline
│   ├── controls.js              ← Module 7: filter controls and dropdown wiring
│   └── main.js                  ← Module 8: orchestrator – selectCountry(), loadData(), init()
│
├── data/
│   ├── summary_countryGDP.csv   ← Per-country aggregated data (bubble chart source)
│   ├── yearly_medals.csv        ← Per-country per-year medals + GDP (bump + timeline)
│   ├── Processed Data/
│   │   └── olympics_gdp_merged.csv  ← Full merged dataset (source for both CSVs above)
│   └── Raw data/
│       ├── athlete_events.csv       ← Kaggle Olympics dataset
│       ├── noc_regions.csv          ← NOC → ISO3 country code mapping
│       └── API_NY.GDP.PCAP.CD_…csv ← World Bank GDP per capita (wide format)
│
├── libs/
│   └── d3/
│       └── d3.v7.min.js         ← D3.js v7 local copy (no internet needed for charts)
│
├── notebook/
│   ├── Data_Merge.ipynb         ← Stage 1: data cleaning, NOC mapping, merge pipeline
│   ├── EDA.ipynb                ← Stage 2: exploratory data analysis
│   └── country.ipynb            ← Generated summary_countryGDP.csv
│
└── docs/
    ├── architecture.md          ← This file
    ├── user-guide.md            ← End-user interaction guide
    └── dataSources.md           ← Dataset licences and provenance
```

---

## Page Structure

The application follows a narrative data story layout with this section order:

```
1. Hero          – Title, subtitle, four live stat cards
2. Controls      – Country search, medal filter, GDP filter, clear button
3. Chapter 1     – Bubble chart + Map (side by side, 1fr 1fr grid)
                   HTML athlete count legend (below bubble chart)
                   Timeline (below both charts, linked to selection)
                   Insight callout
4. Conclusion    – "What the Data Tells Us" – three stat cards
5. Chapter 2     – Bump chart + insight callout
```

---

## Script Load Order and Dependencies

Scripts are loaded as plain `<script>` tags in the order below. Each module uses
globals declared by earlier modules. No ES6 `import/export` is used.

```
libs/d3/d3.v7.min.js   (D3 library — loaded first)
        │
        ▼
state.js      constants + state object          ← no dependencies
        │
        ▼
utils.js      tooltip, formatting, hero stats   ← needs: state.js
        │
        ├──▶ bubble.js    Chart 1               ← needs: state, utils, selectCountry*
        ├──▶ map.js       Chart 2               ← needs: state, utils, selectCountry*
        ├──▶ bump.js      Chart 3               ← needs: state, utils, selectCountry*
        ├──▶ timeline.js  Chart 4               ← needs: state, utils
        │
        ▼
controls.js   filter UI wiring                  ← needs: state, utils, chart fns, selectCountry*
        │
        ▼
main.js       selectCountry*, loadData, init    ← needs: all modules above

* selectCountry() is defined in main.js but called by bubble.js, map.js,
  bump.js, and controls.js. Because all scripts are parsed before init()
  runs, the function reference is available at call time.
```

---

## Shared State Object

All charts read from and write to a single `state` object defined in `state.js`.
This is the single source of truth for the application.

| Property           | Type             | Set by          | Read by                    |
|--------------------|------------------|-----------------|----------------------------|
| `summaryData`      | Array            | `loadData()`    | bubble, map, controls      |
| `yearlyData`       | Array            | `loadData()`    | bump, timeline             |
| `geoData`          | GeoJSON Object   | `loadData()`    | map                        |
| `selectedCountry`  | string or null   | `selectCountry()` | all four charts          |
| `minMedals`        | number           | medal filter    | bubble                     |
| `minGdp`           | number           | GDP filter      | bubble                     |
| `bumpData`         | Object or null   | `prepareBumpData()` | bump (cached)          |

---

## Cross-Chart Interaction

```
User clicks:
  bubble → selectCountry(name)
  map    → selectCountry(name)    ← bidirectional pair
  bump   → selectCountry(name)
  dropdown → selectCountry(name)

selectCountry(name) in main.js:
  ├── updates state.selectedCountry
  ├── syncs dropdown value
  ├── updates timeline subtitle text
  ├── updateHeroStats()
  ├── drawBubbleChart()    ← re-renders with highlight/dim
  ├── updateMapStyle()     ← lightweight opacity/stroke only (no full redraw)
  ├── drawBumpChart()      ← re-renders with highlight/dim
  └── drawTimeline()       ← renders country-specific dual-axis chart
```

**Bidirectional pairs that satisfy the brief requirement:**
- Bubble ↔ Map: clicking either updates both
- Bump → Bubble + Map: clicking a bump line updates both other charts
- Dropdown → all four charts simultaneously

---

## Chart Details

### Chart 1 – Bubble Chart (`bubble.js`)
- Reads from `state.summaryData`
- x-axis: average GDP per capita (log scale)
- y-axis: total medals (linear scale)
- Bubble radius: athlete count (square-root scale)
- Athlete count legend: plain HTML below the chart panel (not drawn in SVG)
- Zoom/pan via `d3.zoom()` applied to SVG; axes rescaled on zoom

### Chart 2 – Choropleth Map (`map.js`)
- Reads from `state.summaryData` and `state.geoData`
- Fill colour: medal efficiency = medals ÷ (GDP/capita) × 10,000
- Colour scale: `d3.interpolateYlOrRd`, capped at 95th percentile
- Zoom/pan via `d3.zoom()` applied to map layer group
- `updateMapStyle()` handles selection highlight without full redraw

### Chart 3 – Bump Chart (`bump.js`) — creative chart
- Reads from `state.yearlyData`
- Ranks the top 15 countries by medal count per Olympic year
- `prepareBumpData()` computes and caches rankings in `state.bumpData`
- Line draw-on animation via stroke-dashoffset technique
- Historical boycott annotations at 1980 and 1984

### Chart 4 – Country Timeline (`timeline.js`)
- Reads from `state.yearlyData`
- Only renders when `state.selectedCountry` is set
- Left y-axis: total medals (yellow line)
- Right y-axis: GDP per capita (blue dashed line)
- Sits inside Chapter 1, directly below the bubble chart and map

---

## CSS Architecture

| File          | Responsibility                                                     |
|---------------|--------------------------------------------------------------------|
| `main.css`    | CSS variables, reset, hero, controls, story sections, conclusion, grid layout, responsive |
| `charts.css`  | Chart container heights, axes, grid lines, tooltip, per-chart styles, HTML bubble legend |

Both files share CSS custom properties declared in `main.css :root`.

`#bubble-chart` and `#map-chart` have a fixed `height: 450px` to keep them
equal size side by side. `#bump-chart` and `#timeline-chart` use `min-height: 450px`.

---

## Data Files

| File | Rows | Used by | How generated |
|------|------|---------|---------------|
| `summary_countryGDP.csv` | 125 | Bubble chart, Map | `notebook/country.ipynb` |
| `yearly_medals.csv` | 2,247 | Bump chart, Timeline | Aggregated from merged CSV |
| `olympics_gdp_merged.csv` | 271,116 | Source only | `notebook/Data_Merge.ipynb` |

`yearly_medals.csv` was created to avoid loading the 45 MB merged CSV in the
browser. It contains per-country per-year totals for gold, silver, bronze,
total medals, GDP per capita, and athlete count.

---

## How to Run

```bash
# From the project root folder:
python3 -m http.server 8080
# Then open: http://localhost:8080
```

Or use the **Live Server** extension in VS Code (right-click `index.html` →
Open with Live Server).

An internet connection is needed for the world map GeoJSON which is fetched
from a public CDN at startup.