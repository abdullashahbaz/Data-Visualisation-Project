/**
 * scripts/bubble.js
 * ─────────────────────────────────────────────────────────────
 * Chart 1 – Bubble Chart: GDP per Capita vs Total Medals
 *
 * Visual encodings
 *   x-axis  : Average GDP per capita (log scale)
 *   y-axis  : Total medals won (1960–2016)
 *   radius  : Number of athletes sent (square-root scale)
 *   opacity : Highlights selected country; dims others
 *
 * Interactions
 *   click  → selectCountry() – cascades to map, bump, timeline
 *   hover  → tooltip with country stats
 *   scroll → zoom / pan within the plot area
 *
 * Depends on: state.js, utils.js, main.js (selectCountry)
 */

"use strict";

// ── Public entry point ───────────────────────────────────────

/**
 * Draw (or fully redraw) the bubble chart.
 * Clears the #bubble-chart container before rendering.
 */
function drawBubbleChart() {
  const container = document.getElementById("bubble-chart");
  d3.select("#bubble-chart").selectAll("*").remove();

  // When a country is selected, show only that bubble at full opacity;
  // otherwise apply the global medal / GDP filters.
  let filtered = state.selectedCountry
    ? state.summaryData.filter(d => d.country === state.selectedCountry)
    : state.summaryData.filter(d =>
        d.total_medals >= state.minMedals && d.avg_gdp_per_capita >= state.minGdp
      );

  if (filtered.length === 0) {
    d3.select("#bubble-chart").append("div")
      .attr("class", "empty-message")
      .text("No countries match the current filters.");
    return;
  }

  const W  = container.clientWidth || 600;
  const H  = 450;
  const bMargin = { top: MARGIN.top, right: 160, bottom: MARGIN.bottom, left: MARGIN.left };
  const cW = W - bMargin.left - bMargin.right;
  const cH = H - bMargin.top  - bMargin.bottom;

  const svg = d3.select("#bubble-chart").append("svg")
    .attr("width", "100%").attr("height", "100%")
    .style("min-height", `${H}px`)
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${bMargin.left},${bMargin.top})`);

  // Clip path – prevents bubbles overflowing the plot area during zoom
  svg.append("defs").append("clipPath").attr("id", "bubble-clip")
    .append("rect").attr("width", cW).attr("height", cH);

  const gridLayer  = g.append("g").attr("class", "grid-layer");
  const xAxisLayer = g.append("g").attr("class", "axis x-axis").attr("transform", `translate(0,${cH})`);
  const yAxisLayer = g.append("g").attr("class", "axis y-axis");
  const plotLayer  = g.append("g").attr("class", "plot-layer").attr("clip-path", "url(#bubble-clip)");

  // Scales – domain from full dataset so zoom is stable across filter changes
  const xScale = d3.scaleLog()
    .domain(d3.extent(state.summaryData, d => d.avg_gdp_per_capita))
    .range([0, cW]);
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(state.summaryData, d => d.total_medals) * 1.08])
    .range([cH, 0]).nice();
  const rScale = d3.scaleSqrt()
    .domain([0, d3.max(state.summaryData, d => d.athlete_count)])
    .range([4, 32]);

  /**
   * Redraw axes and grid lines using potentially zoomed scales.
   * @param {d3.ScaleLogarithmic} xS
   * @param {d3.ScaleLinear}      yS
   */
  function renderAxes(xS, yS) {
    const ticks = logTicks(xS.domain()[0], xS.domain()[1]);
    gridLayer.selectAll("*").remove();
    gridLayer.append("g").attr("class","grid").attr("transform",`translate(0,${cH})`)
      .call(d3.axisBottom(xS).tickValues(ticks).tickSize(-cH).tickFormat(""));
    gridLayer.append("g").attr("class","grid")
      .call(d3.axisLeft(yS).ticks(6).tickSize(-cW).tickFormat(""));
    xAxisLayer.call(d3.axisBottom(xS).tickValues(ticks).tickFormat(fmtSI));
    yAxisLayer.call(d3.axisLeft(yS).ticks(6).tickFormat(d3.format(",")));
  }

  renderAxes(xScale, yScale);

  // Axis labels
  g.append("text").attr("class","axis-label")
    .attr("x", cW/2).attr("y", cH+50).attr("text-anchor","middle")
    .text("Average GDP per Capita (log scale)");
  g.append("text").attr("class","axis-label")
    .attr("transform","rotate(-90)").attr("x",-cH/2).attr("y",-68).attr("text-anchor","middle")
    .text("Total Medals (1960–2016)");

  // Sort so small bubbles render on top of large ones
  const sorted = [...filtered].sort((a,b) => b.athlete_count - a.athlete_count);

  const bubbles = plotLayer.selectAll(".bubble")
    .data(sorted, d => d.iso3)
    .join("circle")
    .attr("class", "bubble")
    .attr("cx", d => xScale(d.avg_gdp_per_capita))
    .attr("cy", d => yScale(d.total_medals))
    .attr("r", 0)
    .attr("fill", d => state.selectedCountry === d.country ? "var(--yellow)" : "var(--bubble-base)")
    .attr("fill-opacity", d =>
      (!state.selectedCountry || state.selectedCountry === d.country) ? 0.55 : 0.18)
    .attr("stroke", d => state.selectedCountry === d.country ? "var(--bubble-stroke-hi)" : "var(--bubble-stroke-lo)")
    .attr("stroke-width", d => state.selectedCountry === d.country ? 2.5 : 1.1)
    .on("mouseover", function(event, d) {
      d3.select(this).interrupt().transition().duration(120)
        .attr("fill-opacity", 0.9).attr("stroke-width", 2.8);
      showTooltip(
        `<strong>${d.country}</strong><br>
         GDP/capita: ${fmtGDP(d.avg_gdp_per_capita)}<br>
         Total medals: ${fmtNum(d.total_medals)}<br>
         Athletes: ${fmtNum(d.athlete_count)}`, event);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", function(event, d) {
      d3.select(this).interrupt().transition().duration(120)
        .attr("fill-opacity", (!state.selectedCountry || state.selectedCountry === d.country) ? 0.55 : 0.18)
        .attr("stroke-width", state.selectedCountry === d.country ? 2.5 : 1.1);
      hideTooltip();
    })
    .on("click", (event, d) => { event.stopPropagation(); selectCountry(d.country); });

  // Entrance animation
  bubbles.transition().duration(900).attr("r", d => rScale(d.athlete_count));

  // Label only the top-3 medal-winners to avoid clutter
  plotLayer.selectAll(".bubble-label")
    .data([...filtered].sort((a,b) => b.total_medals - a.total_medals).slice(0,3), d => d.iso3)
    .join("text").attr("class","bubble-label")
    .attr("x", d => xScale(d.avg_gdp_per_capita))
    .attr("y", d => yScale(d.total_medals) - rScale(d.athlete_count) - 7)
    .attr("text-anchor","middle").text(d => d.country);

  // Zoom / pan behaviour
  const zoom = d3.zoom()
    .scaleExtent([1, 8]).translateExtent([[0,0],[cW,cH]]).extent([[0,0],[cW,cH]])
    .on("zoom", ({ transform }) => {
      const xZ = transform.rescaleX(xScale);
      const yZ = transform.rescaleY(yScale);
      renderAxes(xZ, yZ);
      bubbles.attr("cx", d => xZ(d.avg_gdp_per_capita)).attr("cy", d => yZ(d.total_medals));
      plotLayer.selectAll(".bubble-label")
        .attr("x", d => xZ(d.avg_gdp_per_capita))
        .attr("y", d => yZ(d.total_medals) - rScale(d.athlete_count) - 7);
    });

  svg.call(zoom).on("dblclick.zoom", null);
}

// ── Private helpers ──────────────────────────────────────────