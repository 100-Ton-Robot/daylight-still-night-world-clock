// Redraws the README images in ../images, at fixed times so each run gives the same pictures.
const path = require("node:path");
const { test, AT, installView, openView, card, openEditor, dialogBox } = require("./helpers");

const IMAGES = process.env.IMAGES_DIR || path.join(__dirname, "..", "images");

test.beforeAll(async ({ browser }) => {
  await installView(browser);
});

test("screenshot: eight clocks", async ({ page }) => {
  await openView(page, AT.twoDates);
  await page.waitForTimeout(1500);
  await (await card(page, 0)).screenshot({ path: path.join(IMAGES, "screenshot.png") });
});

test("screenshot: visual editor", async ({ page }) => {
  await openView(page, AT.twoDates, { edit: true });
  await openEditor(page, 1);
  await page.screenshot({ path: path.join(IMAGES, "editor.png"), clip: await dialogBox(page) });
});
