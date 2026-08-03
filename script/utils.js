/**
 * scripts/utils.js
 * ─────────────────────────────────────────────────────────────
 * Shared utility functions: tooltip management, number formatting,
 * mathematical helpers, and hero stat updates.
 *
 * Depends on: state.js (state, MARGIN)
 */

"use strict";

// ── Tooltip ──────────────────────────────────────────────────

/**
 * Show the floating tooltip at the cursor position.
 * @param {string}     html  – HTML string for the tooltip body
 * @param {MouseEvent} event – Mouse event used to position the tooltip
 */
function showTooltip(html, event) {
  const tt   = d3.select("#tooltip");
  const node = document.getElementById("tooltip");
  const PAD  = 14;

  tt.classed("hidden", false).html(html);

  const left = clamp(event.clientX + PAD, PAD, window.innerWidth  - (node.offsetWidth  || 220) - PAD);
  const top  = clamp(event.clientY + PAD, PAD, window.innerHeight - (node.offsetHeight || 100) - PAD);

  tt.style("left", `${left}px`).style("top", `${top}px`);
}

/**
 * Reposition an already-visible tooltip to follow the cursor.
 * @param {MouseEvent} event
 */
function moveTooltip(event) {
  showTooltip(document.getElementById("tooltip").innerHTML, event);
}

/** Hide the floating tooltip. */
function hideTooltip() {
  d3.select("#tooltip").classed("hidden", true);
}

// ── Mathematical helpers ─────────────────────────────────────

/**
 * Clamp a value to [lo, hi].
 * @param {number} v  – Value to clamp
 * @param {number} lo – Lower bound
 * @param {number} hi – Upper bound
 * @returns {number}
 */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Number / currency formatting ─────────────────────────────

/** Format as USD currency string, e.g. $12,345. */
function fmtGDP(v)  { return "$" + d3.format(",.0f")(v); }

/** Format as an integer with thousands separators, e.g. 1,234. */
function fmtNum(v)  { return d3.format(",")(Math.round(v)); }

/** Format using SI notation for large numbers, e.g. 10k, 50k. */
function fmtSI(v)   { return v >= 1000 ? d3.format("~s")(v) : String(v); }

// ── Axis helpers ─────────────────────────────────────────────

/**
 * Return suitable tick values for a logarithmic axis domain.
 * Filters a predefined candidate set to those within [lo, hi].
 *
 * @param {number} lo – Axis domain minimum
 * @param {number} hi – Axis domain maximum
 * @returns {number[]}
 */
function logTicks(lo, hi) {
  return [100,200,500,1000,2000,5000,10000,20000,50000,100000]
    .filter(t => t >= lo && t <= hi);
}

// ── Hero stats panel ─────────────────────────────────────────

/** Refresh the four stat cards in the page hero section. */
function updateHeroStats() {
  document.getElementById("stat-countries").textContent = state.summaryData.length;
  document.getElementById("stat-selected").textContent  = state.selectedCountry || "None";

  const total = d3.sum(state.summaryData, d => d.total_medals);
  document.getElementById("stat-medals").textContent = fmtNum(total);
}
