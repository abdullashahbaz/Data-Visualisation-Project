/**
 * scripts/map.js
 * ─────────────────────────────────────────────────────────────
 * Chart 2 – Choropleth Map: Medal Efficiency by Country
 *
 * Visual encodings
 *   fill colour : Medal efficiency = medals ÷ (GDP/capita) × 10 000
 *                 Colour scale capped at 95th percentile to avoid outlier wash-out
 *   opacity     : Selected country = 1.0, all others = 0.2
 *   stroke      : Selected country gets a white highlight stroke
 *
 * Interactions
 *   click  → selectCountry() – cascades to bubble, bump, timeline
 *   hover  → tooltip with efficiency score + medal/GDP stats
 *   scroll → zoom / pan (transform applied to the map group layer)
 *
 * Depends on: state.js, utils.js, main.js (selectCountry)
 */

"use strict";

// ── Public entry points ──────────────────────────────────────

/**
 * Initialise (or reinitialise) the choropleth map.
 * Clears the #map-chart container before rendering.
 */
function initMapChart() {
  const container = document.getElementById("map-chart");
  d3.select("#map-chart").selectAll("*").remove();

  const W = container.clientWidth || 600;
  const H = 420;

  const svg = d3.select("#map-chart").append("svg")
    .attr("width","100%").attr("height","100%").style("min-height",`${H}px`)
    .attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");

  // Transparent background rect absorbs pointer events for zoom gestures
  svg.append("rect").attr("width",W).attr("height",H)
    .attr("fill","transparent").style("pointer-events","all");

  const projection = d3.geoNaturalEarth1().fitSize([W, H], state.geoData);
  const path       = d3.geoPath().projection(projection);

  // Medal efficiency colour scale capped at the 95th percentile
  const efficiencies = state.summaryData
    .map(d => (d.total_medals / d.avg_gdp_per_capita) * 10000)
    .sort(d3.ascending);
  const p95        = d3.quantile(efficiencies, 0.95) || 10;
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, p95]);

  // Fast ISO3 → country data lookup
  const dataMap = new Map(state.summaryData.map(d => [d.iso3, d]));

  const mapLayer = svg.append("g").attr("class","map-layer");

  mapLayer.selectAll("path")
    .data(state.geoData.features)
    .join("path")
    .attr("class","map-country")
    .attr("d", path)
    .attr("fill", d => {
      const row = dataMap.get(d.id);
      if (!row) return "var(--map-no-data)";
      return colorScale((row.total_medals / row.avg_gdp_per_capita) * 10000);
    })
    .style("cursor", d => dataMap.has(d.id) ? "pointer" : "default")
    .on("mouseover", function(event, d) {
      const row = dataMap.get(d.id);
      if (!row) return;
      d3.select(this).attr("stroke","var(--map-select-stroke)").attr("stroke-width", 1.8);
      const eff = (row.total_medals / row.avg_gdp_per_capita) * 10000;
      showTooltip(
        `<strong>${row.country}</strong><br>
         <span style="color:var(--yellow);font-weight:bold">Efficiency: ${eff.toFixed(2)}</span><br>
         <span style="font-size:0.85em;opacity:0.7">medals per $10k GDP</span><br>
         Total medals: ${fmtNum(row.total_medals)}<br>
         GDP/capita: ${fmtGDP(row.avg_gdp_per_capita)}`, event);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", function() { updateMapStyle(); hideTooltip(); })
    .on("click", function(event, d) {
      const row = dataMap.get(d.id);
      if (row) selectCountry(row.country);
    });

  updateMapStyle();
  _drawMapLegend(svg, colorScale, p95, W, H);

  // Zoom applied to the map layer group (avoids re-projecting)
  const zoom = d3.zoom()
    .scaleExtent([1, 8]).translateExtent([[0,0],[W,H]]).extent([[0,0],[W,H]])
    .on("zoom", ({ transform }) => {
      mapLayer.attr("transform", transform);
      // Scale stroke width inversely so borders stay thin at high zoom
      mapLayer.selectAll(".map-country").attr("stroke-width", d => {
        const row = state.summaryData.find(c => c.iso3 === d.id);
        return ((row && row.country === state.selectedCountry) ? 2 : 0.5) / transform.k;
      });
    });

  svg.call(zoom);
}

/**
 * Update country opacity and stroke to reflect the current selection.
 * Called by selectCountry() rather than a full chart redraw for performance.
 */
function updateMapStyle() {
  d3.select("#map-chart").selectAll(".map-country")
    .attr("opacity", d => {
      if (!state.selectedCountry) return 1;
      const row = state.summaryData.find(c => c.iso3 === d.id);
      return (row && row.country === state.selectedCountry) ? 1 : 0.2;
    })
    .attr("stroke", d => {
      const row = state.summaryData.find(c => c.iso3 === d.id);
      return (row && row.country === state.selectedCountry)
        ? "var(--map-select-stroke)" : "rgba(255,255,255,0.08)";
    })
    .attr("stroke-width", d => {
      const row = state.summaryData.find(c => c.iso3 === d.id);
      return (row && row.country === state.selectedCountry) ? 2 : 0.5;
    });
}

// ── Private helpers ──────────────────────────────────────────

/**
 * Append a horizontal gradient colour legend to the map SVG.
 * @param {d3.Selection}        svg        – Parent SVG element
 * @param {d3.ScaleSequential}  colorScale – Efficiency colour scale
 * @param {number}              max        – Scale domain maximum (95th percentile)
 * @param {number}              W          – SVG width
 * @param {number}              H          – SVG height
 */
function _drawMapLegend(svg, colorScale, max, W, H) {
  const lW = 140, lH = 10;
  const g  = svg.append("g").attr("transform",`translate(${W - lW - 12}, ${H - 36})`);

  const grad = svg.append("defs").append("linearGradient").attr("id","map-grad");
  for (let i = 0; i <= 10; i++) {
    grad.append("stop").attr("offset",`${i*10}%`)
        .attr("stop-color", colorScale((i/10) * max));
  }

  g.append("rect").attr("width",lW).attr("height",lH).attr("rx",3)
   .attr("fill","url(#map-grad)").attr("stroke","rgba(255,255,255,0.15)");
  g.append("text").attr("class","legend-label").attr("x",0).attr("y",-4).text("Low efficiency");
  g.append("text").attr("class","legend-label").attr("x",lW).attr("y",-4)
   .attr("text-anchor","end").text("High efficiency");
}
