const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('../node_modules/playwright');

const ROOT = path.resolve(__dirname, '..');
const GARDEN_PATH = path.join(ROOT, 'app', '(tabs)', 'garden.tsx');
const OUT_DIR = '/tmp/shape-audit';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4100';

const source = fs.readFileSync(GARDEN_PATH, 'utf8');
const shapesSection = source.split('const shapes:')[1].split('type ShapeDetail')[0];
const allNames = [...shapesSection.matchAll(/name:\s*(?:'([^']+)'|"([^"]+)")/g)]
  .map((match) => match[1] || match[2])
  .filter(Boolean);
const filterNames = (process.env.SHAPES || '')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const names = filterNames.length > 0 ? allNames.filter((name) => filterNames.includes(name)) : allNames;

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

async function captureShapes() {
  const browser = await chromium
    .launch({ headless: false, channel: 'chrome' })
    .catch(() => chromium.launch({ headless: false }));
  const context = await browser.newContext(devices['iPhone 15 Pro']);
  const page = await context.newPage();

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.waitForTimeout(5000);
  await page.getByText('Garden').first().click().catch(() => {});
  await page.waitForTimeout(2500);

  for (const name of names) {
    await page.locator('[data-testid="garden-shape-button"]').click().catch(() => {});
    await page.waitForTimeout(900);

    const row = page.getByText(name).first();
    await row.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    await row.click().catch(() => {});
    await page.waitForTimeout(1400);

    const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await page.screenshot({
      path: path.join(OUT_DIR, `${safe}.png`),
      clip: { x: 16, y: 120, width: 440, height: 470 },
    }).catch(async () => {
      await page.screenshot({
        path: path.join(OUT_DIR, `${safe}.png`),
        fullPage: true,
      });
    });
  }

  console.log(OUT_DIR);
  await browser.close();
}

captureShapes().catch((error) => {
  console.error(error);
  process.exit(1);
});
