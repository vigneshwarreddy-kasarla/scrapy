import { chromium } from "playwright";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:4173";
const outDir = "docs/assets";

async function shot(page, path, file) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: `${outDir}/${file}`, fullPage: true });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await shot(page, "/menu", "menu.png");
  await shot(page, "/login", "login.png");

  // Register tab preview
  await page.getByRole("button", { name: "Register" }).click();
  await page.screenshot({ path: `${outDir}/register.png`, fullPage: true });

  // Login with seed customer to access protected pages.
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByPlaceholder("10-digit mobile number").fill("9995550001");
  await page.locator('input[type="password"]').first().fill("DummyPass1!");
  await page.getByRole("button", { name: "Log in" }).last().click();
  try {
    await page.waitForURL("**/menu", { timeout: 10000 });
    await shot(page, "/cart", "cart.png");
    await shot(page, "/checkout", "checkout.png");
    await shot(page, "/orders", "orders.png");
    await shot(page, "/admin", "admin.png");
  } catch {
    await page.screenshot({ path: `${outDir}/login-error.png`, fullPage: true });
    await shot(page, "/cart", "cart.png");
    await shot(page, "/checkout", "checkout.png");
    await shot(page, "/orders", "orders.png");
    await shot(page, "/admin", "admin.png");
  }
} finally {
  await browser.close();
}
