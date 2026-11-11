// ===========================================================================
// TRANSLATIONS — editor text, one entry per language.
//
// To add a language, copy the "en" block, change the key to the Home
// Assistant language code (e.g. "de", "fr", "pt-BR") and translate the
// values. Keep the {placeholders}. Missing keys fall back to the base
// language ("pt" for "pt-BR"), then to "en". Regional entries such as
// "en-GB" only need the keys that differ.
// ===========================================================================
const TRANSLATIONS = {
  en: {
    order_hint: "Clocks show left → right in this order. Keep them in east → west (or west → east) order so the date bars group correctly. Leave latitude/longitude empty for a plain dark background.",
    text_style: "Text style & spacing",
    text_style_hint: "Sizes and gaps are multiples of the dashboard's normal text size. Gaps: 0 = original spacing, negative = closer together. Opacity: 0 = invisible, 1 = solid. Clear a field to go back to its default.",
    part_label: "Label",
    part_time: "Time",
    part_date: "Date",
    size: "Size",
    opacity: "Opacity",
    shadow: "Shadow",
    gap_label_time: "Gap: label → time",
    gap_time_date: "Gap: time → date",
    move_left: "Move left",
    move_right: "Move right",
    remove: "Remove",
    label: "Label",
    timezone: "Timezone",
    latitude: "Latitude",
    longitude: "Longitude",
    use_home: "Use home location",
    add_clock: "+ Add clock",
    clock_n: "Clock {n}",
    new_clock: "New clock",

    colors_card: "Colors (all clocks)",
    colors_clock: "Colors for this clock",
    colors_card_enable: "Use these card colors",
    colors_clock_enable: "Color override for this clock",
    preset: "Preset",
    same_as_card: "Same as card",
    reset_color: "Back to preset / card color",
    group_night: "Night",
    group_night_hint: "Sun more than 6° below the horizon",
    group_twilight: "Twilight",
    group_twilight_hint: "Sun 0–6° below the horizon",
    group_day: "Day",
    group_day_hint: "Sun up; the warm band rises toward its noon height",
    group_text: "Text",
    group_text_hint: "Date line follows the date color; a shared date bar uses its first clock's color",
    ckey_top: "Top",
    ckey_upper: "Upper",
    ckey_lower: "Lower",
    ckey_bottom: "Bottom",
    ckey_sky: "Sky",
    ckey_horizon: "Horizon",
    ckey_sun: "Sun",
    ckey_label: "Label",
    ckey_time: "Time",
    ckey_date: "Date",
    preset_default: "Default",
    preset_pastel: "Pastel",
    preset_vivid: "Vivid",
    preset_high_contrast: "High contrast",
    preset_monochrome: "Monochrome",
    sample_night: "Night",
    sample_twilight: "Twilight",
    sample_sunrise: "Sunrise",
    sample_low_sun: "Low sun",
    sample_afternoon: "Afternoon",
    sample_noon: "Noon",

    format_card: "Time & date format (all clocks)",
    format_clock: "Time & date format for this clock",
    format_card_enable: "Use these card settings",
    format_clock_enable: "Format override for this clock",
    format: "Format",
    format_default: "Default (1:30 PM · Wed, Nov 11)",
    format_system: "System (Home Assistant language and time format)",
    format_custom: "Custom",
    custom_hint: "Fields left on Automatic follow Home Assistant's language and time format.",
    custom_hint_clock: "Fields left on Same as card use the card's setting.",
    automatic: "Automatic",
    locale: "Language / region",
    locale_placeholder: "e.g. de-DE",
    hour_cycle: "Clock",
    hc_12: "12-hour",
    hc_24: "24-hour",
    seconds: "Seconds",
    weekday: "Weekday",
    month: "Month",
    year: "Year",
    opt_show: "Show",
    opt_hide: "Hide",
    opt_short: "Short",
    opt_long: "Long",
    opt_none: "None",
    opt_numeric: "Number",
  },
  "en-GB": {
    colors_card: "Colours (all clocks)",
    colors_clock: "Colours for this clock",
    colors_card_enable: "Use these card colours",
    colors_clock_enable: "Colour override for this clock",
    reset_color: "Back to preset / card colour",
    group_text_hint: "Date line follows the date colour; a shared date bar uses its first clock's colour",
  },
};

function _hassLanguage(hass) {
  return (hass && ((hass.locale && hass.locale.language) || hass.language)) ||
    (typeof navigator !== "undefined" && navigator.language) || "en";
}

