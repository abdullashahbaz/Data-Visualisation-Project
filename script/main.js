/**
 * scripts/main.js
 * ─────────────────────────────────────────────────────────────
 * Application orchestrator: data loading, cross-chart selection,
 * and application bootstrap.
 *
 * Script load order in index.html:
 *   1. state.js      – constants + shared state
 *   2. utils.js      – tooltip, formatting, hero stats
 *   3. bubble.js     – bubble chart
 *   4. map.js        – choropleth map
 *   5. bump.js       – bump chart (creative chart)
 *   6. timeline.js   – country timeline
 *   7. controls.js   – filter controls
 *   8. main.js  ←    – this file: orchestration + init
 *
 * Depends on: all other scripts in the list above
 */

"use strict";

// ── Cross-chart selection ────────────────────────────────────

/**
 * Select or deselect a country.
 * Updates state and triggers a coordinated redraw of all charts.
 *
 * This is the single point of truth for selection changes, ensuring
 * all visualisations remain synchronised (satisfies the bidirectional
 * interaction requirement between every chart pair).
 *
 * @param {string|null} countryName – Country to select, or null to clear
 */
function selectCountry(countryName) {
  // Toggle: clicking the same country again deselects it
  state.selectedCountry = (state.selectedCountry === countryName) ? null : countryName;

  // Keep the dropdown in sync
  d3.select("#country-search").property("value", state.selectedCountry || "");

  // Update the timeline section subtitle
  const sub = document.getElementById("timeline-subtitle");
  if (sub) {
    sub.textContent = state.selectedCountry
      ? `Showing data for ${state.selectedCountry}`
      : "Select a country in any chart above to begin";
  }

  updateHeroStats();
  drawBubbleChart();   // bubble.js
  updateMapStyle();    // map.js  (lightweight style-only update)
  drawBumpChart();     // bump.js
  drawTimeline();      // timeline.js
}

// ── Data loading ─────────────────────────────────────────────

/**
 * Load all three data sources in parallel using Promise.all.
 * Populates state.summaryData, state.yearlyData, state.geoData.
 *
 * Data sources:
 *   SUMMARY_CSV  – Pre-aggregated per-country bubble chart data
 *   YEARLY_CSV   – Per-year per-country medals + GDP (bump + timeline)
 *   GEOJSON_URL  – World GeoJSON for choropleth base
 *
 * @returns {Promise<void>}
 */
async function loadData() {
  const [summary, yearly, geo] = await Promise.all([

    d3.csv(SUMMARY_CSV, d => ({
      country            : d.country,
      iso3               : d.iso3,
      avg_gdp_per_capita : +d.avg_gdp_per_capita,
      total_medals       : +d.total_medals,
      athlete_count      : +d.athlete_count
    })),

    d3.csv(YEARLY_CSV, d => ({
      country  : d.country,
      iso3     : d.iso3,
      year     : +d.year,
      gold     : +d.gold,
      silver   : +d.silver,
      bronze   : +d.bronze,
      total    : +d.total,
      gdp      : d.gdp ? +d.gdp : null,
      athletes : +d.athletes
    })),

    d3.json(GEOJSON_URL)

  ]);

  // Keep only countries with valid GDP and at least one medal
  state.summaryData = summary.filter(d =>
    d.avg_gdp_per_capita > 0 &&
    !isNaN(d.avg_gdp_per_capita) &&
    !isNaN(d.total_medals) &&
    d.total_medals > 0
  );

  // Yearly data requires valid GDP for the timeline chart
  state.yearlyData = yearly.filter(d => d.gdp && d.gdp > 0 && !isNaN(d.gdp));

  state.geoData = geo;
}

// ── Application bootstrap ────────────────────────────────────

/**
 * Initialise the application: load data, wire controls, render charts.
 * Called once when the page loads.
 */
async function init() {
  await loadData();

  initControls();   // controls.js – must run after summaryData is ready
  updateHeroStats();

  drawBubbleChart();  // bubble.js
  initMapChart();     // map.js
  drawBumpChart();    // bump.js
  drawTimeline();     // timeline.js

  // Re-render all charts on viewport resize for responsiveness
  window.addEventListener("resize", () => {
    drawBubbleChart();
    initMapChart();
    drawBumpChart();
    drawTimeline();
  });
}

// Entry point
init();
