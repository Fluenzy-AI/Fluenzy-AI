/**
 * Shared Puppeteer browser launcher.
 *
 * • Local / Windows dev  → uses the full `puppeteer` package (bundles its own Chrome).
 * • Render / Linux prod  → uses `puppeteer-core` + `@sparticuz/chromium` which ships a
 *   static Chromium binary compatible with cloud Linux environments.
 */

import type { Browser } from "puppeteer-core";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function launchBrowser(): Promise<Browser> {
  if (IS_PRODUCTION) {
    // Cloud / Linux path  ────────────────────────────────────────────────────
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;

    const executablePath = await chromium.executablePath();

    return puppeteerCore.launch({
      args: [
        ...chromium.args,
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
      ],
      executablePath,
      headless: true,
    });
  } else {
    // Local dev path  ────────────────────────────────────────────────────────
    const puppeteer = (await import("puppeteer")).default;
    return puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    }) as unknown as Browser;
  }
}

/**
 * Renders `html` to a PDF buffer (A4, with 18 mm margins).
 * Handles browser lifecycle automatically.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    return Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
      })
    );
  } finally {
    await browser.close();
  }
}