function _t(lang, key, vars) {
  const find = l => {
    if (!l) return undefined;
    const hit = Object.keys(TRANSLATIONS).find(k => k.toLowerCase() === l.toLowerCase());
    return hit && TRANSLATIONS[hit][key];
  };
  let s = find(lang) ?? find(String(lang || "").split("-")[0]) ?? TRANSLATIONS.en[key] ?? key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.split(`{${k}}`).join(String(v)); });
  return s;
}

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

// ---------------------------------------------------------------------------
// Sky colours. Each phase is a top → bottom linear gradient; the day phase
// also reuses day_horizon / day_sun for the warm glow along the bottom.
// Layering per clock: DEFAULT → card preset → card colors → clock preset →
// clock colors. `colors_enabled: false` (card) / `color_override: false`
// (clock) keep the settings in the config but ignore them.
// ---------------------------------------------------------------------------
const COLOR_GROUPS = [
  { id: "night",
    keys: ["night_top", "night_upper", "night_lower", "night_bottom"] },
  { id: "twilight",
    keys: ["twilight_top", "twilight_upper", "twilight_lower", "twilight_bottom"] },
  { id: "day",
    keys: ["day_top", "day_upper", "day_sky", "day_horizon", "day_sun"] },
  { id: "text",
    keys: ["text_label", "text_time", "text_date"] },
];
const COLOR_KEYS = COLOR_GROUPS.flatMap(g => g.keys);

const PRESETS = {
  default: { label: "Default", colors: {
    night_top: "#000000", night_upper: "#3d2e4a", night_lower: "#2a1f35", night_bottom: "#1a3d5c",
    twilight_top: "#000000", twilight_upper: "#2a1f35", twilight_lower: "#1a3d5c", twilight_bottom: "#000000",
    day_top: "#000000", day_upper: "#1a4060", day_sky: "#3a7ca8", day_horizon: "#d4892a", day_sun: "#f5c842",
    text_label: "#ffffff", text_time: "#ffffff", text_date: "#ffffff",
  } },
  pastel: { label: "Pastel", colors: {
    night_top: "#1c1a2e", night_upper: "#4a4166", night_lower: "#3a3354", night_bottom: "#34506e",
    twilight_top: "#1c1a2e", twilight_upper: "#4a3d63", twilight_lower: "#5a6f94", twilight_bottom: "#2a2840",
    day_top: "#24324a", day_upper: "#4f7598", day_sky: "#7fa8c9", day_horizon: "#e0a87a", day_sun: "#f2d48f",
    text_label: "#ffffff", text_time: "#ffffff", text_date: "#ffffff",
  } },
  vivid: { label: "Vivid", colors: {
    night_top: "#000000", night_upper: "#3b1d5e", night_lower: "#24103d", night_bottom: "#0d3b6e",
    twilight_top: "#000000", twilight_upper: "#4a1d6b", twilight_lower: "#c2456b", twilight_bottom: "#1a0a2a",
    day_top: "#000814", day_upper: "#0b4f8a", day_sky: "#1e90d6", day_horizon: "#ff7a1a", day_sun: "#ffd31a",
    text_label: "#ffffff", text_time: "#ffffff", text_date: "#ffffff",
  } },
  high_contrast: { label: "High contrast", colors: {
    night_top: "#000000", night_upper: "#1a1426", night_lower: "#0f0b18", night_bottom: "#0a1e30",
    twilight_top: "#000000", twilight_upper: "#1f1630", twilight_lower: "#123352", twilight_bottom: "#000000",
    day_top: "#000000", day_upper: "#1d5a8c", day_sky: "#4aa3e0", day_horizon: "#f08c1e", day_sun: "#ffe14d",
    text_label: "#ffffff", text_time: "#ffffff", text_date: "#ffffff",
  } },
  monochrome: { label: "Monochrome", colors: {
    night_top: "#000000", night_upper: "#1e1e1e", night_lower: "#161616", night_bottom: "#262626",
    twilight_top: "#000000", twilight_upper: "#2a2a2a", twilight_lower: "#3a3a3a", twilight_bottom: "#000000",
    day_top: "#000000", day_upper: "#3c3c3c", day_sky: "#6a6a6a", day_horizon: "#8f8f8f", day_sun: "#b5b5b5",
    text_label: "#ffffff", text_time: "#ffffff", text_date: "#ffffff",
  } },
};

