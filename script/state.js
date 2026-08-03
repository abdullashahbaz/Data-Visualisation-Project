/**
 * scripts/state.js
 * ─────────────────────────────────────────────────────────────
 * Shared constants and application state.
 * Loaded first – every other script reads from this file.
 *
 * CONSTANTS  – values that never change at runtime
 * STATE      – mutable object updated by selectCountry() in main.js
 */

"use strict";

// ── Olympic metadata ─────────────────────────────────────────
/** Summer Olympic years included in this data story. */
const YEARS = [1960,1964,1968,1972,1976,1980,1984,1988,1992,1996,2000,2004,2008,2012,2016];

/** Number of countries shown in the bump chart. */
const BUMP_TOP_N = 15;

/**
 * Historical annotations rendered on the bump chart.
 * @type {Array<{year: number, label: string, align: "left"|"right"}>}
 */
const BOYCOTT_ANNOTATIONS = [
  { year: 1980, label: "1980: USA boycott",  align: "right" },
  { year: 1984, label: "1984: USSR boycott", align: "left"  }
];

/**
 * Fixed colour palette for bump-chart country lines (dark-background safe).
 * These are intentionally hardcoded (not CSS variables) because D3 needs to
 * access them programmatically to build a Map<country → colour> at runtime.
 * All other chart colours are referenced via var(--...) CSS custom properties.
 */
const LINE_PALETTE = [
  "#60a5fa","#f87171","#4ade80","#fb923c","#c084fc",
  "#34d399","#f472b6","#38bdf8","#a78bfa","#2dd4bf",
  "#fbbf24","#86efac","#fca5a1","#93c5fd","#d8b4fe"
];

/** Shared D3 margin object used by bubble and timeline charts. */
const MARGIN = { top: 30, right: 130, bottom: 70, left: 85 };

// ── Data paths ───────────────────────────────────────────────
/** Pre-aggregated per-country summary (bubble chart source). */
const SUMMARY_CSV = "data/summary_countryGDP.csv";

/** Per-country, per-year medals + GDP (bump chart + timeline source). */
const YEARLY_CSV  = "data/yearly_medals.csv";

/** World GeoJSON used as the choropleth map base. */
const GEOJSON_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

// ── Application state ────────────────────────────────────────
/**
 * Single shared state object.
 * All charts read from this; selectCountry() in main.js writes to it.
 *
 * @property {Array}       summaryData     – Loaded from SUMMARY_CSV
 * @property {Array}       yearlyData      – Loaded from YEARLY_CSV
 * @property {Object|null} geoData         – GeoJSON FeatureCollection
 * @property {string|null} selectedCountry – Currently selected country name
 * @property {number}      minMedals       – Bubble chart medal filter threshold
 * @property {number}      minGdp          – Bubble chart GDP filter threshold
 * @property {Object|null} bumpData        – Pre-computed bump chart data (cached)
 */
const state = {
  summaryData    : [],
  yearlyData     : [],
  geoData        : null,
  selectedCountry: null,
  minMedals      : 0,
  minGdp         : 0,
  bumpData       : null
};
