const fs = require("node:fs");
const path = require("node:path");
const { test: base, expect } = require("@playwright/test");

// A storage-mode dashboard the tests may write to. The tests add (or replace) one view, `dawn-to-dusk-tests`,
// and leave the dashboard's other views alone.
const DASHBOARD = process.env.HA_DASHBOARD || "dawn-to-dusk-tests";
const VIEW = require("./view.json");
const CARD = "dawn-to-dusk-clock-card";
const CARD_FILE = path.join(__dirname, "..", `${CARD}.js`);

// Fixed moments (UTC) the checks and screenshots use, so every run draws the same skies and dates.
const AT = {
  // Auckland is on Thu, Nov 12; Japan through San Francisco share Wed, Nov 11. Daylight over Cairo, Paris and London.
  twoDates: "2026-11-11T11:50:00Z",
  // Auckland 11 PM and San Francisco 2 AM: every clock is on Wed, Nov 11.
  oneDate: "2026-11-11T10:00:00Z",
};

function readToken() {
  if (!process.env.HA_TOKEN_FILE) throw new Error("Set HA_TOKEN_FILE to a file holding a long-lived access token");
  const token = fs.readFileSync(process.env.HA_TOKEN_FILE, "utf8").trim();
  if (!token) throw new Error(`${process.env.HA_TOKEN_FILE} is empty`);
  return token;
}

async function logIn(page) {
  await page.addInitScript(token => {
    if (localStorage.getItem("hassTokens")) return;
    localStorage.setItem("hassTokens", JSON.stringify({
      hassUrl: location.origin,
      clientId: `${location.origin}/`,
      access_token: token,
      token_type: "Bearer",
      refresh_token: "",
      expires_in: 31536000,
      expires: Date.now() + 31536000000,
    }));
  }, readToken());
}

// A logged-in page that collects what the browser reports.
const test = base.extend({
  page: async ({ page }, use) => {
    await logIn(page);
    page.messages = [];
    page.on("console", msg => {
      if (msg.type() === "error" || msg.type() === "warning") page.messages.push(`${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", e => page.messages.push(`pageerror: ${e}`));
    await use(page);
  },
});

// Runs in the page: every element with this tag name, looking through shadow roots.
function findAll(tag) {
  const found = [];
  const walk = root => {
    for (const el of root.querySelectorAll("*")) {
      if (el.localName === tag) found.push(el);
      if (el.shadowRoot) walk(el.shadowRoot);
    }
  };
  walk(document);
  return found;
}

async function waitForHass(page) {
  await page.waitForFunction(() => document.querySelector("home-assistant")?.hass?.connected, null, { timeout: 30_000 });
}

// Writes the test view into the dashboard, replacing an earlier copy.
async function installView(browser) {
  const page = await browser.newPage();
  await logIn(page);
  await page.goto("/");
  await waitForHass(page);
  await page.evaluate(async ({ dashboard, view }) => {
    const hass = document.querySelector("home-assistant").hass;
    const config = await hass.callWS({ type: "lovelace/config", url_path: dashboard });
    config.views = (config.views || []).filter(v => v.path !== view.path).concat([view]);
    await hass.callWS({ type: "lovelace/config/save", url_path: dashboard, config });
  }, { dashboard: DASHBOARD, view: VIEW });
  await page.close();
}

// Opens the test view with the browser's clock fixed at `at`, and waits for both cards.
async function openView(page, at, { edit = false } = {}) {
  await page.clock.setFixedTime(new Date(at));
  await page.goto(`/${DASHBOARD}/${VIEW.path}${edit ? "?edit=1" : ""}`);
  await waitForHass(page);
  await page.waitForFunction(
    ([find, tag]) => new Function(`return ${find}`)()(tag).filter(c => c.shadowRoot?.querySelector(".date")).length >= 2,
    [findAll.toString(), CARD], { timeout: 30_000 });
}

// A handle on the nth card (0 = eight clocks, 1 = four clocks).
async function card(page, n) {
  return (await page.evaluateHandle(
    ([find, tag, i]) => new Function(`return ${find}`)()(tag)[i], [findAll.toString(), CARD, n])).asElement();
}

// Text of each label, time and date bar in the nth card, with each date bar's grid columns.
async function readCard(page, n) {
  return page.evaluate(([find, tag, i]) => {
    const root = new Function(`return ${find}`)()(tag)[i].shadowRoot;
    const text = sel => [...root.querySelectorAll(sel)].map(e => e.textContent);
    return {
      labels: text(".label"),
      times: text(".time"),
      dates: [...root.querySelectorAll(".date")].map(e => ({ text: e.textContent, columns: e.style.gridColumn })),
    };
  }, [findAll.toString(), CARD, n]);
}

// Opens the editor dialog for the nth card. Home Assistant's edit overlay sits over the card and takes the click. A
// click may only select the card and show a pencil button at its center; clicking again there opens the editor.
async function openEditor(page, n) {
  const box = await (await card(page, n)).boundingBox();
  const editorOpen = ([find, tag]) => {
    const ed = new Function(`return ${find}`)()(`${tag}-editor`)[0];
    return Boolean(ed && ed.shadowRoot && ed.shadowRoot.childElementCount > 0);
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    try {
      await page.waitForFunction(editorOpen, [findAll.toString(), CARD], { timeout: 5_000 });
      break;
    } catch (e) {
      if (attempt === 2) throw e;
    }
  }
  // The dialog animates open.
  await page.waitForTimeout(1500);
}

// The open dialog's box on the page, for clipping a screenshot to it.
async function dialogBox(page) {
  return page.evaluate(find => {
    const dialog = new Function(`return ${find}`)()("dialog").find(d => d.open);
    const r = dialog.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, findAll.toString());
}

module.exports = { test, expect, AT, CARD, CARD_FILE, DASHBOARD, installView, openView, card, readCard, openEditor,
  dialogBox, findAll };
