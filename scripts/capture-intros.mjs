// Capture each game's intro screen and check whether the primary CTA
// (Start / Deploy / etc.) is visible without scrolling.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:5173';
const OUT_DIR = 'scripts/portrait-shots';

const targets = [
  { name: 'intro-carbon-crush', path: '/games/carbon-crush', cta: /Start Playing/i },
  { name: 'intro-recycle-rush', path: '/games/recycle-rush', cta: /Start Sorting/i },
  { name: 'intro-green-defence', path: '/games/green-defence', cta: /Deploy Defences/i },
  { name: 'intro-climate-ninja', path: '/games/climate-ninja', cta: /Start Mission/i },
];

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const context = await browser.newContext({
  viewport: { width: 390, height: 680 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

for (const t of targets) {
  const page = await context.newPage();
  await page.goto(BASE + t.path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  // Visible portion only (no scroll)
  await page.screenshot({ path: `${OUT_DIR}/${t.name}.png`, fullPage: false });

  // Also check whether the CTA is in the initial viewport
  const ctaInfo = await page.evaluate((label) => {
    const buttons = [...document.querySelectorAll('button, [role="button"]')];
    const cta = buttons.find((b) => new RegExp(label, 'i').test(b.textContent || ''));
    if (!cta) return { found: false };
    const r = cta.getBoundingClientRect();
    return {
      found: true,
      top: r.top,
      bottom: r.bottom,
      visible: r.top >= 0 && r.bottom <= window.innerHeight,
      viewportH: window.innerHeight,
    };
  }, t.cta.source);
  console.log(t.name, JSON.stringify(ctaInfo));
  await page.close();
}

await browser.close();
