/**
 * scripts/controls.js
 * ─────────────────────────────────────────────────────────────
 * Filter controls: country search dropdown, medal filter,
 * GDP filter, and the clear-selection button.
 *
 * initControls() must be called after state.summaryData is loaded.
 * It references selectCountry() which is defined in main.js.
 *
 * Depends on: state.js, utils.js, main.js (selectCountry)
 */

"use strict";

/**
 * Populate the country dropdown and wire up all filter controls.
 * Must be called once after state.summaryData is populated.
 */
function initControls() {
  // Populate the country search dropdown alphabetically
  const sorted = [...state.summaryData].sort((a,b) => d3.ascending(a.country, b.country));

  d3.select("#country-search")
    .selectAll("option.country-opt")
    .data(sorted)
    .join("option")
    .attr("class","country-opt")
    .attr("value", d => d.country)
    .text(d => d.country);

  // Country search – delegates to selectCountry() for cross-chart sync
  d3.select("#country-search").on("change", function () {
    selectCountry(this.value || null);
  });

  // Medal filter – only affects bubble chart (no cross-chart cascade needed)
  d3.select("#medal-filter").on("change", function () {
    state.minMedals = +this.value;
    drawBubbleChart();
  });

  // GDP filter – only affects bubble chart
  d3.select("#gdp-filter").on("change", function () {
    state.minGdp = +this.value;
    drawBubbleChart();
  });

  // Clear selection button
  d3.select("#clear-selection").on("click", () => {
    selectCountry(null);
  });
}
