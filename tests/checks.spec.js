const fs = require("node:fs");
const { test, expect, AT, CARD, CARD_FILE, installView, openView, card, readCard, openEditor, findAll } =
  require("./helpers");
const VIEW = require("./view.json");

test.beforeAll(async ({ browser }) => {
  await installView(browser);
});

test("Home Assistant serves this copy of the card", async ({ page }) => {
  await openView(page, AT.twoDates);
  const served = await page.evaluate(async () => {
    const hass = document.querySelector("home-assistant").hass;
    const resources = await hass.callWS({ type: "lovelace/resources" });
    const found = resources.filter(r => /dawn-to-dusk-clock-card\.js/.test(r.url));
    if (found.length !== 1) return { error: `expected one card resource, found ${found.length}` };
    const response = await fetch(found[0].url, { cache: "no-store" });
    return { url: found[0].url, text: await response.text() };
  });
  expect(served.error, served.error).toBeUndefined();
  expect(served.text === fs.readFileSync(CARD_FILE, "utf8"),
    `${served.url} differs from ${CARD}.js in this checkout. Copy the file to Home Assistant first.`).toBe(true);
});

test("each clock shows its label and time, with no browser errors", async ({ page }) => {
  await openView(page, AT.twoDates);
  const shown = await readCard(page, 0);
  const clocks = VIEW.sections[0].cards[0].clocks;
  expect(shown.labels).toEqual(clocks.map(c => c.label));
  expect(shown.times).toHaveLength(clocks.length);
  for (const t of shown.times) expect(t).toMatch(/\d/);
  // 11:50 UTC is 12:50 AM in Auckland and 3:50 AM in San Francisco.
  expect(shown.times[0]).toContain("12:50");
  expect(shown.times.at(-1)).toContain("3:50");
  expect(page.messages).toEqual([]);
});

test("clocks on the same date share one date bar", async ({ page }) => {
  await openView(page, AT.oneDate);
  const shown = await readCard(page, 0);
  expect(shown.dates).toHaveLength(1);
  expect(shown.dates[0].columns.replace(/\s/g, "")).toBe("1/9");
  expect(shown.dates[0].text).toContain("11");
});

test("the date bar splits where the date changes", async ({ page }) => {
  await openView(page, AT.twoDates);
  const shown = await readCard(page, 0);
  expect(shown.dates.map(d => d.columns.replace(/\s/g, ""))).toEqual(["1/2", "2/9"]);
  expect(shown.dates[0].text).toContain("12");
  expect(shown.dates[1].text).toContain("11");
});

test("the visual editor opens with the card's clocks", async ({ page }) => {
  await openView(page, AT.twoDates, { edit: true });
  await openEditor(page, 1);
  const editor = await page.evaluate(([find, tag]) => {
    const ed = new Function(`return ${find}`)()(`${tag}-editor`)[0];
    const values = [];
    const walk = root => {
      for (const el of root.querySelectorAll("*")) {
        if ("value" in el && typeof el.value === "string") values.push(el.value);
        if (el.shadowRoot) walk(el.shadowRoot);
      }
    };
    walk(ed.shadowRoot);
    return values;
  }, [findAll.toString(), CARD]);
  for (const label of VIEW.sections[0].cards[1].clocks.map(c => c.label)) expect(editor).toContain(label);
  expect(page.messages).toEqual([]);
});

// Draws a fresh card `width` pixels wide and returns each label, time and date that is wider than its space.
async function overflowAt(page, config, width) {
  return page.evaluate(([tag, cfg, w]) => {
    const box = document.createElement("div");
    box.style.cssText = `position:absolute; left:0; top:0; width:${w}px; z-index:9999`;
    const el = document.createElement(tag);
    el.setConfig(cfg);
    el.hass = document.querySelector("home-assistant").hass;
    box.appendChild(el);
    document.body.appendChild(box);
    const over = [...el.shadowRoot.querySelectorAll(".label, .time, .date")]
      .filter(e => e.scrollWidth > e.clientWidth + 1)
      .map(e => `${e.className} "${e.textContent}" needs ${e.scrollWidth}px, has ${e.clientWidth}px`);
    box.remove();
    return over;
  }, [CARD, config, width]);
}

// The width of the preview in Home Assistant's card editor, at this viewport.
const PREVIEW_WIDTH = 470;

test("four clocks with smaller text fit the editor preview", async ({ page }) => {
  await openView(page, AT.twoDates);
  const { type, grid_options, ...config } = VIEW.sections[0].cards[1];
  expect(await overflowAt(page, config, PREVIEW_WIDTH)).toEqual([]);
});

test("eight clocks fit the editor preview", async ({ page }) => {
  // Known problem: at this width the times are wider than their columns and run into each other.
  // Remove this line once the card shrinks or clips them.
  test.fail();
  await openView(page, AT.twoDates);
  const { type, grid_options, ...config } = VIEW.sections[0].cards[0];
  expect(await overflowAt(page, config, PREVIEW_WIDTH)).toEqual([]);
});
