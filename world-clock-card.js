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


class WorldClockCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!Array.isArray(config.clocks) || config.clocks.length === 0)
      throw new Error("world-clock-card: 'clocks' must be a non-empty list");
    this._config = config;
    this._formatters = config.clocks.map(({ tz }) => ({
      time: new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }),
      date: new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }),
    }));
    if (this._built) this._rebuild();
  }

  getGridOptions() {
    return { columns: 12, rows: 1, min_columns: 4, min_rows: 1 };
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
        font-size: 1.0em;
        opacity: 0.6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        z-index: 1;
      }
      .time {
        grid-row: 3;
        text-align: center;
        font-size: 1.05em;
        font-weight: 600;
        white-space: nowrap;
        position: relative;
        z-index: 1;
      }
      .date {
        grid-row: 4;
        text-align: center;
        font-size: 0.7em;
        opacity: 0.55;
        border-top: 1px solid currentColor;
        padding-top: 2px;
        margin-top: 2px;
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
}

customElements.define("world-clock-card", WorldClockCard);
