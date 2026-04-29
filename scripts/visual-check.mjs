// Visual smoke test: boot the dev server, navigate to each route at a
// matrix of viewport sizes, and dump screenshots to /tmp/eg-shots so the
// agent can eyeball whether things fit before committing.
//
// Usage: node scripts/visual-check.mjs [outDir]
// Requires: a running vite dev server on $DEV_URL (default http://localhost:5173).
// Set CHROMIUM_PATH to override the chromium binary.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEV_URL = process.env.DEV_URL || 'http://localhost:5173';
const outDir = resolve(process.argv[2] || '/tmp/eg-shots');

// Aspect ratios to cover: 16:9 wide, 16:10, 4:3, square, portrait, ultra-wide.
const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1180x820', width: 1180, height: 820 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '2560x1080', width: 2560, height: 1080 },
  { name: '1024x1024', width: 1024, height: 1024 },
  { name: '768x1024', width: 768, height: 1024 },
];

// Each route can declare a list of post-load steps to drive into a deeper
// state (e.g. through an intro screen into the live gameplay).
const ROUTES = [
  { name: 'landing', path: '/' },
  {
    name: 'climate-ninja-intro', path: '/games/climate-ninja',
    steps: [],
  },
  {
    name: 'climate-ninja-modeselect', path: '/games/climate-ninja',
    steps: [
      { kind: 'click', text: /Start Mission/i },
    ],
  },
  {
    name: 'carbon-crush-intro', path: '/games/carbon-crush',
    steps: [],
  },
  {
    name: 'carbon-crush-playing', path: '/games/carbon-crush',
    steps: [
      { kind: 'click', text: /Start Playing/i },
    ],
  },
  {
    name: 'recycle-rush-intro', path: '/games/recycle-rush',
    steps: [],
  },
  {
    name: 'recycle-rush-playing', path: '/games/recycle-rush',
    steps: [
      { kind: 'click', text: /Start Sorting/i },
    ],
  },
  {
    name: 'eco-memory-modeselect', path: '/games/eco-memory',
    steps: [],
  },
  {
    name: 'eco-memory-solo-playing', path: '/games/eco-memory',
    steps: [
      // Solo card has a "Choose →" button; click the first one.
      { kind: 'clickNth', text: /Choose/i, nth: 0 },
    ],
  },
  {
    name: 'green-defence-intro', path: '/games/green-defence',
    steps: [],
  },
  {
    name: 'green-defence-playing', path: '/games/green-defence',
    steps: [
      { kind: 'click', text: /Deploy Defences/i },
    ],
  },
  {
    name: 'climate-2048-modeselect', path: '/games/climate-2048',
    steps: [],
  },
  {
    name: 'climate-2048-solo-playing', path: '/games/climate-2048',
    steps: [
      { kind: 'clickNth', text: /Choose/i, nth: 0 },
    ],
  },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const issues = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const url = `${DEV_URL}${route.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (err) {
      issues.push({ vp: vp.name, route: route.name, type: 'nav', err: err.message });
      continue;
    }
    await page.waitForTimeout(400);

    // Drive through any pre-screenshot steps (e.g. press the start button).
    if (route.steps?.length) {
      let stepError = null;
      for (const s of route.steps) {
        try {
          if (s.kind === 'click') {
            await page.getByText(s.text).first().click({ timeout: 4000 });
          } else if (s.kind === 'clickNth') {
            const els = page.getByText(s.text);
            await els.nth(s.nth || 0).click({ timeout: 4000 });
          }
          await page.waitForTimeout(700);
        } catch (err) {
          stepError = err.message;
          break;
        }
      }
      if (stepError) {
        issues.push({ vp: vp.name, route: route.name, type: 'step', err: stepError });
        // still take a screenshot so we can see where it got stuck
      }
    }

    // Document-level overflow detection.
    const scrollState = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      clientW: document.documentElement.clientWidth,
      clientH: document.documentElement.clientHeight,
    }));
    if (scrollState.scrollW > scrollState.clientW + 1 || scrollState.scrollH > scrollState.clientH + 1) {
      issues.push({ vp: vp.name, route: route.name, type: 'overflow', detail: scrollState });
    }

    const file = `${outDir}/${vp.name}__${route.name}.png`;
    await page.screenshot({ path: file, fullPage: false });
  }
  await ctx.close();
}

await browser.close();

console.log(`Wrote screenshots to ${outDir}`);
if (issues.length) {
  console.log(`\nFound ${issues.length} issue(s):`);
  for (const i of issues) console.log(' -', JSON.stringify(i));
  process.exitCode = 1;
} else {
  console.log('No overflow/nav/step issues detected.');
}
