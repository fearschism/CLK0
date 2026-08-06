/*
 * Chart helpers
 * -------------
 * Dependency-free SVG renderers. Everything is inline SVG with a viewBox so the
 * output scales in the browser and prints to PDF without a canvas rasterisation
 * step or an external chart library.
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function svgOpen(width, height, extraClass) {
    return '<svg class="chart ' + (extraClass || '') + '" viewBox="0 0 ' + width + ' ' + height +
      '" width="100%" preserveAspectRatio="xMidYMid meet" role="img">';
  }

  function fmt(value, dp) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return Number(value).toFixed(dp === undefined ? 2 : dp);
  }

  function colorForScore(score) {
    var level = AIMA.scoring.levelFor(score);
    return level ? level.color : '#94a3b8';
  }

  /* ------------------------------------------------------------------ *
   * Radar / spider chart
   * opts: { axes: [{label, short}], series: [{name, values[], color, dashed}], max }
   * ------------------------------------------------------------------ */
  function radar(opts) {
    var axes = opts.axes || [];
    var series = opts.series || [];
    var max = opts.max || 5;
    var size = 460;
    var cx = size / 2;
    var cy = size / 2 + 6;
    var r = 148;
    var n = axes.length;
    if (!n) return '<p class="chart-empty">No data to plot.</p>';

    function point(index, value) {
      var angle = (-Math.PI / 2) + (index * 2 * Math.PI / n);
      var ratio = Math.max(0, Math.min(1, value / max));
      return [cx + Math.cos(angle) * r * ratio, cy + Math.sin(angle) * r * ratio];
    }

    var out = svgOpen(size, size + 44, 'chart-radar');

    // Concentric grid rings, one per maturity level.
    for (var ring = 1; ring <= max; ring++) {
      var pts = [];
      for (var i = 0; i < n; i++) pts.push(point(i, ring).map(function (v) { return v.toFixed(1); }).join(','));
      out += '<polygon points="' + pts.join(' ') + '" fill="' + (ring % 2 ? '#f8fafc' : '#ffffff') +
        '" stroke="#e2e8f0" stroke-width="1" />';
    }

    // Axis spokes and labels.
    for (var a = 0; a < n; a++) {
      var edge = point(a, max);
      out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + edge[0].toFixed(1) + '" y2="' + edge[1].toFixed(1) +
        '" stroke="#e2e8f0" stroke-width="1" />';
      var labelPos = point(a, max + 0.62);
      var anchor = 'middle';
      if (labelPos[0] > cx + 12) anchor = 'start';
      else if (labelPos[0] < cx - 12) anchor = 'end';
      out += '<text x="' + labelPos[0].toFixed(1) + '" y="' + (labelPos[1] + 4).toFixed(1) +
        '" text-anchor="' + anchor + '" class="radar-axis-label">' + esc(axes[a].short || axes[a].label) + '</text>';
    }

    // Scale ticks along the vertical axis.
    for (var t = 1; t <= max; t++) {
      out += '<text x="' + (cx + 4) + '" y="' + (cy - (r * t / max) + 3).toFixed(1) + '" class="radar-tick">' + t + '</text>';
    }

    series.forEach(function (s) {
      var pts = s.values.map(function (v, i) {
        var p = point(i, v === null || v === undefined ? 0 : v);
        return p[0].toFixed(1) + ',' + p[1].toFixed(1);
      });
      out += '<polygon points="' + pts.join(' ') + '" fill="' + s.color + '" fill-opacity="' +
        (s.dashed ? 0.04 : 0.18) + '" stroke="' + s.color + '" stroke-width="2.2"' +
        (s.dashed ? ' stroke-dasharray="6 4"' : '') + ' stroke-linejoin="round" />';
      if (!s.dashed) {
        s.values.forEach(function (v, i) {
          if (v === null || v === undefined) return;
          var p = point(i, v);
          out += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.6" fill="' + s.color +
            '"><title>' + esc(axes[i].label) + ': ' + fmt(v) + ' / ' + max + '</title></circle>';
        });
      }
    });

    // Legend.
    var legendY = size + 26;
    var legendX = 12;
    series.forEach(function (s) {
      out += '<rect x="' + legendX + '" y="' + (legendY - 9) + '" width="14" height="10" rx="2" fill="' + s.color +
        '" fill-opacity="' + (s.dashed ? 0.15 : 0.6) + '" stroke="' + s.color + '" stroke-width="1.6"' +
        (s.dashed ? ' stroke-dasharray="4 3"' : '') + ' />';
      out += '<text x="' + (legendX + 20) + '" y="' + legendY + '" class="chart-legend-text">' + esc(s.name) + '</text>';
      legendX += 24 + Math.max(70, esc(s.name).length * 6.4);
    });

    return out + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * Horizontal bars
   * opts: { items: [{label, value, color, sublabel}], max, target, unit }
   * ------------------------------------------------------------------ */
  function bars(opts) {
    var items = opts.items || [];
    var max = opts.max || 5;
    var labelWidth = opts.labelWidth || 250;
    var rowHeight = opts.rowHeight || 30;
    var barHeight = 15;
    var width = 780;
    var plotWidth = width - labelWidth - 66;
    var height = items.length * rowHeight + 34;
    if (!items.length) return '<p class="chart-empty">No data to plot.</p>';

    var out = svgOpen(width, height, 'chart-bars');

    // Vertical gridlines at each integer level.
    for (var g = 0; g <= max; g++) {
      var x = labelWidth + (plotWidth * g / max);
      out += '<line x1="' + x.toFixed(1) + '" y1="16" x2="' + x.toFixed(1) + '" y2="' + (height - 18) +
        '" stroke="#e9eef5" stroke-width="1" />';
      out += '<text x="' + x.toFixed(1) + '" y="' + (height - 5) + '" text-anchor="middle" class="chart-tick">' + g + '</text>';
    }

    if (opts.target) {
      var tx = labelWidth + (plotWidth * opts.target / max);
      out += '<line x1="' + tx.toFixed(1) + '" y1="10" x2="' + tx.toFixed(1) + '" y2="' + (height - 18) +
        '" stroke="#0f172a" stroke-width="1.4" stroke-dasharray="5 4" />';
      out += '<text x="' + (tx + 5).toFixed(1) + '" y="10" class="chart-tick-strong">target ' + opts.target + '</text>';
    }

    // Row labels are plain SVG text with no wrapping of their own, so lay them
    // out over up to two lines to fit the space available.
    var labelSpace = labelWidth - 12 - (items.some(function (i) { return i.sublabel; }) ? 40 : 0);
    var maxChars = Math.max(12, Math.floor(labelSpace / 5.6));

    function wrap(label) {
      if (label.length <= maxChars) return [label];
      var words = label.split(' ');
      var first = '';
      while (words.length && (first + ' ' + words[0]).trim().length <= maxChars) {
        first = (first + ' ' + words.shift()).trim();
      }
      if (!first) first = label.slice(0, maxChars);
      var second = words.join(' ');
      if (second.length > maxChars) second = second.slice(0, maxChars - 1) + '…';
      return second ? [first, second] : [first];
    }

    items.forEach(function (item, i) {
      var y = 20 + i * rowHeight;
      var value = item.value === null || item.value === undefined ? 0 : item.value;
      var barWidth = Math.max(value <= 0 ? 0 : 2, plotWidth * value / max);
      var color = item.color || colorForScore(value);
      var label = String(item.label);
      var lines = wrap(label);

      if (lines.length === 1) {
        out += '<text x="0" y="' + (y + barHeight - 3) + '" class="chart-row-label">' + esc(lines[0]) + '</text>';
      } else {
        out += '<text x="0" y="' + (y + 5) + '" class="chart-row-label">' + esc(lines[0]) +
          '<title>' + esc(label) + '</title></text>';
        out += '<text x="0" y="' + (y + 15) + '" class="chart-row-label">' + esc(lines[1]) +
          '<title>' + esc(label) + '</title></text>';
      }
      if (item.sublabel) {
        out += '<text x="' + (labelWidth - 8) + '" y="' + (y + barHeight - 3) + '" text-anchor="end" class="chart-row-sublabel">' +
          esc(item.sublabel) + '</text>';
      }
      out += '<rect x="' + labelWidth + '" y="' + y + '" width="' + plotWidth + '" height="' + barHeight +
        '" rx="3" fill="#f1f5f9" />';
      out += '<rect x="' + labelWidth + '" y="' + y + '" width="' + barWidth.toFixed(1) + '" height="' + barHeight +
        '" rx="3" fill="' + color + '"><title>' + esc(item.label) + ': ' + fmt(item.value) + ' / ' + max +
        '</title></rect>';
      out += '<text x="' + (labelWidth + plotWidth + 8) + '" y="' + (y + barHeight - 3) + '" class="chart-value-label">' +
        (item.value === null || item.value === undefined ? '—' : fmt(item.value)) + '</text>';
    });

    return out + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * Gauge for the headline score
   * ------------------------------------------------------------------ */
  function gauge(opts) {
    var value = opts.value;
    var max = opts.max || 5;
    var size = 220;
    var cx = size / 2;
    var cy = size / 2;
    var r = 82;
    var circumference = 2 * Math.PI * r;
    var ratio = value === null || value === undefined ? 0 : Math.max(0, Math.min(1, value / max));
    var color = opts.color || colorForScore(value);

    var out = svgOpen(size, size, 'chart-gauge');
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#eef2f7" stroke-width="18" />';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color +
      '" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + (circumference * ratio).toFixed(1) + ' ' +
      circumference.toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')" />';
    out += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" class="gauge-value">' +
      (value === null || value === undefined ? '—' : fmt(value, 2)) + '</text>';
    out += '<text x="' + cx + '" y="' + (cy + 20) + '" text-anchor="middle" class="gauge-caption">of ' + max + '</text>';
    if (opts.label) {
      out += '<text x="' + cx + '" y="' + (cy + 44) + '" text-anchor="middle" class="gauge-label" fill="' + color + '">' +
        esc(opts.label) + '</text>';
    }
    return out + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * Stacked distribution bar (maturity level mix)
   * ------------------------------------------------------------------ */
  function stackedBar(opts) {
    var segments = (opts.segments || []).filter(function (s) { return s.count > 0; });
    var total = segments.reduce(function (sum, s) { return sum + s.count; }, 0);
    var width = 760;
    var height = 82;
    if (!total) return '<p class="chart-empty">No assessments loaded yet.</p>';

    var out = svgOpen(width, height, 'chart-stacked');
    var x = 0;
    segments.forEach(function (s) {
      var w = width * s.count / total;
      out += '<rect x="' + x.toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="34" fill="' + s.color +
        '"><title>Level ' + s.level + ' ' + esc(s.name) + ': ' + s.count + ' entities</title></rect>';
      if (w > 34) {
        out += '<text x="' + (x + w / 2).toFixed(1) + '" y="22" text-anchor="middle" class="stack-count">' + s.count + '</text>';
      }
      x += w;
    });

    var legendX = 0;
    segments.forEach(function (s) {
      out += '<rect x="' + legendX + '" y="52" width="11" height="11" rx="2" fill="' + s.color + '" />';
      out += '<text x="' + (legendX + 16) + '" y="61" class="chart-legend-text">L' + s.level + ' ' + esc(s.name) +
        ' (' + s.count + ')</text>';
      legendX += 42 + esc(s.name).length * 7.2;
    });

    return out + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * Entity × domain heatmap
   * opts: { rows: [{label, sublabel, values: [num|null]}], cols: [{label, title}], max }
   * ------------------------------------------------------------------ */
  function heatmap(opts) {
    var rows = opts.rows || [];
    var cols = opts.cols || [];
    var max = opts.max || 5;
    if (!rows.length || !cols.length) return '<p class="chart-empty">No data to plot.</p>';

    var labelWidth = 226;
    var cellW = 54;
    var cellH = 26;
    var gap = 2;
    var headerH = 30;
    var width = labelWidth + cols.length * (cellW + gap) + 60;
    var height = headerH + rows.length * (cellH + gap) + 8;

    var out = svgOpen(width, height, 'chart-heatmap');

    cols.forEach(function (c, i) {
      var x = labelWidth + i * (cellW + gap) + cellW / 2;
      out += '<text x="' + x + '" y="' + (headerH - 12) + '" text-anchor="middle" class="heat-col-label">' +
        esc(c.label) + '<title>' + esc(c.title || c.label) + '</title></text>';
    });
    out += '<text x="' + (labelWidth + cols.length * (cellW + gap) + 26) + '" y="' + (headerH - 12) +
      '" text-anchor="middle" class="heat-col-label">ALL</text>';

    rows.forEach(function (row, r) {
      var y = headerH + r * (cellH + gap);
      out += '<text x="0" y="' + (y + cellH / 2 + 4) + '" class="heat-row-label">' + esc(row.label) + '</text>';
      row.values.forEach(function (v, c) {
        var x = labelWidth + c * (cellW + gap);
        var fill = v === null || v === undefined ? '#f1f5f9' : colorForScore(v);
        out += '<rect x="' + x + '" y="' + y + '" width="' + cellW + '" height="' + cellH + '" rx="3" fill="' + fill +
          '" fill-opacity="' + (v === null || v === undefined ? 1 : 0.92) + '"><title>' + esc(row.label) + ' — ' +
          esc(cols[c].title || cols[c].label) + ': ' + fmt(v) + '</title></rect>';
        out += '<text x="' + (x + cellW / 2) + '" y="' + (y + cellH / 2 + 4) + '" text-anchor="middle" class="heat-cell-text" fill="' +
          (v === null || v === undefined ? '#94a3b8' : '#ffffff') + '">' + fmt(v, 1) + '</text>';
      });
      var totalX = labelWidth + cols.length * (cellW + gap);
      out += '<rect x="' + totalX + '" y="' + y + '" width="52" height="' + cellH + '" rx="3" fill="#0f172a" />';
      out += '<text x="' + (totalX + 26) + '" y="' + (y + cellH / 2 + 4) + '" text-anchor="middle" class="heat-cell-text" fill="#ffffff">' +
        fmt(row.total, 2) + '</text>';
    });

    return out + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * Vertical columns (used for grouped averages)
   * ------------------------------------------------------------------ */
  function columns(opts) {
    var items = opts.items || [];
    var max = opts.max || 5;
    var width = 760;
    var height = 210;
    var padLeft = 34;
    var padBottom = 46;
    if (!items.length) return '<p class="chart-empty">No data to plot.</p>';

    var plotH = height - padBottom - 14;
    var slot = (width - padLeft - 10) / items.length;
    var barW = Math.min(58, slot * 0.6);

    var out = svgOpen(width, height, 'chart-columns');
    for (var g = 0; g <= max; g++) {
      var y = 14 + plotH - (plotH * g / max);
      out += '<line x1="' + padLeft + '" y1="' + y.toFixed(1) + '" x2="' + (width - 6) + '" y2="' + y.toFixed(1) +
        '" stroke="#eef2f7" stroke-width="1" />';
      out += '<text x="' + (padLeft - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" class="chart-tick">' + g + '</text>';
    }

    items.forEach(function (item, i) {
      var value = item.value === null || item.value === undefined ? 0 : item.value;
      var h = plotH * value / max;
      var x = padLeft + slot * i + (slot - barW) / 2;
      var y = 14 + plotH - h;
      out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' +
        Math.max(1, h).toFixed(1) + '" rx="3" fill="' + (item.color || colorForScore(value)) + '"><title>' +
        esc(item.label) + ': ' + fmt(item.value) + '</title></rect>';
      out += '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle" class="chart-value-label">' +
        fmt(item.value) + '</text>';
      var words = String(item.label).split(' ');
      var line1 = words.slice(0, 2).join(' ');
      var line2 = words.slice(2).join(' ');
      out += '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (height - 26) + '" text-anchor="middle" class="chart-tick">' +
        esc(line1) + '</text>';
      if (line2) {
        out += '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (height - 14) + '" text-anchor="middle" class="chart-tick">' +
          esc(line2) + '</text>';
      }
      if (item.sublabel) {
        out += '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (height - 2) + '" text-anchor="middle" class="chart-tick-muted">' +
          esc(item.sublabel) + '</text>';
      }
    });

    return out + '</svg>';
  }

  AIMA.charts = {
    radar: radar,
    bars: bars,
    gauge: gauge,
    stackedBar: stackedBar,
    heatmap: heatmap,
    columns: columns,
    colorForScore: colorForScore,
    escape: esc,
    fmt: fmt
  };
})(window.AIMA);
