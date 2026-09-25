---
name: run-ecogames
description: Launch EcoGames locally and drive it in a real browser to see or screenshot a change. Use when asked to run, preview, screenshot or visually check the app.
---

# Run and look at EcoGames

1. Build and serve the production bundle (closest to what ships):

   ```bash
   npm run build && npx vite preview --port 4173 --strictPort
   ```

   Run it in the background. For live reload while editing, use `npm run dev` (port 5173).

2. Drive it with Playwright from a throwaway script in the project root, so
   `@playwright/test` resolves. Delete the script afterwards.

   ```js
   import { chromium, devices } from '@playwright/test';
   const browser = await chromium.launch({
     executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
   });
   const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
   // Mobile: await browser.newContext({ ...devices['Pixel 7'] })
   // Dark theme: newContext({ colorScheme: 'dark' })
   page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
   await page.goto('http://localhost:4173/#/play/eco-memory');
   await page.screenshot({ path: 'shot.png', fullPage: true });
   await browser.close();
   ```

3. Routes: `#/` is the hub, and `#/play/<game-id>` opens a game (ids are in
   `src/games/registry.ts`).

4. Tips:
   - Waste Sorter boots Phaser asynchronously. Wait for the
     `Start sorting` button to be enabled before clicking it.
   - Memory cards carry `data-concept`, so a script can solve the board deterministically.
   - Always check for `pageerror` output, and view the screenshots before reporting done.
