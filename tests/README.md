# Browser tests

Playwright tests that load the card in a real Home Assistant frontend. They check the card and redraw the README images.

## What you need

- A Home Assistant instance you can change. Use a test instance, not the one that runs your home.
- The card installed there as a dashboard resource whose URL contains `dawn-to-dusk-clock-card.js`, serving **this checkout's** copy of the file. The first check fails if it doesn't, so copy the file over after each change.
- A storage-mode dashboard for the tests. They add one view to it, `dawn-to-dusk-tests` (see [`view.json`](./view.json)), replace it on every run and leave the other views alone.
- A long-lived access token from an admin user (Profile → Security), saved in a file only you can read. Saving the dashboard needs admin rights.
- Node 18 or later.

## Running

```sh
cd tests
npm ci
npx playwright install chromium
HA_URL=https://ha.example.com HA_TOKEN_FILE=~/.ha-test-token HA_DASHBOARD=my-test-dashboard npm test
```

| Variable | Required | Meaning |
|---|---|---|
| `HA_URL` | yes | Your Home Assistant address |
| `HA_TOKEN_FILE` | yes | File holding the access token |
| `HA_DASHBOARD` | no | The test dashboard's URL path. Default `dawn-to-dusk-tests` |
| `IMAGES_DIR` | no | Where `npm run screenshots` writes. Default `../images` |

`npm run screenshots` redraws `images/screenshot.png` and `images/editor.png`. Look at them before committing.

Never turn on Playwright tracing: a trace records the access token.

## What the checks cover

| Check | What it shows |
|---|---|
| Home Assistant serves this copy of the card | The browser is testing your changes, not an older install |
| Labels and times, with no browser errors | Every clock draws, with the right time for a fixed moment, and nothing is logged as an error or warning |
| One date bar / the date bar splits | Clocks on the same calendar date share a bar, and the bar splits where the date changes |
| The visual editor opens | The editor loads with the card's clocks |
| Four clocks fit the editor preview | No label, time or date is wider than its column in the editor's narrow preview |
| Eight clocks fit the editor preview | **Expected to fail** for now: at that width the times run into each other. Marked with `test.fail()` until the card handles it |

Every check fixes the browser's clock at a set moment (see `AT` in [`helpers.js`](./helpers.js)), so skies, times and date bars are the same on every run. Times are checked in Home Assistant's default 12-hour English format; a test user with another language or time format will see the time checks fail.

## What they don't cover

- Whether it looks right. Nothing compares screenshots, so a wrong color passes.
- Browsers other than Chromium.