function _validColor(v) {
  if (typeof v !== "string" || !v.trim()) return false;
  try { return CSS.supports("color", v.trim()); } catch (e) { return /^#[0-9a-f]{3,8}$/i.test(v.trim()); }
}

// Apply one level (preset, then explicit colors) on top of `base`.
function _applyColorLevel(base, preset, colors) {
  const out = { ...base };
  if (preset && PRESETS[preset]) Object.assign(out, PRESETS[preset].colors);
  if (colors && typeof colors === "object")
    COLOR_KEYS.forEach(k => { if (_validColor(colors[k])) out[k] = colors[k].trim(); });
  return out;
}
function _cardColors(config) {
  const base = PRESETS.default.colors;
  return config.colors_enabled === false ? { ...base } : _applyColorLevel(base, config.preset, config.colors);
}
function _clockColors(config, clock) {
  const card = _cardColors(config);
  return clock.color_override === false ? card : _applyColorLevel(card, clock.preset, clock.colors);
}

// alt: current solar altitude (degrees)
// peakAlt: solar noon altitude for this location today (degrees)
// c: resolved colour set
function sunGradient(alt, peakAlt, c) {
  if (alt < -6)
    return `linear-gradient(to bottom, ${c.night_top}, ${c.night_upper} 40%, ${c.night_lower} 70%, ${c.night_bottom})`;
  if (alt < 0)
    return `linear-gradient(to bottom, ${c.twilight_top}, ${c.twilight_upper} 40%, ${c.twilight_lower} 70%, ${c.twilight_bottom})`;

  // warmPct: 0% at horizon → 90% at solar noon for this location
  // skyEnd clamped to 60% so label + time rows always stay in the dark/sky zone
  const warmPct  = peakAlt > 0 ? Math.min(90, (alt / peakAlt) * 90) : 0;
  const skyEnd   = Math.max(60, +(100 - warmPct).toFixed(1));
  const ambStart = +(skyEnd + (100 - skyEnd) * 0.5).toFixed(1);

  // Dim overlay starting at 55% ensures date row (60–80%) is always readable
  const dim  = `linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.55) 100%)`;
  // Subtle arch overlay at bottom (date zone only)
  const arch = `radial-gradient(ellipse 150% 35% at 50% 110%, ${c.day_sun}, ${c.day_horizon}, transparent)`;
  // Flat linear sky base
  const base = `linear-gradient(to bottom, ${c.day_top} 0%, ${c.day_upper} ${+(skyEnd * 0.5).toFixed(1)}%, ${c.day_sky} ${skyEnd}%, ${c.day_horizon} ${ambStart}%, ${c.day_sun} 100%)`;

  return `${dim}, ${arch}, ${base}`;
}

// ---------------------------------------------------------------------------
// Time & date format. Layering per clock, like the colours:
// default → card settings → clock settings. `format_enabled: false` (card) /
// `format_override: false` (clock) keep the settings but ignore them.
//   format: default | system | custom
//   custom fields: locale, hour_cycle (12|24), show_seconds, date_weekday
//   (short|long|none), date_month (short|long|numeric), date_year
// ---------------------------------------------------------------------------
const FORMAT_KEYS = ["format", "locale", "hour_cycle", "show_seconds", "date_weekday", "date_month", "date_year"];

function _applyFormatLevel(base, lvl) {
  const out = { ...base };
  FORMAT_KEYS.forEach(k => { if (lvl[k] !== undefined && lvl[k] !== null && lvl[k] !== "") out[k] = lvl[k]; });
  return out;
}
function _cardFormat(config) {
  return config.format_enabled === false ? { format: "default" } : _applyFormatLevel({ format: "default" }, config);
}
function _clockFormat(config, clock) {
  const card = _cardFormat(config);
  return clock.format_override === false ? card : _applyFormatLevel(card, clock);
}

function _validLocale(v) {
  try { return Intl.DateTimeFormat.supportedLocalesOf([String(v)]).length > 0; } catch (e) { return false; }
}

// HA's language and 12/24-hour setting (Profile → Time format).
function _systemLocale(hass) {
  const lang = _hassLanguage(hass);
  const tf = hass && hass.locale && hass.locale.time_format;
  let hour12;
  if (tf === "12") hour12 = true;
  else if (tf === "24") hour12 = false;
  else if (tf === "system") {
    try { hour12 = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12; } catch (e) { /* locale default */ }
  }
  return { lang, hour12 };
}

// Resolved format → Intl locale + options for the time and date lines.
function _formatOptions(f, hass) {
  if (f.format !== "system" && f.format !== "custom")
    return {
      locale: "en-US",
      time: { hour: "numeric", minute: "2-digit", hour12: true },
      date: { weekday: "short", month: "short", day: "numeric" },
    };
  const sys = _systemLocale(hass);
  const time = { hour: "numeric", minute: "2-digit" };
  const date = { weekday: "short", month: "short", day: "numeric" };
  let locale = sys.lang;
  let hour12 = sys.hour12;
  if (f.format === "custom") {
    if (f.locale && _validLocale(f.locale)) locale = f.locale;
    if (String(f.hour_cycle) === "12") hour12 = true;
    else if (String(f.hour_cycle) === "24") hour12 = false;
    if (f.show_seconds === true) time.second = "2-digit";
    if (f.date_weekday === "long") date.weekday = "long";
    else if (f.date_weekday === "none") delete date.weekday;
    if (f.date_month === "long" || f.date_month === "numeric") date.month = f.date_month;
    if (f.date_year === true) date.year = "numeric";
  }
  if (hour12 !== undefined) time.hour12 = hour12;
  return { locale, time, date };
}

function _makeFormatters(f, tz, hass) {
  const o = _formatOptions(f, hass);
  const make = (opts) => {
    try { return new Intl.DateTimeFormat(o.locale, { timeZone: tz, ...opts }); }
    catch (e) { return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }); }
  };
  return {
    time: make(o.time),
    date: make(o.date),
    // Calendar date in the clock's timezone, independent of display format;
    // date bars group on this so clocks with different formats still merge.
    day: new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }),
  };
}

class DawnToDuskClockCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!Array.isArray(config.clocks) || config.clocks.length === 0)
      throw new Error("dawn-to-dusk-clock-card: 'clocks' must be a non-empty list");
    this._config = config;
    this._makeAllFormatters();
    this._colors = config.clocks.map(clock => _clockColors(config, clock));
    if (this._built) this._rebuild();
  }

  _makeAllFormatters() {
    this._formatters = this._config.clocks.map(clock =>
      _makeFormatters(_clockFormat(this._config, clock), clock.tz, this._hass));
  }

  // Only the language and 12/24-hour setting matter here ("system" format);
  // rebuild formatters when either changes, not on every state update.
  set hass(hass) {
    const sig = `${_hassLanguage(hass)}|${hass && hass.locale && hass.locale.time_format}`;
    this._hass = hass;
    if (sig === this._hassSig) return;
    this._hassSig = sig;
    if (!this._config) return;
    this._makeAllFormatters();
    if (this._built) { this._lastGroupKey = null; this._tick(); }
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
        bg.style.background = sunGradient(alt, peakAlt, this._colors[i]);
      } else {
        bg.style.background = sunGradient(-90, 0, this._colors[i]);
      }
      grid.appendChild(bg);
      return bg;
    });

    this._timeEls = this._config.clocks.map(({ label }, i) => {
      const labelEl = document.createElement("div");
      labelEl.className = "label";
      labelEl.style.gridColumn = String(i + 1);
      labelEl.textContent = label;
      labelEl.style.color = this._colors[i].text_label;

      const timeEl = document.createElement("div");
      timeEl.className = "time";
      timeEl.style.gridColumn = String(i + 1);
      timeEl.style.color = this._colors[i].text_time;

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
        this._bgEls[i].style.background = sunGradient(alt, peakAlt, this._colors[i]);
      }
    });

    // Compute time + date strings per clock
    const clocks = this._config.clocks.map((_, i) => ({
      time: this._formatters[i].time.format(now),
      date: this._formatters[i].date.format(now),
      day:  this._formatters[i].day.format(now),
    }));

    clocks.forEach(({ time }, i) => {
      this._timeEls[i].textContent = time;
    });

    // Group consecutive clocks by calendar date (not display text, so clocks
    // with different formats still share a bar); the bar shows the text of
    // its first clock.
    const groups = [];
    clocks.forEach(({ date, day }, i) => {
      const last = groups.at(-1);
      if (last && last.day === day) {
        last.end = i + 1;
      } else {
        groups.push({ date, day, start: i + 1, end: i + 1 });
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
      el.style.color      = this._colors[start - 1].text_date;
      this._grid.appendChild(el);
      return el;
    });
  }

  static getConfigElement() {
    return document.createElement("dawn-to-dusk-clock-card-editor");
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

customElements.define("dawn-to-dusk-clock-card", DawnToDuskClockCard);

// ---------------------------------------------------------------------------
// Visual editor: text style, card colours + format, then one block per clock
// (label, timezone, lat, lon, its own colours + format), add / remove /
// reorder. Emits HA's standard "config-changed" event. All text via _t().
// ---------------------------------------------------------------------------
const _TIMEZONES = (() => {
  try { return Intl.supportedValuesOf("timeZone"); } catch (e) { return []; }
})();
const _LOCALE_SUGGESTIONS = ["en-US", "en-GB", "en-AU", "en-CA", "de-DE", "fr-FR", "es-ES", "it-IT", "nl-NL",
  "pt-BR", "pt-PT", "sv-SE", "da-DK", "nb-NO", "fi-FI", "pl-PL", "cs-CZ", "ja-JP", "zh-CN", "ko-KR", "ar-EG", "hi-IN"];

class DawnToDuskClockCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    const lang = _hassLanguage(hass);
    if (lang !== this._lang) {
      this._lang = lang;
      if (this._config) this._render();
    }
  }

  _t(key, vars) {
    return _t(this._lang || _hassLanguage(this._hass), key, vars);
  }

  setConfig(config) {
    // Our own edits come back through setConfig, asynchronously, so an echo of
    // an older keystroke can arrive after newer edits. Ignore echoes of any
    // recent emission: re-rendering from one would steal focus and roll back
    // the newer edits (this lost a just-typed latitude).
    if (this._emitted && this._emitted.has(JSON.stringify(config))) return;
    // Deep copy: clocks and colors are nested objects we edit in place.
    this._config = JSON.parse(JSON.stringify(config));
    if (!Array.isArray(this._config.clocks)) this._config.clocks = [];
    this._render();
  }

  _emit() {
    const config = JSON.parse(JSON.stringify(this._config));
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
    this._refreshFormats();
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

  // scope: "card" or a clock index.
  _level(scope) {
    return scope === "card" ? this._config : this._config.clocks[scope];
  }

  _scopeOf(sec, attr) {
    return sec.dataset[attr] === "card" ? "card" : Number(sec.dataset[attr]);
  }

  // Shared on/off switch wiring for colour and format sections.
  _wireSwitch(sec, selector, scope, key, refresh) {
    const en = sec.querySelector(selector);
    en.checked = this._level(scope)[key] !== false;
    en.addEventListener("change", () => {
      if (en.checked) delete this._level(scope)[key]; else this._level(scope)[key] = false;
      this._emit();
      refresh();
    });
  }

  // --- Colours -------------------------------------------------------------

  _colorEnabledKey(scope) {
    return scope === "card" ? "colors_enabled" : "color_override";
  }

  // Colours this level would produce if its switch were on (used to show
  // values in the pickers even while the switch is off).
  _levelColors(scope) {
    const lvl = this._level(scope);
    const below = scope === "card" ? PRESETS.default.colors : _cardColors(this._config);
    return _applyColorLevel(below, lvl.preset, lvl.colors);
  }

  // Colours actually in effect (respecting the switches), for the preview.
  _effectiveColors(scope) {
    return scope === "card" ? _cardColors(this._config) : _clockColors(this._config, this._level(scope));
  }

  _setColor(scope, key, value) {
    const lvl = this._level(scope);
    if (value == null) {
      if (lvl.colors) delete lvl.colors[key];
      if (lvl.colors && Object.keys(lvl.colors).length === 0) delete lvl.colors;
    } else {
      lvl.colors = lvl.colors || {};
      lvl.colors[key] = value;
    }
    this._emit();
    this._refreshColors();
  }

  _colorSectionHTML(scope) {
    const t = (k, v) => this._t(k, v);
    const id = scope === "card" ? "card" : `clock-${scope}`;
    const isCard = scope === "card";
    const presetOpts = (isCard ? "" : `<option value="">${t("same_as_card")}</option>`) +
      Object.keys(PRESETS).map(k => `<option value="${k}">${t(`preset_${k}`)}</option>`).join("");
    const keyName = k => t(`ckey_${k.split("_").slice(1).join("_")}`);
    return `
      <details class="sect" data-cscope="${scope}" data-open="${id}-colors">
        <summary>${t(isCard ? "colors_card" : "colors_clock")}</summary>
        <label class="check"><input type="checkbox" data-cenabled>${t(isCard ? "colors_card_enable" : "colors_clock_enable")}</label>
        <div class="cbody">
          <label>${t("preset")}<select data-preset>${presetOpts}</select></label>
          <div class="preview"></div>
          ${COLOR_GROUPS.map(g => `
            <details class="cgroup" data-open="${id}-${g.id}">
              <summary>${t(`group_${g.id}`)} <span class="ghint">${t(`group_${g.id}_hint`)}</span></summary>
              ${g.keys.map(k => `
                <div class="crow">
                  <span class="cname">${keyName(k)}</span>
                  <input type="color" data-ckey="${k}">
                  <input type="text" data-ctext="${k}" spellcheck="false">
                  <button type="button" data-creset="${k}" title="${t("reset_color")}">↺</button>
                </div>`).join("")}
            </details>`).join("")}
        </div>
      </details>`;
  }

  _wireColorSection(sec) {
    const scope = this._scopeOf(sec, "cscope");
    const lvl = () => this._level(scope);
    this._wireSwitch(sec, "[data-cenabled]", scope, this._colorEnabledKey(scope), () => this._refreshColors());

    const sel = sec.querySelector("[data-preset]");
    sel.value = lvl().preset && PRESETS[lvl().preset] ? lvl().preset : (scope === "card" ? "default" : "");
    sel.addEventListener("change", () => {
      // "default" at card level is the same as no preset; keep the YAML clean.
      if (!sel.value || (scope === "card" && sel.value === "default")) delete lvl().preset;
      else lvl().preset = sel.value;
      this._emit();
      this._refreshColors();
    });

    sec.querySelectorAll("[data-ckey]").forEach(inp =>
      inp.addEventListener("input", () => {
        sec.querySelector(`[data-ctext="${inp.dataset.ckey}"]`).value = inp.value;
        this._setColor(scope, inp.dataset.ckey, inp.value);
      }));
    sec.querySelectorAll("[data-ctext]").forEach(inp =>
      inp.addEventListener("input", () => {
        const v = inp.value.trim();
        if (!v) { inp.classList.remove("bad"); this._setColor(scope, inp.dataset.ctext, null); return; }
        const ok = _validColor(v);
        inp.classList.toggle("bad", !ok);
        if (ok) this._setColor(scope, inp.dataset.ctext, v);
      }));
    sec.querySelectorAll("[data-creset]").forEach(btn =>
      btn.addEventListener("click", () => {
        const tx = sec.querySelector(`[data-ctext="${btn.dataset.creset}"]`);
        tx.value = ""; tx.classList.remove("bad");
        this._setColor(scope, btn.dataset.creset, null);
      }));
  }

  // Update pickers, placeholders, reset buttons and previews in place (no
  // re-render, so focus and open sections survive).
  _refreshColors() {
    const root = this.shadowRoot;
    const toHex = v => {
      if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
      if (/^#[0-9a-f]{3}$/i.test(v)) return "#" + v.slice(1).split("").map(ch => ch + ch).join("").toLowerCase();
      return "#000000";
    };
    const samples = [["night", -20], ["twilight", -3], ["sunrise", 1], ["low_sun", 10], ["afternoon", 30], ["noon", 60]];
    root.querySelectorAll("[data-cscope]").forEach(sec => {
      const scope = this._scopeOf(sec, "cscope");
      const lvl = this._level(scope);
      if (!lvl) return;
      const shown = this._levelColors(scope);
      const own = lvl.colors || {};
      sec.classList.toggle("off", lvl[this._colorEnabledKey(scope)] === false);
      sec.querySelectorAll("[data-ckey]").forEach(inp => {
        if (root.activeElement !== inp) inp.value = toHex(shown[inp.dataset.ckey]);
      });
      sec.querySelectorAll("[data-ctext]").forEach(inp => {
        const k = inp.dataset.ctext;
        if (root.activeElement !== inp) inp.value = own[k] ?? "";
        inp.placeholder = shown[k];
      });
      sec.querySelectorAll("[data-creset]").forEach(btn => { btn.disabled = own[btn.dataset.creset] == null; });
      const eff = this._effectiveColors(scope);
      sec.querySelector(".preview").innerHTML = samples.map(([name, alt]) =>
        `<div class="pcol" style="background:${sunGradient(alt, 60, eff)}"><span style="color:${eff.text_time}">${this._t(`sample_${name}`)}</span></div>`).join("");
    });
  }

  // --- Time & date format --------------------------------------------------

  _formatEnabledKey(scope) {
    return scope === "card" ? "format_enabled" : "format_override";
  }

  _formatSectionHTML(scope) {
    const t = k => this._t(k);
    const id = scope === "card" ? "card" : `clock-${scope}`;
    const isCard = scope === "card";
    const unset = `<option value="">${t(isCard ? "automatic" : "same_as_card")}</option>`;
    const opts = pairs => unset + pairs.map(([v, k]) => `<option value="${v}">${t(k)}</option>`).join("");
    return `
      <details class="sect" data-fscope="${scope}" data-open="${id}-format">
        <summary>${t(isCard ? "format_card" : "format_clock")}</summary>
        <label class="check"><input type="checkbox" data-fenabled>${t(isCard ? "format_card_enable" : "format_clock_enable")}</label>
        <div class="cbody">
          <label>${t("format")}<select data-fkey="format">
            ${isCard ? "" : `<option value="">${t("same_as_card")}</option>`}
            <option value="default">${t("format_default")}</option>
            <option value="system">${t("format_system")}</option>
            <option value="custom">${t("format_custom")}</option>
          </select></label>
          <div class="fcustom">
            <div class="hint">${t(isCard ? "custom_hint" : "custom_hint_clock")}</div>
            <div class="fields">
              <label>${t("locale")}<input type="text" data-fkey="locale" list="locales" spellcheck="false" placeholder="${t("locale_placeholder")}"></label>
              <label>${t("hour_cycle")}<select data-fkey="hour_cycle">${opts([["12", "hc_12"], ["24", "hc_24"]])}</select></label>
              <label>${t("seconds")}<select data-fkey="show_seconds">${opts([["true", "opt_show"], ["false", "opt_hide"]])}</select></label>
              <label>${t("weekday")}<select data-fkey="date_weekday">${opts([["short", "opt_short"], ["long", "opt_long"], ["none", "opt_none"]])}</select></label>
              <label>${t("month")}<select data-fkey="date_month">${opts([["short", "opt_short"], ["long", "opt_long"], ["numeric", "opt_numeric"]])}</select></label>
              <label>${t("year")}<select data-fkey="date_year">${opts([["true", "opt_show"], ["false", "opt_hide"]])}</select></label>
            </div>
          </div>
          <div class="fsample"></div>
        </div>
      </details>`;
  }

  _wireFormatSection(sec) {
    const scope = this._scopeOf(sec, "fscope");
    const lvl = () => this._level(scope);
    this._wireSwitch(sec, "[data-fenabled]", scope, this._formatEnabledKey(scope), () => this._refreshFormats());

    // Stored types: hour_cycle number, show_seconds / date_year boolean.
    const fromUi = (key, v) => {
      if (key === "hour_cycle") return Number(v);
      if (key === "show_seconds" || key === "date_year") return v === "true";
      return v;
    };
    sec.querySelectorAll("select[data-fkey]").forEach(sel => {
      const key = sel.dataset.fkey;
      const cur = lvl()[key];
      sel.value = cur === undefined || cur === null ? (scope === "card" && key === "format" ? "default" : "") : String(cur);
      sel.addEventListener("change", () => {
        if (!sel.value || (scope === "card" && key === "format" && sel.value === "default")) delete lvl()[key];
        else lvl()[key] = fromUi(key, sel.value);
        this._emit();
        this._refreshFormats();
      });
    });
    const loc = sec.querySelector('input[data-fkey="locale"]');
    loc.value = lvl().locale ?? "";
    loc.addEventListener("input", () => {
      const v = loc.value.trim();
      if (!v) { loc.classList.remove("bad"); delete lvl().locale; }
      else if (_validLocale(v)) { loc.classList.remove("bad"); lvl().locale = v; }
      else { loc.classList.add("bad"); return; }
      this._emit();
      this._refreshFormats();
    });
  }

  _refreshFormats() {
    const root = this.shadowRoot;
    const now = new Date();
    const homeTz = this._hass && this._hass.config && this._hass.config.time_zone;
    root.querySelectorAll("[data-fscope]").forEach(sec => {
      const scope = this._scopeOf(sec, "fscope");
      const lvl = this._level(scope);
      if (!lvl) return;
      const isCard = scope === "card";
      sec.classList.toggle("off", lvl[this._formatEnabledKey(scope)] === false);
      // Show the custom fields when this level, if switched on, ends up custom.
      const below = isCard ? { format: "default" } : _cardFormat(this._config);
      sec.querySelector(".fcustom").hidden = _applyFormatLevel(below, lvl).format !== "custom";
      const eff = isCard ? _cardFormat(this._config) : _clockFormat(this._config, lvl);
      let tz = isCard ? homeTz : lvl.tz;
      try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch (e) { tz = undefined; }
      const f = _makeFormatters(eff, tz, this._hass);
      sec.querySelector(".fsample").textContent = `${f.time.format(now)} · ${f.date.format(now)}`;
    });
  }

  _render() {
    const t = (k, v) => this._t(k, v);
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
        details.sect { border: 1px solid var(--divider-color, #ccc); border-radius: 8px; padding: 6px 10px; margin: 8px 0; }
        details.sect > summary { font-weight: 500; cursor: pointer; }
        details.sect.off .cbody { opacity: 0.45; }
        .cbody { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
        select {
          font: inherit; padding: 6px 8px; margin-top: 2px; border-radius: 4px;
          border: 1px solid var(--divider-color, #ccc);
          background: var(--card-background-color, #fff); color: var(--primary-text-color);
          width: 100%; box-sizing: border-box;
        }
        .preview { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; }
        .pcol { height: 54px; border-radius: 4px; display: flex; align-items: flex-start; justify-content: center; }
        .pcol span { font-size: 0.65em; opacity: 0.8; margin-top: 4px; text-shadow: 0 1px 2px #000; }
        details.cgroup > summary { cursor: pointer; font-size: 0.9em; }
        .ghint { font-size: 0.8em; color: var(--secondary-text-color); }
        .crow { display: grid; grid-template-columns: 5em 2.6em 1fr auto; gap: 6px; align-items: center; margin: 4px 0; }
        .cname { font-size: 0.85em; }
        .crow input[type="color"] { padding: 0; height: 2em; margin: 0; cursor: pointer; }
        .crow input[type="text"] { font-size: 1em; padding: 4px 6px; margin: 0; }
        .fsample { font-size: 1.05em; font-weight: 500; padding: 4px 0; }
      </style>
      <div class="hint">${t("order_hint")}</div>
      <div class="clock sizes">
        <div class="head"><span class="n">${t("text_style")}</span></div>
        <div class="hint">${t("text_style_hint")}</div>
        <div class="fields three">
          ${["label", "time", "date"].map(f => `
            <div class="col">
              <div class="col-h">${t(`part_${f}`)}</div>
              <label>${t("size")}<input data-size="${f}_size" type="number" step="0.05" min="0.3"></label>
              <label>${t("opacity")}<input data-size="${f}_opacity" type="number" step="0.05" min="0" max="1"></label>
              <label class="check"><input data-shadow="${f}_shadow" type="checkbox">${t("shadow")}</label>
            </div>`).join("")}
        </div>
        <div class="fields gaps">
          <label>${t("gap_label_time")}<input data-size="label_time_gap" type="number" step="0.05" min="-1" max="3"></label>
          <label>${t("gap_time_date")}<input data-size="time_date_gap" type="number" step="0.05" min="-1" max="3"></label>
        </div>
      </div>
      ${this._colorSectionHTML("card")}
      ${this._formatSectionHTML("card")}
      <datalist id="tz">${_TIMEZONES.map(z => `<option value="${z}"></option>`).join("")}</datalist>
      <datalist id="locales">${_LOCALE_SUGGESTIONS.map(l => `<option value="${l}"></option>`).join("")}</datalist>
      <div class="list"></div>
      <button class="add" type="button">${t("add_clock")}</button>
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
          <button type="button" data-act="up" title="${t("move_left")}" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" data-act="down" title="${t("move_right")}" ${i === clocks.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" data-act="remove" title="${t("remove")}" ${clocks.length === 1 ? "disabled" : ""}>✕</button>
        </div>
        <div class="fields">
          <label>${t("label")}<input data-key="label" type="text"></label>
          <label>${t("timezone")}<input data-key="tz" type="text" list="tz" spellcheck="false"></label>
          <label>${t("latitude")}<input data-key="lat" type="number" step="any" min="-90" max="90"></label>
          <label>${t("longitude")}<input data-key="lon" type="number" step="any" min="-180" max="180"></label>
        </div>
        <div class="row-actions">
          <button type="button" data-act="home">${t("use_home")}</button>
        </div>
        ${this._colorSectionHTML(i)}
        ${this._formatSectionHTML(i)}
      `;
      const title = () => clock.label || t("clock_n", { n: i + 1 });
      el.querySelector(".n").textContent = title();
      el.querySelectorAll(".fields input[data-key]").forEach(inp => {
        const key = inp.dataset.key;
        inp.value = clock[key] ?? "";
        inp.addEventListener("input", () => {
          const ok = this._setField(i, key, inp.value);
          inp.classList.toggle("bad", key === "tz" && !ok);
          if (key === "label") el.querySelector(".n").textContent = inp.value || t("clock_n", { n: i + 1 });
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
        c.push({ tz, label: t("new_clock") });
      }));

    // Colour + format sections: wire, restore which <details> were open, fill values.
    root.querySelectorAll("[data-cscope]").forEach(sec => this._wireColorSection(sec));
    root.querySelectorAll("[data-fscope]").forEach(sec => this._wireFormatSection(sec));
    this._open = this._open || new Set();
    root.querySelectorAll("details[data-open]").forEach(d => {
      d.open = this._open.has(d.dataset.open);
      d.addEventListener("toggle", () => {
        if (d.open) this._open.add(d.dataset.open); else this._open.delete(d.dataset.open);
      });
    });
    this._refreshColors();
    this._refreshFormats();
  }
}

customElements.define("dawn-to-dusk-clock-card-editor", DawnToDuskClockCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "dawn-to-dusk-clock-card",
  name: "Dawn to Dusk Clock",
  description: "Row of timezone clocks with a live sun-position sky gradient per location.",
});
