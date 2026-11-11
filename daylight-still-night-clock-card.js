function _solarParams(date) {
  const R = Math.PI / 180;
  const JD = date.getTime() / 86400000 + 2440587.5;
  const T  = (JD - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M  = 357.52911 + T * (35999.05029 - T * 0.0001537);
  const mr = M * R;
  const C  = Math.sin(mr)   * (1.914602 - T * (0.004817 + 0.000014 * T))
           + Math.sin(2*mr) * (0.019993 - 0.000101 * T)
           + Math.sin(3*mr) * 0.000289;
  const lam  = L0 + C;
  const om   = (125.04 - 1934.136 * T) * R;
  const lamA = (lam - 0.00569 - 0.00478 * Math.sin(om)) * R;
  const eps  = (23.439291111 - T * (0.013004167 + T * 1.638e-7) + 0.00256 * Math.cos(om)) * R;
  const sinDec = Math.sin(eps) * Math.sin(lamA);
  const cosDec = Math.sqrt(1 - sinDec * sinDec);
  const y  = Math.tan(eps / 2) ** 2;
  const e  = 0.016708634 - T * (0.000042037 + 1.267e-7 * T);
  const L0r = L0 * R;
  const EoT = (4 / R) * (
    y * Math.sin(2 * L0r)
    - 2 * e * Math.sin(mr)
    + 4 * e * y * Math.sin(mr) * Math.cos(2 * L0r)
    - 0.5 * y * y * Math.sin(4 * L0r)
    - 1.25 * e * e * Math.sin(2 * mr)
  );
  return { sinDec, cosDec, EoT };
}

function solarNoonAltDeg(date, lat) {
  const R = Math.PI / 180;
  const { sinDec, cosDec } = _solarParams(date);
  const latR   = lat * R;
  const sinAlt = Math.sin(latR) * sinDec + Math.cos(latR) * cosDec;
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) / R;
}

function solarAltitudeDeg(date, lat, lon) {
  const R = Math.PI / 180;
  const { sinDec, cosDec, EoT } = _solarParams(date);
  const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const HA     = ((utcMin + 4 * lon + EoT) / 4 - 180) * R;
  const latR   = lat * R;
  const sinAlt = Math.sin(latR) * sinDec + Math.cos(latR) * cosDec * Math.cos(HA);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) / R;
}


// Text sizes and gaps, all as multiples of the dashboard's normal text size
// (em). Gaps of 0 keep the original spacing; negative values pull lines closer.
const LAYOUT_OPTIONS = {
  label_size:    { def: 1.0,  min: 0.3 },
  time_size:     { def: 1.05, min: 0.3 },
  date_size:     { def: 0.7,  min: 0.3 },
  label_time_gap: { def: 0, min: -1, max: 3 },
  time_date_gap:  { def: 0, min: -1, max: 3 },
  label_opacity: { def: 0.6,  min: 0, max: 1 },
  time_opacity:  { def: 1,    min: 0, max: 1 },
  date_opacity:  { def: 0.55, min: 0, max: 1 },
};
// Per-field text shadow switches (off by default).
const SHADOW_KEYS = ["label_shadow", "time_shadow", "date_shadow"];
const TEXT_SHADOW = "0 1px 2px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.6)";
function _layoutValue(config, key) {
  const o = LAYOUT_OPTIONS[key];
  const v = config[key] === "" || config[key] == null ? NaN : Number(config[key]);
  if (!Number.isFinite(v) || v < o.min || (o.max != null && v > o.max)) return o.def;
  return v;
}

class DaylightStillNightClockCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!Array.isArray(config.clocks) || config.clocks.length === 0)
      throw new Error("daylight-still-night-clock-card: 'clocks' must be a non-empty list");
    this._config = config;
    this._formatters = config.clocks.map(({ tz }) => ({
      time: new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }),
      date: new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }),
    }));
    if (this._built) this._rebuild();
  }

  getGridOptions() {
    // No fixed rows: the card takes the height of its content, so the date
    // row is never clipped whatever the text sizes and gaps are.
    return { columns: 12, min_columns: 4 };
  }

  connectedCallback() {
    this._build();
    this._tick();
    this._interval = setInterval(() => this._tick(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this._interval);
  }

  // alt: current solar altitude (degrees)
  // peakAlt: solar noon altitude for this location today (degrees)
  _sunGradient(alt, peakAlt) {
    if (alt < -6)
      return "linear-gradient(to bottom, #000000, #3d2e4a 40%, #2a1f35 70%, #1a3d5c)";
    if (alt < 0)
      return "linear-gradient(to bottom, #000000, #2a1f35 40%, #1a3d5c 70%, #000000)";

    // warmPct: 0% at horizon → 90% at solar noon for this location
    // skyEnd clamped to 60% so label + time rows always stay in the dark/sky zone
    const warmPct  = peakAlt > 0 ? Math.min(90, (alt / peakAlt) * 90) : 0;
    const skyEnd   = Math.max(60, +(100 - warmPct).toFixed(1));
    const ambStart = +(skyEnd + (100 - skyEnd) * 0.5).toFixed(1);

    // Dim overlay starting at 55% ensures date row (60–80%) is always readable
    const dim  = `linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.55) 100%)`;
    // Subtle arch overlay at bottom (date zone only)
    const arch = `radial-gradient(ellipse 150% 35% at 50% 110%, #f5c842, #d4892a, transparent)`;
    // Flat linear sky base
    const base = `linear-gradient(to bottom, #000000 0%, #1a4060 ${+(skyEnd * 0.5).toFixed(1)}%, #3a7ca8 ${skyEnd}%, #d4892a ${ambStart}%, #f5c842 100%)`;

    return `${dim}, ${arch}, ${base}`;
  }

  _build() {
    const n   = this._config.clocks.length;
    const now = new Date();
    const size = (key) => _layoutValue(this._config, key);
    // Margins are in the element's own em, so divide by its font size to get
    // multiples of the card's normal text size.
    const gapTime = +(size("label_time_gap") / size("time_size")).toFixed(4);
    const gapDate = +(size("time_date_gap") / size("date_size")).toFixed(4);
    const shadow = (key) => this._config[key] === true ? `text-shadow: ${TEXT_SHADOW};` : "";

    const style = document.createElement("style");
    style.textContent = `
      :host { display: block; height: 100%; box-sizing: border-box; }
      .grid {
        display: grid;
        grid-template-columns: repeat(${n}, 1fr);
        grid-template-rows: 5px auto auto auto;
        align-items: center;
        height: 100%;
        padding: 6px 12px;
        box-sizing: border-box;
      }
      .col-bg {
        grid-row: 1 / -1;
        align-self: stretch;
        border-radius: 6px;
        pointer-events: none;
      }
      .label, .time, .date { color: #ffffff; }
      .label {
        grid-row: 2;
        text-align: center;
        font-size: ${size("label_size")}em;
        opacity: ${size("label_opacity")};
        ${shadow("label_shadow")}
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        z-index: 1;
      }
      .time {
        grid-row: 3;
        text-align: center;
        font-size: ${size("time_size")}em;
        font-weight: 600;
        margin-top: ${gapTime}em;
        opacity: ${size("time_opacity")};
        ${shadow("time_shadow")}
        white-space: nowrap;
        position: relative;
        z-index: 1;
      }
      .date {
        grid-row: 4;
        text-align: center;
        font-size: ${size("date_size")}em;
        opacity: ${size("date_opacity")};
        ${shadow("date_shadow")}
        border-top: 1px solid currentColor;
        padding-top: 2px;
        margin-top: calc(2px + ${gapDate}em);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 4px;
        padding-right: 4px;
        position: relative;
        z-index: 1;
      }
    `;

    const grid = document.createElement("div");
    grid.className = "grid";

    this._bgEls = this._config.clocks.map((clock, i) => {
      const bg = document.createElement("div");
      bg.className = "col-bg";
      bg.style.gridColumn = String(i + 1);
      if (clock.lat != null && clock.lon != null) {
        const alt     = solarAltitudeDeg(now, clock.lat, clock.lon);
        const peakAlt = solarNoonAltDeg(now, clock.lat);
        bg.style.background = this._sunGradient(alt, peakAlt);
      } else {
        bg.style.background = this._sunGradient(-90, 0);
      }
      grid.appendChild(bg);
      return bg;
    });

    this._timeEls = this._config.clocks.map(({ label }, i) => {
      const labelEl = document.createElement("div");
      labelEl.className = "label";
      labelEl.style.gridColumn = String(i + 1);
      labelEl.textContent = label;

      const timeEl = document.createElement("div");
      timeEl.className = "time";
      timeEl.style.gridColumn = String(i + 1);

      grid.appendChild(labelEl);
      grid.appendChild(timeEl);
      return timeEl;
    });

    this._grid    = grid;
    this._dateEls = [];
    this._lastGroupKey = null; // new grid has no date bars yet; force _tick to draw them

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(grid);
    this._built = true;
  }

  _rebuild() {
    this._built = false;
    this._build();
    this._tick();
  }

  _tick() {
    const now = new Date();

    // Update sun gradients
    this._config.clocks.forEach(({ lat, lon }, i) => {
      if (lat != null && lon != null) {
        const alt     = solarAltitudeDeg(now, lat, lon);
        const peakAlt = solarNoonAltDeg(now, lat);
        this._bgEls[i].style.background = this._sunGradient(alt, peakAlt);
      }
    });

    // Compute time + date strings per clock
    const clocks = this._config.clocks.map((_, i) => ({
      time: this._formatters[i].time.format(now),
      date: this._formatters[i].date.format(now),
    }));

    clocks.forEach(({ time }, i) => {
      this._timeEls[i].textContent = time;
    });

    // Group consecutive clocks by date string
    const groups = [];
    clocks.forEach(({ date }, i) => {
      const last = groups.at(-1);
      if (last && last.date === date) {
        last.end = i + 1;
      } else {
        groups.push({ date, start: i + 1, end: i + 1 });
      }
    });

    const groupKey = groups.map(g => `${g.start}:${g.end}:${g.date}`).join("|");
    if (groupKey === this._lastGroupKey) return;
    this._lastGroupKey = groupKey;

    this._dateEls.forEach(el => el.remove());

    this._dateEls = groups.map(({ date, start, end }) => {
      const el = document.createElement("div");
      el.className = "date";
      el.style.gridColumn = `${start} / ${end + 1}`;
      el.style.gridRow    = "4";
      el.textContent      = date;
      this._grid.appendChild(el);
      return el;
    });
  }

  static getConfigElement() {
    return document.createElement("daylight-still-night-clock-card-editor");
  }

  static getStubConfig() {
    return {
      clocks: [
        { tz: "Australia/Sydney", label: "Sydney", lat: -33.87, lon: 151.21 },
        { tz: "Europe/London", label: "London", lat: 51.51, lon: -0.13 },
        { tz: "America/New_York", label: "New York", lat: 40.71, lon: -74.01 },
      ],
    };
  }
}

