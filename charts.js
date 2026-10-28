// Interactive charts for the BC electricity balance page: canvas drawings with a readout on hover or tap.
// Data come from balance-data.js (BALANCE), written by trading.py in bc_electricity_balance. No libraries.
(function () {
  if (typeof BALANCE === "undefined") return;
  var BLUE = [42, 120, 214], RED = [200, 65, 59];
  var PATTERN = ["#2a78d6", "#a8a7a2", "#c8413b"], FADED = "#eceeed", INK = "#17201d", MUTED = "#5f6964", RULE = "#e1e7e4";
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAY = 864e5;
  var number = new Intl.NumberFormat("en-CA");

  function utc(iso) { var p = iso.split("-"); return Date.UTC(+p[0], p[1] - 1, +p[2]); }
  function dateText(t) { var d = new Date(t); return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function hourText(h) { return h === 0 ? "midnight" : h === 12 ? "noon" : h < 12 ? h + " am" : (h - 12) + " pm"; }
  function flowText(mw) { return mw >= 0 ? number.format(mw) + " MW into BC" : number.format(-mw) + " MW out of BC"; }
  function flowColour(mw) {
    var t = Math.max(-1, Math.min(1, mw / 2500)), end = t < 0 ? BLUE : RED, a = Math.abs(t);
    return "rgb(" + end.map(function (c) { return Math.round(255 + (c - 255) * a); }).join(",") + ")";
  }

  var tip = document.createElement("div");
  tip.className = "viz-tip";
  tip.hidden = true;
  document.body.appendChild(tip);
  function show(e, text) {
    tip.textContent = text;
    tip.hidden = false;
    var left = e.pageX + 14;
    if (e.clientX + 14 + tip.offsetWidth > document.documentElement.clientWidth) left = e.pageX - tip.offsetWidth - 14;
    tip.style.left = Math.max(4, left) + "px";
    tip.style.top = e.pageY + 14 + "px";
  }
  function hide() { tip.hidden = true; }

  // A canvas that fills its container's width, redraws on resize and reports the pointer's position
  function chart(id, height, draw, hover) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;
    var ctx = canvas.getContext("2d");
    function render() {
      var w = canvas.clientWidth, ratio = window.devicePixelRatio || 1;
      canvas.style.height = height + "px";
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, w, height);
      ctx.font = "12px " + getComputedStyle(document.body).fontFamily;
      ctx.textBaseline = "middle";
      draw(ctx, w, height);
    }
    function point(e) {
      var r = canvas.getBoundingClientRect(), text = hover(e.clientX - r.left, e.clientY - r.top, r.width, height);
      if (text) show(e, text); else hide();
    }
    canvas.addEventListener("pointermove", point);
    canvas.addEventListener("pointerdown", point);
    canvas.addEventListener("pointerleave", hide);
    window.addEventListener("resize", render);
    render();
    return render;
  }

  // Every week since 2017 by hour of the day
  (function () {
    var H = BALANCE.heat, weeks = H.weeks.map(utc), n = weeks.length, L = 62, T = 4, B = 22;
    function layout(w, h) { return { cw: (w - L - 4) / n, ch: (h - T - B) / 24 }; }
    chart("viz-heat", 300, function (ctx, w, h) {
      var g = layout(w, h);
      for (var i = 0; i < n; i++) {
        for (var hr = 0; hr < 24; hr++) {
          var v = H.mw[i][hr];
          if (v === null) continue;
          ctx.fillStyle = flowColour(v);
          ctx.fillRect(L + i * g.cw, T + hr * g.ch, g.cw + 0.6, g.ch + 0.6);
        }
      }
      ctx.fillStyle = MUTED;
      ctx.textAlign = "right";
      [0, 6, 12, 18].forEach(function (hr) { ctx.fillText(hourText(hr), L - 6, T + (hr + 0.5) * g.ch); });
      ctx.textAlign = "left";
      var first = new Date(weeks[0]).getUTCFullYear() + 1, last = new Date(weeks[n - 1]).getUTCFullYear();
      var every = 52 * g.cw < 40 ? 2 : 1;  // on narrow screens, every other year
      for (var y = first; y <= last; y++) {
        var x = L + (Date.UTC(y, 0, 1) - weeks[0]) / (7 * DAY) * g.cw;
        ctx.fillStyle = RULE;
        ctx.fillRect(x, h - B, 1, 5);
        if (y % every || x + 32 > w) continue;
        ctx.fillStyle = MUTED;
        ctx.fillText(String(y), x + 3, h - B / 2 + 2);
      }
    }, function (x, y, w, h) {
      var g = layout(w, h), i = Math.floor((x - L) / g.cw), hr = Math.floor((y - T) / g.ch);
      if (i < 0 || i >= n || hr < 0 || hr > 23 || H.mw[i][hr] === null) return null;
      return "Week of " + dateText(weeks[i]) + ", " + hourText(hr) + " to " + hourText((hr + 1) % 24) + "\n" + flowText(H.mw[i][hr]);
    });
  })();

  // Each day's trading pattern, one row per year
  (function () {
    var C = BALANCE.calendar, start = utc(C.start), n = C.pattern.length;
    var y0 = new Date(start).getUTCFullYear(), y1 = new Date(start + (n - 1) * DAY).getUTCFullYear();
    var L = 40, T = 2, B = 20, only = null, render;
    function layout(w, h) { return { cw: (w - L - 4) / 366, rh: (h - T - B) / (y1 - y0 + 1) }; }
    render = chart("viz-calendar", 34 + 26 * (y1 - y0 + 1), function (ctx, w, h) {
      var g = layout(w, h);
      for (var k = 0; k < n; k++) {
        var p = C.pattern.charAt(k);
        if (p === "-") continue;
        var d = new Date(start + k * DAY), y = d.getUTCFullYear(), doy = (start + k * DAY - Date.UTC(y, 0, 1)) / DAY;
        ctx.fillStyle = only === null || only === +p ? PATTERN[+p] : FADED;
        ctx.fillRect(L + doy * g.cw, T + (y - y0) * g.rh + 1, g.cw + 0.6, g.rh - 2);
      }
      ctx.fillStyle = MUTED;
      ctx.textAlign = "right";
      for (var y = y0; y <= y1; y++) ctx.fillText(String(y), L - 6, T + (y - y0 + 0.5) * g.rh);
      ctx.textAlign = "left";
      MONTHS.forEach(function (m, i) {
        if (w < 480 && i % 2) return;  // on narrow screens, every other month
        ctx.fillText(m, L + (Date.UTC(2025, i, 1) - Date.UTC(2025, 0, 1)) / DAY * g.cw, h - B / 2 + 2);
      });
    }, function (x, y, w, h) {
      var g = layout(w, h), year = y0 + Math.floor((y - T) / g.rh), doy = Math.floor((x - L) / g.cw);
      if (year < y0 || year > y1 || doy < 0 || doy > 365) return null;
      var t = Date.UTC(year, 0, 1 + doy), k = Math.round((t - start) / DAY);
      if (new Date(t).getUTCFullYear() !== year || k < 0 || k >= n || C.pattern.charAt(k) === "-") return null;
      return dateText(t) + "\n" + C.names[+C.pattern.charAt(k)] + "\nAverage " + flowText(C.mw[k]);
    });
    var buttons = document.querySelectorAll("[data-pattern]");
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener("click", function () {
        var p = +b.getAttribute("data-pattern");
        only = only === p ? null : p;
        Array.prototype.forEach.call(buttons, function (o) { o.setAttribute("aria-pressed", String(only === +o.getAttribute("data-pattern"))); });
        if (render) render();
      });
    });
  })();

  // The Fraser River at Hope, each year since 1913
  (function () {
    var R = BALANCE.river, n = R.years.length, L = 48, Rt = 10, T = 10, B = 22;
    var sorted = R.flow.slice().sort(function (a, b) { return a - b; }), median = (sorted[(n - 1) >> 1] + sorted[n >> 1]) / 2;
    var lowest = sorted.slice(0, 5), lo = 1700, hi = Math.ceil(sorted[n - 1] / 500) * 500 + 100, active = -1, render;
    function sx(i, w) { return L + i / (n - 1) * (w - L - Rt); }
    function sy(v, h) { return T + (hi - v) / (hi - lo) * (h - T - B); }
    render = chart("viz-river", 280, function (ctx, w, h) {
      ctx.textAlign = "right";
      for (var v = 2000; v < hi; v += 500) {
        ctx.fillStyle = RULE;
        ctx.fillRect(L, sy(v, h), w - L - Rt, 1);
        ctx.fillStyle = MUTED;
        ctx.fillText(number.format(v), L - 6, sy(v, h));
      }
      ctx.textAlign = "center";
      R.years.forEach(function (y, i) { if (y % 20 === 0) ctx.fillText(String(y), sx(i, w), h - B / 2 + 2); });
      ctx.strokeStyle = MUTED;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(L, sy(median, h)); ctx.lineTo(w - Rt, sy(median, h)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#a8a7a2";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      R.flow.forEach(function (v, i) { if (i) ctx.lineTo(sx(i, w), sy(v, h)); else ctx.moveTo(sx(i, w), sy(v, h)); });
      ctx.stroke();
      R.flow.forEach(function (v, i) {
        var low = lowest.indexOf(v) >= 0, recent = R.years[i] >= 2023;
        ctx.fillStyle = low ? (recent ? PATTERN[2] : "#eb6834") : "#a8a7a2";
        ctx.beginPath(); ctx.arc(sx(i, w), sy(v, h), low ? 4.5 : 2, 0, 2 * Math.PI); ctx.fill();
      });
      if (active >= 0) {
        ctx.fillStyle = INK;
        ctx.fillRect(sx(active, w), T, 1, h - T - B);
      }
    }, function (x, y, w) {
      var i = Math.round((x - L) / (w - L - Rt) * (n - 1));
      if (i < 0 || i >= n) { active = -1; render(); return null; }
      if (i !== active) { active = i; render(); }
      var v = R.flow[i], rank = sorted.indexOf(v) + 1, gap = v / median - 1;
      return R.years[i] + ": " + number.format(v) + " m³/s\n" + Math.round(Math.abs(gap) * 100) + "% " + (gap < 0 ? "below" : "above") +
        " the median\n" + (rank <= n / 2 ? "Lowest " + rank + " of " + n : "Highest " + (n + 1 - rank) + " of " + n) + " years";
    });
    var canvas = document.getElementById("viz-river");
    if (canvas) canvas.addEventListener("pointerleave", function () { active = -1; render(); });
  })();
})();
