/**
 * scripts/bump.js
 * ─────────────────────────────────────────────────────────────
 * Chart 3 – Bump Chart: Medal-Table Rank Over Time  ← creative chart
 *
 * A bump chart is a temporal ranking visualisation rarely seen in
 * standard course material. It answers the core project question:
 * "Which countries have dominated the Olympics over time?"
 *
 * Visual encodings
 *   x-axis       : Olympic year (point scale, 15 editions)
 *   y-axis       : Medal-table rank (1 = most medals; axis inverted)
 *   line         : One country per line; connects ranks across years
 *   circle size  : Medal count for that year (larger = more medals)
 *   line colour  : Fixed per country; selected country highlighted yellow
 *   opacity      : Selected = 1.0; others dimmed to 0.15
 *
 * Annotations
 *   Dashed vertical lines mark the 1980 and 1984 boycott years
 *
 * Interactions
 *   click line / label → selectCountry() (cascade to all charts)
 *   hover circle       → tooltip with year, rank, gold/silver/bronze
 *
 * Depends on: state.js, utils.js, main.js (selectCountry)
 */

"use strict";

// ── Data preparation ─────────────────────────────────────────

/**
 * Derive and cache bump-chart data from state.yearlyData.
 *
 * Algorithm:
 *   1. Sum medals per country across all years → find top-N globally.
 *   2. Assign a fixed colour to each top-N country.
 *   3. For each Olympic year, rank all countries by medal count (desc).
 *   4. Keep only rows for top-N countries, recording their rank.
 *
 * Result is cached in state.bumpData to avoid recomputation on redraw.
 *
 * @returns {{ topCountries: string[], colorMap: Map<string,string>, rankRows: Array }}
 */
function prepareBumpData() {
  if (state.bumpData) return state.bumpData;

  // Step 1 – top-N countries by total medals across all years
  const totalByCountry = d3.rollup(
    state.yearlyData, v => d3.sum(v, d => d.total), d => d.country
  );
  const topCountries = Array.from(totalByCountry.entries())
    .sort((a,b) => b[1] - a[1])
    .slice(0, BUMP_TOP_N)
    .map(d => d[0]);

  // Step 2 – stable colour assignment
  const colorMap = new Map(topCountries.map((c,i) => [c, LINE_PALETTE[i % LINE_PALETTE.length]]));

  // Step 3 & 4 – per-year rankings filtered to top-N countries
  const rankRows = [];
  YEARS.forEach(year => {
    state.yearlyData
      .filter(d => d.year === year && d.total > 0)
      .sort((a,b) => b.total - a.total)
      .forEach((row, idx) => {
        if (topCountries.includes(row.country)) {
          rankRows.push({
            country: row.country,
            iso3   : row.iso3,
            year   : row.year,
            rank   : idx + 1,
            medals : row.total,
            gold   : row.gold,
            silver : row.silver,
            bronze : row.bronze
          });
        }
      });
  });

  state.bumpData = { topCountries, colorMap, rankRows };
  return state.bumpData;
}

// ── Public entry point ───────────────────────────────────────

/**
 * Draw (or fully redraw) the bump chart.
 * Clears the #bump-chart container before rendering.
 */