customElements.define("daylight-still-night-clock-card", DaylightStillNightClockCard);

// ---------------------------------------------------------------------------
// Visual editor: one row per clock (label, timezone, lat, lon), add / remove /
// reorder. Emits HA's standard "config-changed" event.
// ---------------------------------------------------------------------------
const _TIMEZONES = (() => {
  try { return Intl.supportedValuesOf("timeZone"); } catch (e) { return []; }
})();

class DaylightStillNightClockCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    // Our own edits come back through setConfig, asynchronously, so an echo of
    // an older keystroke can arrive after newer edits. Ignore echoes of any
    // recent emission: re-rendering from one would steal focus and roll back
    // the newer edits (this lost a just-typed latitude).
    if (this._emitted && this._emitted.has(JSON.stringify(config))) return;
    this._config = { ...config, clocks: (config.clocks || []).map(c => ({ ...c })) };
    this._render();
  }

  _emit() {
    const config = { ...this._config, clocks: this._config.clocks.map(c => ({ ...c })) };
    const key = JSON.stringify(config);
    this._emitted = this._emitted || new Set();
    this._emitted.delete(key);
    this._emitted.add(key);
    if (this._emitted.size > 100) this._emitted.delete(this._emitted.values().next().value);
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  _setField(i, key, raw) {
    const clock = this._config.clocks[i];
    if (key === "lat" || key === "lon") {
      const v = raw.trim() === "" ? NaN : Number(raw);
      if (Number.isFinite(v)) clock[key] = v; else delete clock[key];
    } else if (key === "tz") {
      // Only commit real timezones; a half-typed one would make the preview error.
      try { new Intl.DateTimeFormat("en-US", { timeZone: raw.trim() }); } catch (e) { return false; }
      if (!raw.trim()) return false;
      clock.tz = raw.trim();
    } else {
      clock[key] = raw;
    }
    this._emit();
    return true;
  }

  _setSize(key, raw) {
    const o = LAYOUT_OPTIONS[key];
    const v = raw.trim() === "" ? NaN : Number(raw);
    if (Number.isFinite(v) && v >= o.min && (o.max == null || v <= o.max)) this._config[key] = v;
    else delete this._config[key];
    this._emit();
  }

  _structural(fn) {
    fn(this._config.clocks);
    this._emit();
    this._render();
  }

  _render() {
    const clocks = this._config.clocks;
    const root = this.shadowRoot;
    root.innerHTML = `
      <style>
        :host { display: block; }
        .clock {
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 8px;
          padding: 8px 10px;
          margin-bottom: 8px;
        }
        .head { display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
        .head .n { flex: 1; font-weight: 500; }
        .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; }
        .fields.three { grid-template-columns: 1fr 1fr 1fr; }
        .fields.gaps { margin-top: 6px; }
        .col { display: flex; flex-direction: column; gap: 6px; }
        .col-h { font-weight: 500; font-size: 0.9em; }
        label.check { flex-direction: row; align-items: center; gap: 6px; font-size: 0.9em; }
        label.check input { width: auto; margin: 0; }
        label { display: flex; flex-direction: column; font-size: 0.8em; color: var(--secondary-text-color); }
        input {
          font: inherit; font-size: 1.2em; padding: 6px 8px; margin-top: 2px;
          border: 1px solid var(--divider-color, #ccc); border-radius: 4px;
          background: var(--card-background-color, #fff); color: var(--primary-text-color);
          box-sizing: border-box; width: 100%;
        }
        button {
          font: inherit; cursor: pointer; border-radius: 4px; padding: 4px 8px;
          border: 1px solid var(--divider-color, #ccc);
          background: transparent; color: var(--primary-text-color);
        }
        input.bad { border-color: var(--error-color, #db4437); }
        button:disabled { opacity: 0.35; cursor: default; }
        .row-actions { margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; }
        .hint { font-size: 0.8em; color: var(--secondary-text-color); margin: 4px 0 10px; }
        .add { width: 100%; padding: 8px; }
      </style>
      <div class="hint">Clocks show left → right in this order. Keep them in east → west (or west → east) order so the date bars group correctly. Leave latitude/longitude empty for a plain dark background.</div>
      <div class="clock sizes">
        <div class="head"><span class="n">Text style &amp; spacing</span></div>
        <div class="hint">Sizes and gaps are multiples of the dashboard's normal text size. Gaps: 0 = original spacing, negative = closer together. Opacity: 0 = invisible, 1 = solid. Clear a field to go back to its default.</div>
        <div class="fields three">
          ${["label", "time", "date"].map(f => `
            <div class="col">
              <div class="col-h">${f[0].toUpperCase() + f.slice(1)}</div>
              <label>Size<input data-size="${f}_size" type="number" step="0.05" min="0.3"></label>
              <label>Opacity<input data-size="${f}_opacity" type="number" step="0.05" min="0" max="1"></label>
              <label class="check"><input data-shadow="${f}_shadow" type="checkbox">Shadow</label>
            </div>`).join("")}
        </div>
        <div class="fields gaps">
          <label>Gap: label → time<input data-size="label_time_gap" type="number" step="0.05" min="-1" max="3"></label>
          <label>Gap: time → date<input data-size="time_date_gap" type="number" step="0.05" min="-1" max="3"></label>
        </div>
      </div>
      <datalist id="tz">${_TIMEZONES.map(t => `<option value="${t}"></option>`).join("")}</datalist>
      <div class="list"></div>
      <button class="add" type="button">+ Add clock</button>
    `;

    root.querySelectorAll("input[data-size]").forEach(inp => {
      const key = inp.dataset.size;
      // Show the effective value, not an empty field: the spinner arrows on an
      // empty number input start from `min` (0.3), not from the default.
      // Displaying it doesn't write it to the config; only an edit does.
      inp.value = this._config[key] ?? LAYOUT_OPTIONS[key].def;
      inp.addEventListener("input", () => this._setSize(key, inp.value));
    });

    root.querySelectorAll("input[data-shadow]").forEach(inp => {
      const key = inp.dataset.shadow;
      inp.checked = this._config[key] === true;
      inp.addEventListener("change", () => {
        if (inp.checked) this._config[key] = true; else delete this._config[key];
        this._emit();
      });
    });

    const list = root.querySelector(".list");
    clocks.forEach((clock, i) => {
      const el = document.createElement("div");
      el.className = "clock";
      el.innerHTML = `
        <div class="head">
          <span class="n"></span>
          <button type="button" data-act="up" title="Move left" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" data-act="down" title="Move right" ${i === clocks.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" data-act="remove" title="Remove" ${clocks.length === 1 ? "disabled" : ""}>✕</button>
        </div>
        <div class="fields">
          <label>Label<input data-key="label" type="text"></label>
          <label>Timezone<input data-key="tz" type="text" list="tz" spellcheck="false"></label>
          <label>Latitude<input data-key="lat" type="number" step="any" min="-90" max="90"></label>
          <label>Longitude<input data-key="lon" type="number" step="any" min="-180" max="180"></label>
        </div>
        <div class="row-actions">
          <button type="button" data-act="home">Use home location</button>
        </div>
      `;
      el.querySelector(".n").textContent = clock.label || `Clock ${i + 1}`;
      el.querySelectorAll("input").forEach(inp => {
        const key = inp.dataset.key;
        inp.value = clock[key] ?? "";
        inp.addEventListener("input", () => {
          const ok = this._setField(i, key, inp.value);
          inp.classList.toggle("bad", key === "tz" && !ok);
          if (key === "label") el.querySelector(".n").textContent = inp.value || `Clock ${i + 1}`;
        });
      });
      el.querySelector('[data-act="up"]').addEventListener("click", () =>
        this._structural(c => { [c[i - 1], c[i]] = [c[i], c[i - 1]]; }));
      el.querySelector('[data-act="down"]').addEventListener("click", () =>
        this._structural(c => { [c[i], c[i + 1]] = [c[i + 1], c[i]]; }));
      el.querySelector('[data-act="remove"]').addEventListener("click", () =>
        this._structural(c => { c.splice(i, 1); }));
      el.querySelector('[data-act="home"]').addEventListener("click", () => {
        const cfg = this._hass && this._hass.config;
        if (!cfg) return;
        this._structural(c => {
          c[i].lat = +Number(cfg.latitude).toFixed(4);
          c[i].lon = +Number(cfg.longitude).toFixed(4);
          if (!c[i].tz && cfg.time_zone) c[i].tz = cfg.time_zone;
        });
      });
      list.appendChild(el);
    });

    root.querySelector(".add").addEventListener("click", () =>
      this._structural(c => {
        const tz = (this._hass && this._hass.config && this._hass.config.time_zone) || "UTC";
        c.push({ tz, label: "New clock" });
      }));
  }
}

customElements.define("daylight-still-night-clock-card-editor", DaylightStillNightClockCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "daylight-still-night-clock-card",
  name: "Daylight Still Night Clock",
  description: "Row of timezone clocks with a live sun-position sky gradient per location.",
});
