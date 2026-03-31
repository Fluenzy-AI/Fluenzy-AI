/**
 * Shared Puppeteer browser launcher with connection pooling.
 *
 * • Local / Windows dev  → uses the full `puppeteer` package (bundles its own Chrome).
 * • Render / Linux prod  → uses `puppeteer-core` + `@sparticuz/chromium` which ships a
 *   static Chromium binary compatible with cloud Linux environments.
 * 
 * OPTIMIZATION: Uses singleton browser instance to avoid launching Chromium for every PDF.
 * Browser is reused across requests and only closed after idle timeout.
 */

import type { Browser, Page } from "puppeteer-core";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ── Singleton Browser Instance ───────────────────────────────────────────────
let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;
let idleTimer: NodeJS.Timeout | null = null;
const IDLE_TIMEOUT_MS = 30000; // Close browser after 30s of inactivity

/**
 * Get or create a shared browser instance.
 * Uses connection pooling to avoid launching Chromium for every request.
 */
export async function getBrowser(): Promise<Browser> {
  // Clear idle timer since browser is being used
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  // Return existing browser if connected
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  // Wait for existing launch if in progress
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  // Launch new browser
  browserLaunchPromise = launchBrowserInternal();
  
  try {
    browserInstance = await browserLaunchPromise;
    
    // Handle disconnection
    browserInstance.on("disconnected", () => {
      console.log("[PDF-BROWSER] Browser disconnected");
      browserInstance = null;
      browserLaunchPromise = null;
    });
    
    return browserInstance;
  } finally {
    browserLaunchPromise = null;
  }
}

/**
 * Internal browser launch function.
 */
async function launchBrowserInternal(): Promise<Browser> {
  console.log("[PDF-BROWSER] Launching new browser instance...");
  const startTime = Date.now();
  
  let browser: Browser;
  
  if (IS_PRODUCTION) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;
    const executablePath = await chromium.executablePath();

    browser = await puppeteerCore.launch({
      args: [
        ...chromium.args,
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // Better for serverless
      ],
      executablePath,
      headless: true,
    });
  } else {
    const puppeteer = (await import("puppeteer")).default;
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    }) as unknown as Browser;
  }
  
  console.log(`[PDF-BROWSER] Browser launched in ${Date.now() - startTime}ms`);
  return browser;
}

/**
 * Schedule browser close after idle timeout.
 * Called after PDF generation completes.
 */
export function scheduleBrowserClose(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
  
  idleTimer = setTimeout(async () => {
    if (browserInstance && browserInstance.connected) {
      console.log("[PDF-BROWSER] Closing idle browser");
      try {
        await browserInstance.close();
      } catch (e) {
        console.warn("[PDF-BROWSER] Error closing browser:", e);
      }
      browserInstance = null;
    }
  }, IDLE_TIMEOUT_MS);
}

/**
 * Force close the browser (for cleanup).
 */
export async function closeBrowser(): Promise<void> {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (e) {
      // Ignore
    }
    browserInstance = null;
  }
}

/**
 * Legacy function - kept for backward compatibility.
 */
export async function launchBrowser(): Promise<Browser> {
  return getBrowser();
}

/**
 * Renders `html` to a PDF buffer (A4, with 18 mm margins).
 * Uses pooled browser instance for fast PDF generation.
 * 
 * @param html - HTML content to render
 * @param options - Optional PDF options
 */
export async function htmlToPdf(
  html: string,
  options?: {
    format?: "A4" | "Letter";
    landscape?: boolean;
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
  }
): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | null = null;
  
  try {
    page = await browser.newPage();
    
    // Set shorter timeouts for faster failure
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    
    // Use domcontentloaded instead of networkidle0 for faster rendering
    // (networkidle0 waits for ALL network requests to complete - very slow)
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    
    // Small delay for CSS to apply
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const pdfBuffer = await page.pdf({
      format: options?.format || "A4",
      printBackground: true,
      landscape: options?.landscape || false,
      margin: options?.margin || { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    // Close just the page, not the browser
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Page might already be closed
      }
    }
    // Schedule browser close after idle timeout
    scheduleBrowserClose();
  }
}

/**
 * Fast PDF generation - creates PDF from HTML without waiting for network resources.
 * Best for HTML that doesn't rely on external resources (fonts, images).
 */
export async function htmlToPdfFast(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | null = null;
  
  try {
    page = await browser.newPage();
    page.setDefaultTimeout(10000);
    
    // Load HTML without waiting for anything
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    if (page) {
      try { await page.close(); } catch {}
    }
    scheduleBrowserClose();
  }
}