function drawBumpChart() {
  const container = document.getElementById("bump-chart");
  d3.select("#bump-chart").selectAll("*").remove();

  const { topCountries, colorMap, rankRows } = prepareBumpData();

  const W        = container.clientWidth || 900;
  const H        = 520;
  const mL = 55, mR = 130, mT = 44, mB = 50;
  const cW = W - mL - mR;
  const cH = H - mT - mB;
  const MAX_RANK = 15;

  const svg = d3.select("#bump-chart").append("svg")
    .attr("width","100%").attr("height","100%").style("min-height",`${H}px`)
    .attr("viewBox",`0 0 ${W} ${H}`).attr("preserveAspectRatio","xMidYMid meet");

  const g = svg.append("g").attr("transform",`translate(${mL},${mT})`);

  // Scales
  const xScale = d3.scalePoint().domain(YEARS).range([0,cW]).padding(0.1);
  const yScale = d3.scaleLinear().domain([1, MAX_RANK]).range([0, cH]);

  // Horizontal grid (one line per rank)
  g.append("g").attr("class","grid")
    .selectAll("line").data(d3.range(1, MAX_RANK+1)).join("line")
    .attr("x1",0).attr("x2",cW).attr("y1",d=>yScale(d)).attr("y2",d=>yScale(d));

  // Axes
  g.append("g").attr("class","axis x-axis").attr("transform",`translate(0,${cH})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
  g.append("g").attr("class","axis y-axis")
    .call(d3.axisLeft(yScale).tickValues(d3.range(1,MAX_RANK+1)).tickFormat(d=>`#${d}`));

  g.append("text").attr("class","axis-label")
    .attr("x",cW/2).attr("y",cH+42).attr("text-anchor","middle").text("Olympic Year");
  g.append("text").attr("class","axis-label")
    .attr("transform","rotate(-90)").attr("x",-cH/2).attr("y",-42).attr("text-anchor","middle")
    .text("Medal Table Rank");

  // Historical boycott annotations
  BOYCOTT_ANNOTATIONS.forEach(ann => {
    const xPos = xScale(ann.year);
    if (xPos === undefined) return;
    g.append("line").attr("class","annotation-line")
      .attr("x1",xPos).attr("x2",xPos).attr("y1",0).attr("y2",cH);
    g.append("text").attr("class","annotation-text")
      .attr("x", xPos + (ann.align === "right" ? -6 : 6)).attr("y", 10)
      .attr("text-anchor", ann.align === "right" ? "end" : "start")
      .text(ann.label);
  });

  // Line generator – undefined() skips years where a country is absent
  const lineGen = d3.line()
    .defined(d => d.rank !== null && d.rank <= MAX_RANK)
    .x(d => xScale(d.year))
    .y(d => yScale(d.rank))
    .curve(d3.curveMonotoneX);

  // Build per-country point arrays (one entry per Olympic year)
  const byCountry = new Map(
    topCountries.map(c => [
      c,
      YEARS.map(yr => {
        const hit = rankRows.find(r => r.country === c && r.year === yr);
        return hit || { country: c, year: yr, rank: null, medals: 0, gold: 0, silver: 0, bronze: 0 };
      })
    ])
  );

  // Helper: derive visual style from selection state
  function lineStyle(country) {
    const isSelected = state.selectedCountry === country;
    return {
      stroke     : isSelected ? "var(--yellow)" : colorMap.get(country),
      opacity    : !state.selectedCountry || isSelected ? 1 : 0.15,
      strokeWidth: isSelected ? 3.5 : 2
    };
  }

  // Render one group per country: line + circles + label
  topCountries.forEach(country => {
    const pts   = byCountry.get(country);
    const style = lineStyle(country);
    const grp   = g.append("g").attr("class","bump-country")
                   .style("cursor","pointer")
                   .on("click", () => selectCountry(country));

    // Animated line draw-on using stroke-dashoffset technique
    const pathEl = grp.append("path")
      .datum(pts)
      .attr("class","bump-line")
      .attr("stroke", style.stroke).attr("stroke-width", style.strokeWidth)
      .attr("opacity", style.opacity).attr("fill","none")
      .attr("d", lineGen);

    const len = pathEl.node().getTotalLength() || 1;
    pathEl.attr("stroke-dasharray",`${len} ${len}`)
          .attr("stroke-dashoffset", len)
          .transition().duration(1400).ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);

    // Data-point circles (sized by medal count)
    grp.selectAll(".bump-dot")
      .data(pts.filter(d => d.rank !== null && d.rank <= MAX_RANK))
      .join("circle")
      .attr("class","bump-dot")
      .attr("cx", d => xScale(d.year)).attr("cy", d => yScale(d.rank))
      .attr("r", d => clamp(3 + d.medals / 80, 3, 10))
      .attr("fill", style.stroke).attr("opacity", style.opacity)
      .on("mouseover", (event, d) => showTooltip(
        `<strong>${d.country} – ${d.year}</strong><br>
         Rank: #${d.rank}<br>
         Medals: ${fmtNum(d.medals)}<br>
         🥇 ${d.gold} &nbsp; 🥈 ${d.silver} &nbsp; 🥉 ${d.bronze}`, event))
      .on("mousemove", moveTooltip)
      .on("mouseout", hideTooltip);

    // Country label at the rightmost visible data point
    const lastPt = pts.slice().reverse().find(d => d.rank !== null && d.rank <= MAX_RANK);
    if (lastPt) {
      grp.append("text").attr("class","bump-label")
        .attr("x", xScale(lastPt.year) + 10).attr("y", yScale(lastPt.rank) + 4)
        .attr("fill", style.stroke).attr("opacity", style.opacity)
        .text(country);
    }
  });
}
