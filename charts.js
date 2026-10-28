// Interactive charts for the BC electricity balance and household gas demand pages: canvas drawings with a readout on
// hover or tap. Data come from balance-data.js (BALANCE), written by trading.py in bc_electricity_balance, and
// gas-data.js (GAS), written by forecast.py in canada_gas_demand. No libraries.
(function () {
  var hasBalance = typeof BALANCE !== "undefined", hasGas = typeof GAS !== "undefined";
  if (!hasBalance && !hasGas) return;
  var BLUE = [42, 120, 214], RED = [200, 65, 59];
  var PATTERN = ["#2a78d6", "#a8a7a2", "#c8413b"], FADED = "#eceeed", INK = "#17201d", MUTED = "#5f6964", RULE = "#e1e7e4";
  var GREY = "#a8a7a2", RAMP = ["#8fb8e8", "#5b97dc", "#2a78d6", "#1d5aa6", "#123b70"];  // RAMP: one blue per period, light to dark
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAY = 864e5;
  var number = new Intl.NumberFormat("en-CA");

  function utc(iso) { var p = iso.split("-"); return Date.UTC(+p[0], p[1] - 1, +p[2]); }
  function dateText(t) { var d = new Date(t); return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function hourText(h) { return h === 0 ? "midnight" : h === 12 ? "noon" : h < 12 ? h + " am" : (h - 12) + " pm"; }
  function minus(s) { return String(s).replace("-", "−"); }
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

  // Buttons that pick one value (aria-pressed), calling back with it
  function picker(attr, initial, changed, toggle) {
    var buttons = document.querySelectorAll("[" + attr + "]"), current = initial;
    function mark() {
      Array.prototype.forEach.call(buttons, function (o) { o.setAttribute("aria-pressed", String(current === o.getAttribute(attr))); });
    }
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute(attr);
        current = toggle && current === v ? null : v;
        mark();
        changed(current);
      });
    });
    mark();
  }

  // Every week since 2017 by hour of the day
  if (hasBalance) (function () {
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
  if (hasBalance) (function () {
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
  if (hasBalance) (function () {
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

  // Heating curves: each month's use against its temperature, one curve per period
  if (hasGas) (function () {
    var D = GAS.heating, province = "British Columbia", only = null, render;
    var L = 44, R = 12, T = 10, B = 26, X0, X1 = 24, Y1;
    function scale() {  // each province on its own scale; the readout carries the comparison
      X0 = 0; Y1 = 0;
      D[province].points.forEach(function (q) { X0 = Math.min(X0, q[2]); Y1 = Math.max(Y1, q[3]); });
      X0 = Math.floor(X0 / 5) * 5 - 6;  // room for the curve labels
      Y1 = Math.ceil(Y1 / 5) * 5;
    }
    scale();
    function sx(t, w) { return L + (t - X0) / (X1 - X0) * (w - L - R); }
    function sy(v, h) { return T + (Y1 - v) / Y1 * (h - T - B); }
    function lit(k) { return only === null || only === String(k); }
    render = chart("viz-heating", 340, function (ctx, w, h) {
      ctx.textAlign = "right";
      for (var v = 0; v <= Y1; v += 5) {
        ctx.fillStyle = RULE; ctx.fillRect(L, sy(v, h), w - L - R, 1);
        ctx.fillStyle = MUTED; ctx.fillText(String(v), L - 6, sy(v, h));
      }
      ctx.textAlign = "center";
      for (var t = Math.ceil(X0 / 10) * 10; t <= 20; t += 10) ctx.fillText(minus(t) + " °C", sx(t, w), h - B / 2 + 2);
      var P = D[province];
      P.points.forEach(function (q) {
        if (lit(q[4])) return;
        ctx.fillStyle = FADED;
        ctx.beginPath(); ctx.arc(sx(q[2], w), sy(q[3], h), 2.5, 0, 2 * Math.PI); ctx.fill();
      });
      P.points.forEach(function (q) {
        if (!lit(q[4])) return;
        ctx.fillStyle = RAMP[q[4]];
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(sx(q[2], w), sy(q[3], h), 2.5, 0, 2 * Math.PI); ctx.fill();
      });
      ctx.globalAlpha = 1;
      P.curves.forEach(function (c, i) {
        if (!lit(c.period)) return;
        var labelled = only !== null || i === 0 || i === P.curves.length - 1;  // selective labels: first and latest
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 4.5;  // a surface ring so overlapping curves stay apart
        ctx.beginPath();
        c.x.forEach(function (t, i) { if (i) ctx.lineTo(sx(t, w), sy(c.y[i], h)); else ctx.moveTo(sx(t, w), sy(c.y[i], h)); });
        ctx.stroke();
        ctx.strokeStyle = RAMP[c.period]; ctx.lineWidth = 2.2;
        ctx.stroke();
        if (!labelled) return;
        ctx.fillStyle = MUTED; ctx.textAlign = "right";
        ctx.fillText(c.label, sx(c.x[0], w) - 6, sy(c.y[0], h));
      });
    }, function (x, y, w, h) {
      var best = null, dist = 100;
      D[province].points.forEach(function (q) {
        if (!lit(q[4])) return;
        var d = Math.pow(sx(q[2], w) - x, 2) + Math.pow(sy(q[3], h) - y, 2);
        if (d < dist) { dist = d; best = q; }
      });
      if (!best) return null;
      return LONG[best[1] - 1] + " " + best[0] + "\n" + minus(best[2].toFixed(1)) + " °C on average\n" +
        best[3].toFixed(1) + " m³ per customer a day";
    });
    var readout = document.getElementById("viz-heating-readout");
    function describe() {
      if (!readout) return;
      var c = D[province].curves, a = c[0], b = c[c.length - 1];
      function when(label) { return label.indexOf("since") === 0 ? label : "in " + label; }
      readout.textContent = province + ", in normal weather: " + number.format(a.normal) + " m³ per customer a year " + when(a.label) +
        ", " + number.format(b.normal) + " " + when(b.label) + " (" + Math.round((1 - b.normal / a.normal) * 100) + "% less). Year-round use: " +
        number.format(a.base_year) + " to " + number.format(b.base_year) + " m³. Heating starts below " + minus(b.tau) + " °C.";
    }
    picker("data-province", province, function (p) { if (p) { province = p; scale(); describe(); render(); } }, false);
    picker("data-period", null, function (k) { only = k; if (render) render(); }, true);
    describe();
  })();

  // Forecasts as they were made: pick the month the forecast was made, see what came
  if (hasGas) (function () {
    var F = GAS.forecast, province = "British Columbia", k = F[province].origins.length - 1, render;
    var L = 48, R = 12, T = 10, B = 26, BACK = 24;
    var slider = document.getElementById("viz-forecast-origin"), readout = document.getElementById("viz-forecast-readout");
    function index(iso, start) { var p = iso.split("-"), s = start.split("-"); return (p[0] - s[0]) * 12 + (p[1] - s[1]); }
    function monthText(i, start) { var s = start.split("-"), m = +s[1] - 1 + i; return LONG[m % 12] + " " + (+s[0] + Math.floor(m / 12)); }
    function view() {
      var P = F[province], o = index(P.origins[k], P.start), lo = o - BACK, hi = o + 12, top = 0;
      for (var i = lo; i <= hi; i++) {
        if (P.actual[i] != null) top = Math.max(top, P.actual[i]);
        var j = i - o - 1;
        if (j >= 0 && P.high[k][j] != null) top = Math.max(top, P.high[k][j]);
      }
      return { P: P, o: o, lo: lo, hi: hi, top: Math.ceil(top / 100) * 100 };
    }
    function sx(i, v, w) { return L + (i - v.lo) / (v.hi - v.lo) * (w - L - R); }
    function sy(y, v, h) { return T + (v.top - y) / v.top * (h - T - B); }
    function line(ctx, v, w, h, value, colour, dash) {
      ctx.strokeStyle = colour; ctx.lineWidth = 2; ctx.setLineDash(dash || []);
      ctx.beginPath();
      var on = false;
      for (var i = v.lo; i <= v.hi; i++) {
        var y = value(i);
        if (y == null) { on = false; continue; }
        if (on) ctx.lineTo(sx(i, v, w), sy(y, v, h)); else ctx.moveTo(sx(i, v, w), sy(y, v, h));
        on = true;
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    render = chart("viz-forecast", 300, function (ctx, w, h) {
      var v = view(), P = v.P, step = v.top > 600 ? 200 : 100;
      ctx.textAlign = "right";
      for (var y = 0; y <= v.top; y += step) {
        ctx.fillStyle = RULE; ctx.fillRect(L, sy(y, v, h), w - L - R, 1);
        ctx.fillStyle = MUTED; ctx.fillText(number.format(y), L - 6, sy(y, v, h));
      }
      ctx.textAlign = "center";
      for (var i = v.lo; i <= v.hi; i++) {
        var m = (index(P.start, P.start) + i) % 12;
        if (m === 0) ctx.fillText(monthText(i, P.start).split(" ")[1], sx(i, v, w), h - B / 2 + 2);
      }
      ctx.fillStyle = "rgba(42,120,214,0.16)";  // the 80% range, from errors known when the forecast was made
      ctx.beginPath();
      var first = true;
      for (var j = 0; j < 12; j++) if (P.high[k][j] != null) { var X = sx(v.o + 1 + j, v, w), Y = sy(P.high[k][j], v, h); if (first) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); first = false; }
      for (j = 11; j >= 0; j--) if (P.low[k][j] != null) ctx.lineTo(sx(v.o + 1 + j, v, w), sy(P.low[k][j], v, h));
      ctx.fill();
      ctx.fillStyle = MUTED; ctx.fillRect(sx(v.o + 0.5, v, w), T, 1, h - T - B);
      line(ctx, v, w, h, function (i) { return i - v.o - 1 >= 0 && i - v.o - 1 < 12 ? P.oracle[k][i - v.o - 1] : null; }, GREY);
      line(ctx, v, w, h, function (i) { return P.actual[i]; }, INK);
      line(ctx, v, w, h, function (i) { return i === v.o ? P.actual[i] : i - v.o - 1 >= 0 && i - v.o - 1 < 12 ? P.mean[k][i - v.o - 1] : null; }, PATTERN[0], [6, 4]);
    }, function (x, y, w, h) {
      var v = view(), P = v.P, i = Math.round(v.lo + (x - L) / (w - L - R) * (v.hi - v.lo)), j = i - v.o - 1;
      if (i < v.lo || i > v.hi) return null;
      var text = monthText(i, P.start) + "\nActual: " + (P.actual[i] == null ? "not yet known" : number.format(P.actual[i]) + " million m³");
      if (j >= 0 && j < 12 && P.mean[k][j] != null) {
        text += "\nForecast: " + number.format(P.mean[k][j]);
        if (P.low[k][j] != null) text += " (80%: " + number.format(P.low[k][j]) + " to " + number.format(P.high[k][j]) + ")";
        if (P.oracle[k][j] != null) text += "\nTold the weather: " + number.format(P.oracle[k][j]);
      }
      return text;
    });
    function describe() {
      var P = F[province], o = index(P.origins[k], P.start), f = 0, a = 0, g = 0, n = 0, live = k === P.origins.length - 1;
      for (var j = 0; j < 12; j++) {
        if (P.mean[k][j] == null || P.actual[o + 1 + j] == null) continue;
        f += P.mean[k][j]; a += P.actual[o + 1 + j]; g += P.oracle[k][j] || 0; n++;
      }
      var made = "Forecast made with data to " + monthText(o, P.start);
      if (live) {
        var total = P.mean[k].reduce(function (s, x) { return s + x; }, 0);
        readout.textContent = made + " (latest): " + number.format(Math.round(total)) + " million m³ over the next 12 months in normal weather.";
      } else if (n === 12) {
        readout.textContent = made + ": " + number.format(Math.round(f)) + " million m³ over the next 12 months, against " + number.format(Math.round(a)) +
          " (off by " + minus((f / a * 100 - 100).toFixed(1)) + "%). Told the weather that came: off by " + minus((g / a * 100 - 100).toFixed(1)) + "%.";
      } else {
        readout.textContent = made + ": " + n + " of the 12 months have happened so far.";
      }
    }
    function setRange() {
      if (!slider) return;
      slider.max = String(F[province].origins.length - 1);
      slider.value = String(k);
      slider.setAttribute("aria-valuetext", "Data to " + monthText(index(F[province].origins[k], F[province].start), F[province].start));
    }
    if (slider) slider.addEventListener("input", function () { k = +slider.value; setRange(); describe(); render(); });
    picker("data-forecast", province, function (p) {
      if (!p) return;
      province = p; k = F[p].origins.length - 1; setRange(); describe(); render();
    }, false);
    setRange();
    describe();
  })();
})();
