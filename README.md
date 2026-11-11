# Dawn to Dusk Clock

Yet another day/night world clock card for Home Assistant, this one uses css gradients and sun position so you can easily see sun up/down for each location.

![Eight clocks from Auckland to San Francisco: night skies on the ends, daylight over Cairo, Paris and London, and two date bars (Thu, Nov 12 / Wed, Nov 11)](https://raw.githubusercontent.com/100-Ton-Robot/dawn-to-dusk-clock-card/dev/images/screenshot.png)

*Auckland and Japan are already on Thursday; Cairo through San Francisco share Wednesday's date bar. Each column's sky follows the sun at that location: daylight over Cairo, Paris and London, sunrise glow in New York, night elsewhere.*

A lightweight [Home Assistant](https://www.home-assistant.io/) Lovelace card (`custom:dawn-to-dusk-clock-card`) that shows a row of timezone clocks, with an optional sky-gradient background that reflects the sun's actual position at each location.

- Pure vanilla JS — no build step, no dependencies, no HA sensors required
- Live-updating time, per-clock date labels that group automatically (e.g. one date bar spanning several columns when they share a calendar date)
- Optional day/night sky gradient per clock, computed from latitude/longitude (dawn → noon → dusk → night)
- Sky and text colours, presets, and time/date format are configurable for the whole card or per clock, from the visual editor or YAML

## Installation

### Option A — Marketplace (recommended)

1. In Home Assistant, go to **Settings → Marketplace**.
2. Select **Add from link** (upper right).
3. Enter `100-Ton-Robot/dawn-to-dusk-clock-card` and select **Add**. If asked for a type, choose **Dashboard**.
4. Install **Dawn to Dusk Clock**, then reload the browser.

The Marketplace installs the card under `www/community` and registers the dashboard resource for you. If you manage resources in YAML, the install dialog shows the resource line to add. Skip to [Configuration](#configuration).

### Option B — Manual install

1. Copy [`dawn-to-dusk-clock-card.js`](./dawn-to-dusk-clock-card.js) into your Home Assistant `config/www/` directory:
   ```
   config/www/dawn-to-dusk-clock-card.js
   ```
2. Add it as a Lovelace resource:
   - **UI:** Settings → Dashboards → ⋮ (top right) → Resources → **Add Resource**
     - URL: `/local/dawn-to-dusk-clock-card.js`
     - Resource type: **JavaScript module**
   - **YAML mode** (`lovelace_resources` or your dashboard's `resources:` key):
     ```yaml
     - url: /local/dawn-to-dusk-clock-card.js
       type: module
     ```
3. Reload the dashboard (hard refresh the browser tab).

> **Cache busting:** browsers aggressively cache `/local/` files. After editing the file, bump a version query string on the resource URL, e.g. `/local/dawn-to-dusk-clock-card.js?v=2`, and increment it on each future change.

## Configuration

Add **Dawn to Dusk Clock** from the dashboard's card picker and use the visual editor: one row per clock with label, timezone (type to search), latitude and longitude, a card-wide **Text style & spacing** section (size, opacity and shadow per line, plus gaps), plus add / remove / reorder buttons and **Use home location**.

Or in YAML:

```yaml
- type: custom:dawn-to-dusk-clock-card
  clocks:
    - tz: Australia/Sydney
      label: Sydney
      lat: -33.87
      lon: 151.21
    - tz: Asia/Tokyo
      label: Tokyo
      lat: 35.68
      lon: 139.65
    - tz: Europe/London
      label: London
      lat: 51.51
      lon: -0.13
    - tz: America/New_York
      label: New York
      lat: 40.71
      lon: -74.01
```

### Options

| Key     | Required | Description |
|---------|----------|--------------|
| `clocks` | yes | List of clock entries, rendered left → right in the order given |
| `clocks[].tz` | yes | Any [IANA timezone string](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g. `Europe/Paris`) |
| `clocks[].label` | yes | Text shown above the time; truncates with an ellipsis if the column is too narrow |
| `clocks[].lat` / `clocks[].lon` | no | Latitude/longitude in decimal degrees. When given, the column background shows a sun-position gradient (night → dawn/dusk → daylight) that updates live. Omit both to get a plain dark background with no sun tracking. |
| `label_size` | no | Label text size as a multiple of the dashboard's normal text size. Default `1.0` |
| `time_size` | no | Time text size, same units. Default `1.05` |
| `date_size` | no | Date text size, same units. Default `0.7` |
| `label_time_gap` | no | Extra space between label and time, same units. `0` (default) = original spacing; negative pulls them closer (min `-1`, max `3`) |
| `time_date_gap` | no | Extra space between time and date, same units and limits. Default `0` |
| `label_opacity` / `time_opacity` / `date_opacity` | no | Text opacity, `0` (invisible) to `1` (solid). Defaults `0.6` / `1` / `0.55` |
| `label_shadow` / `time_shadow` / `date_shadow` | no | `true` adds a dark text shadow, which helps on bright daylight backgrounds. Default off |

**Ordering matters:** clocks are rendered in the order listed, and the date-grouping bar assumes date order is contiguous (no interleaving of dates). List them east → west (or west → east) for date grouping to make sense.

## Sky colours

Colours can be set for the whole card and overridden per clock. Each level can pick a **preset** and then override individual colours; anything you leave out falls through to the level below:

built-in default → card `preset` → card `colors` → clock `preset` → clock `colors`

```yaml
type: custom:dawn-to-dusk-clock-card
preset: vivid               # default | pastel | vivid | high_contrast | monochrome
colors:
  day_sky: "#3a7ca8"
clocks:
  - tz: Pacific/Auckland
    label: Auckland
    lat: -36.85
    lon: 174.76
    preset: pastel          # this clock only
    colors:
      night_top: "#101020"
```

**Testing without deleting:** `colors_enabled: false` on the card, or `color_override: false` on a clock, keeps that level's preset and colours in the config but ignores them. Both default to on.

| Phase | When | Keys (top → bottom) |
|-------|------|---------------------|
| Night | sun more than 6° below the horizon | `night_top`, `night_upper`, `night_lower`, `night_bottom` |
| Twilight | sun 0–6° below the horizon | `twilight_top`, `twilight_upper`, `twilight_lower`, `twilight_bottom` |
| Day | sun up; the warm band rises toward the sun's noon height | `day_top`, `day_upper`, `day_sky`, `day_horizon`, `day_sun` |
| Text | always | `text_label`, `text_time`, `text_date` (default white). The date line follows `text_date`; a date bar spanning several clocks uses its first clock's colour |

The warm glow along the bottom in daytime uses `day_sun` and `day_horizon`. Values are any CSS colour (`"#rrggbb"`, `rgb(...)`, names); quote hex values in YAML.

In the visual editor, **Colours (all clocks)** and each clock's **Colours for this clock** have the on/off switch, a preset dropdown, a sky preview strip (night → noon) and a colour picker per key with a ↺ reset.

## Time & date format

Like the colours, format is set for the whole card and can be overridden per clock: default → card → clock.

| Key | Values | Meaning |
|-----|--------|---------|
| `format` | `default` (if omitted) / `system` / `custom` | `default` = `1:30 PM` · `Wed, Nov 11` regardless of settings. `system` = Home Assistant's language and 12/24-hour setting (Profile → Time format). `custom` = the fields below |
| `locale` | e.g. `de-DE`, `fr-FR` | Language/region for names and order. Empty = Home Assistant's language |
| `hour_cycle` | `12` / `24` | Empty = Home Assistant's time format |
| `show_seconds` | `true` / `false` | Default `false` |
| `date_weekday` | `short` / `long` / `none` | Default `short` |
| `date_month` | `short` / `long` / `numeric` | Default `short` |
| `date_year` | `true` / `false` | Default `false` |

```yaml
format: custom
locale: de-DE
hour_cycle: 24
date_weekday: long
date_month: long
clocks:
  - tz: America/New_York
    label: New York
    format: default          # this clock keeps the US style
```

`format_enabled: false` (card) or `format_override: false` (clock) keeps the settings but ignores them. Date bars group clocks by calendar date in each timezone, so clocks with different formats still share a bar; the bar shows the date in its first clock's format.

## Translations

The editor follows your Home Assistant language. English (`en`, US spelling) and British English (`en-GB`) are included. To add a language, copy the `en` block in the `TRANSLATIONS` table at the top of `dawn-to-dusk-clock-card.js`, key it with the Home Assistant language code (e.g. `de`, `pt-BR`) and translate the values; missing keys fall back to the base language, then English. Pull requests welcome.

## Layout notes

The card uses a 4-row CSS grid: a small top spacer, the label row, the time row, and a date row. Consecutive clocks that share the same calendar date get a single date bar spanning their columns (at most two groups, since ordering is monotonic). The grouping recomputes every second but only touches the DOM when the grouping actually changes, so it survives midnight rollovers without a page reload. The card takes the height of its content (no fixed row count on sections dashboards), so text sizes and gaps never clip the date row.

## License

[MIT](./LICENSE)

## Acknowledgements

Inspired by [daylight-calendar-card](https://github.com/superdingo101/daylight-calendar-card) by superdingo101. No code from that project is used here.

I think I started this as a clone of https://github.com/Serios/world-clock-card
