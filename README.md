# Day Night World Clock

Yet another day/night world clock card for Home Assistant, this one uses css gradients and sun position so you can easily see sun up/down for each location.

A lightweight [Home Assistant](https://www.home-assistant.io/) Lovelace card (`custom:world-clock-card`) that shows a row of timezone clocks, with an optional sky-gradient background that reflects the sun's actual position at each location.

- Pure vanilla JS — no build step, no dependencies, no HA sensors required
- Live-updating time, per-clock date labels that group automatically (e.g. one date bar spanning several columns when they share a calendar date)
- Optional day/night sky gradient per clock, computed from latitude/longitude (dawn → noon → dusk → night)
- Colors use `currentColor` for text, so the card adapts to your dashboard's light/dark theme

## Installation

### Option A — HACS (recommended)

1. In Home Assistant, open **HACS → Frontend**.
2. Click the **⋮** menu → **Custom repositories**.
3. Add `https://github.com/100-Ton-Robot/day-night-world-clock`, category **Dashboard**.
4. Find **Day Night World Clock** in the list and click **Download**.
5. Restart Home Assistant (or just reload resources) if prompted.

HACS registers the Lovelace resource for you — skip to [Configuration](#configuration).

### Option B — Manual install

1. Copy [`world-clock-card.js`](./world-clock-card.js) into your Home Assistant `config/www/` directory:
   ```
   config/www/world-clock-card.js
   ```
2. Add it as a Lovelace resource:
   - **UI:** Settings → Dashboards → ⋮ (top right) → Resources → **Add Resource**
     - URL: `/local/world-clock-card.js`
     - Resource type: **JavaScript module**
   - **YAML mode** (`lovelace_resources` or your dashboard's `resources:` key):
     ```yaml
     - url: /local/world-clock-card.js
       type: module
     ```
3. Reload the dashboard (hard refresh the browser tab).

> **Cache busting:** browsers aggressively cache `/local/` files. After editing the file, bump a version query string on the resource URL, e.g. `/local/world-clock-card.js?v=2`, and increment it on each future change.

## Configuration

Add the card to a dashboard, in YAML mode:

```yaml
- type: custom:world-clock-card
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

**Ordering matters:** clocks are rendered in the order listed, and the date-grouping bar assumes date order is contiguous (no interleaving of dates). List them east → west (or west → east) for date grouping to make sense.

## Layout notes

The card uses a 4-row CSS grid: a small top spacer, the label row, the time row, and a date row. Consecutive clocks that share the same calendar date get a single date bar spanning their columns (at most two groups, since ordering is monotonic). The grouping recomputes every second but only touches the DOM when the grouping actually changes, so it survives midnight rollovers without a page reload.

## License

[MIT](./LICENSE)
