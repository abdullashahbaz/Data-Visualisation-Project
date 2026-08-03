/**
 * scripts/timeline.js
 * ─────────────────────────────────────────────────────────────
 * Chart 4 – Country Timeline: Medals & GDP per Capita Over Time
 *
 * A dual-axis line chart rendered when a country is selected.
 * Overlaying medals and GDP on the same time axis lets viewers
 * directly test whether a country's economic trajectory aligns
 * with its Olympic performance – the central question of this
 * data story.
 *
 * Visual encodings
 *   x-axis (bottom)  : Olympic year (linear, Summer games only)
 *   y-axis left      : Total medals (yellow line)
 *   y-axis right     : GDP per capita in USD (blue dashed line)
 *   circles          : Interactive data points for both series
 *
 * Interactions
 *   hover circle → tooltip with year, full medal breakdown, GDP
 *   Chart is reset to a placeholder when no country is selected
 *
 * Depends on: state.js, utils.js
 */

"use strict";

// ── Public entry point ───────────────────────────────────────

/**
 * Draw (or fully redraw) the country timeline.
 * Renders a placeholder if state.selectedCountry is null.
 */
function drawTimeline() {
  d3.select("#timeline-chart").selectAll("*").remove();
  const container = document.getElementById("timeline-chart");

  // ── Placeholder state ──────────────────────────────────────
  if (!state.selectedCountry) {
    const W = container.clientWidth || 800;
    const H = 400;
    d3.select("#timeline-chart").append("svg")
      .attr("width","100%").attr("height","100%").style("min-height",`${H}px`)
      .attr("viewBox",`0 0 ${W} ${H}`)
      .append("text")
        .attr("x",W/2).attr("y",H/2).attr("text-anchor","middle")
        .attr("fill","var(--text-dim)").attr("font-size","16px")
        .text("↑ Select a country in any chart above");
    return;
  }

  // ── Data filtering ─────────────────────────────────────────
  const rows = state.yearlyData
    .filter(d => d.country === state.selectedCountry && d.total > 0 && d.gdp > 0)
    .sort((a,b) => d3.ascending(a.year, b.year));

  if (rows.length < 2) {
    d3.select("#timeline-chart").append("div").attr("class","empty-message")
      .text(`Not enough data available for ${state.selectedCountry}.`);
    return;
  }

  // ── Layout ─────────────────────────────────────────────────
  const W  = container.clientWidth || 800;
  const H  = 420;
  const mL = 80, mR = 90, mT = 30, mB = 50;
  const cW = W - mL - mR;
  const cH = H - mT - mB;

  const svg = d3.select("#timeline-chart").append("svg")
    .attr("width","100%").attr("height","100%").style("min-height",`${H}px`)
    .attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");

  const g = svg.append("g").attr("transform",`translate(${mL},${mT})`);

  // ── Scales ─────────────────────────────────────────────────
  const xScale  = d3.scaleLinear().domain(d3.extent(rows,d=>d.year)).range([0,cW]);
  const yMedals = d3.scaleLinear().domain([0, d3.max(rows,d=>d.total) * 1.2]).range([cH,0]).nice();
  const yGDP    = d3.scaleLinear().domain([0, d3.max(rows,d=>d.gdp)   * 1.2]).range([cH,0]).nice();

  // ── Grid + axes ────────────────────────────────────────────
  g.append("g").attr("class","grid")
    .call(d3.axisLeft(yMedals).ticks(5).tickSize(-cW).tickFormat(""));

  g.append("g").attr("class","axis x-axis").attr("transform",`translate(0,${cH})`)
    .call(d3.axisBottom(xScale).tickValues(rows.map(d=>d.year)).tickFormat(d3.format("d")));
  g.append("g").attr("class","axis y-axis")
    .call(d3.axisLeft(yMedals).ticks(5).tickFormat(d3.format(",")));
  g.append("g").attr("class","axis y-axis-right").attr("transform",`translate(${cW},0)`)
    .call(d3.axisRight(yGDP).ticks(5).tickFormat(d => "$"+d3.format("~s")(d)));

  // ── Axis labels ────────────────────────────────────────────
  g.append("text").attr("class","axis-label")
    .attr("x",cW/2).attr("y",cH+42).attr("text-anchor","middle").text("Olympic Year");
  g.append("text").attr("class","axis-label").attr("fill","var(--yellow)")
    .attr("transform","rotate(-90)").attr("x",-cH/2).attr("y",-64).attr("text-anchor","middle")
    .text("Total Medals");
  g.append("text").attr("class","axis-label").attr("fill","#93c5fd")
    .attr("transform","rotate(90)").attr("x",cH/2).attr("y",-(cW+74)).attr("text-anchor","middle")
    .text("GDP per Capita (USD)");

  // ── Series renderer ────────────────────────────────────────

  /**
   * Draw a single animated line series with interactive circles.
   * @param {string}   cssClass  – CSS class applied to the path and dots
   * @param {string}   colour    – Stroke colour for the line and dots
   * @param {Function} yFn       – Maps a data row to a y pixel value
   * @param {Function} tipFn     – Returns tooltip HTML for a data row
   */
  function drawSeries(cssClass, colour, yFn, tipFn) {
    const lineGen = d3.line().x(d=>xScale(d.year)).y(yFn).curve(d3.curveMonotoneX);

    const p = g.append("path").datum(rows)
      .attr("class", cssClass)
      .attr("stroke", colour).attr("stroke-width", 2.5)
      .attr("fill","none").attr("d", lineGen);

    const len = p.node().getTotalLength() || 1;
    p.attr("stroke-dasharray",`${len} ${len}`)
     .attr("stroke-dashoffset", len)
     .transition().duration(1200).ease(d3.easeLinear)
     .attr("stroke-dashoffset", 0);

    g.selectAll(`.${cssClass}-dot`)
      .data(rows).join("circle")
      .attr("class",`${cssClass}-dot`)
      .attr("cx",d=>xScale(d.year)).attr("cy",yFn)
      .attr("r",4.5).attr("fill",colour)
      .on("mouseover",(event,d)=>showTooltip(tipFn(d),event))
      .on("mousemove",moveTooltip)
      .on("mouseout",hideTooltip);
  }

  // GDP drawn first so medals line renders on top
  drawSeries("gdp-line","#93c5fd", d=>yGDP(d.gdp), d=>
    `<strong>${state.selectedCountry} – ${d.year}</strong><br>GDP/capita: ${fmtGDP(d.gdp)}`
  );
  drawSeries("medals-line","var(--yellow)", d=>yMedals(d.total), d=>
    `<strong>${state.selectedCountry} – ${d.year}</strong><br>
     Medals: ${fmtNum(d.total)}<br>
     🥇 ${d.gold} &nbsp; 🥈 ${d.silver} &nbsp; 🥉 ${d.bronze}<br>
     GDP/capita: ${fmtGDP(d.gdp)}`
  );

  // ── Legend ─────────────────────────────────────────────────
  const leg = g.append("g").attr("transform",`translate(${cW-140},8)`);
  [["var(--yellow)","Medals"],["#93c5fd","GDP/capita"]].forEach(([col,lbl],i) => {
    leg.append("line").attr("x1",0).attr("x2",22).attr("y1",i*22+6).attr("y2",i*22+6)
       .attr("stroke",col).attr("stroke-width",2.5);
    leg.append("text").attr("x",28).attr("y",i*22+10)
       .attr("fill","var(--text-legend)").attr("font-size","12px").text(lbl);
  });
}
