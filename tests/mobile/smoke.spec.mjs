import { expect, test } from '@playwright/test';

function filterKnownRuntimeNoise(messages) {
  return messages.filter((message) => {
    if (!message) return false;
    return !message.includes('/identitytoolkit.googleapis.com/v1/accounts:signUp?key=');
  });
}

async function gotoApp(page, path) {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction(() => {
        const body = document.body;
        if (!body) return false;
        const text = body.innerText?.trim() ?? '';
        const hasInteractiveUI = body.querySelector('button, [role="button"], [data-testid], canvas');
        return text.length > 0 || Boolean(hasInteractiveUI);
      }, { timeout: 15000 });
      return;
    } catch (error) {
      if (attempt === 1) throw error;
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }
}

async function attachWorldMiniKitStub(page) {
  await page.addInitScript(() => {
    const miniKitMock = {
      isInstalled: () => true,
      commandsAsync: {
        walletAuth: async ({ nonce, statement }) => ({
          status: 'success',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          nonce,
          statement,
          signature: '0xmock-signature',
          message: `Mock wallet auth for ${nonce}`,
        }),
        pay: async ({ reference, to, amount, token, description }) => ({
          status: 'success',
          reference,
          to,
          amount,
          token,
          description,
          transactionHash: '0xmock-payment-hash',
        }),
      },
      commands: {},
    };

    window.MiniKit = miniKitMock;
    window.miniKit = miniKitMock;
    window.worldApp = { miniKit: miniKitMock, MiniKit: miniKitMock };
    window.WorldApp = { miniKit: miniKitMock, MiniKit: miniKitMock };
  });
}

async function ensureSignedIn(page) {
  await attachWorldMiniKitStub(page);
  await gotoApp(page, '/sign-in');
  const signInButton = page.getByTestId('sign-in-button');
  await expect(signInButton).toBeVisible({ timeout: 60_000 });
  await signInButton.click();
  await expect(page).toHaveURL(/\/(index|$)/, { timeout: 60_000 });
}

async function scrollAllScrollableContainersToBottom(page) {
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('*'));
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.scrollHeight > node.clientHeight + 20) {
        node.scrollTop = node.scrollHeight;
      }
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
}

test('opens the garden shape selector and applies a shape without runtime errors', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await ensureSignedIn(page);
  await gotoApp(page, '/garden');

  const shapeButton = page.getByTestId('garden-shape-button');
  await expect(shapeButton).toBeVisible({ timeout: 60_000 });
  await shapeButton.click();

  await expect(page.getByRole('heading', { name: /Not Awakened/ })).toBeVisible();
  await expect(page.getByText(/Orb must be awakened to change shape/)).toBeVisible();
  await page.getByText(/^OK$/).click();

  await expect(shapeButton).toBeVisible();

  await page.screenshot({
    path: 'test-results/mobile-garden-shape-selector-iphone15pro.png',
    fullPage: true,
  });

  expect(
    filterKnownRuntimeNoise(pageErrors),
    `Runtime page errors detected:\n${pageErrors.join('\n')}`
  ).toEqual([]);
  expect(
    consoleErrors.filter((message) => !message.includes('%cDownload the React DevTools')),
    `Console errors detected:\n${consoleErrors.join('\n')}`
  ).toEqual([]);
});

test('filters the meditation library by category on mobile without runtime errors', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await ensureSignedIn(page);
  await gotoApp(page, '/meditate');

  const spiritualCategory = page.getByTestId('category-spiritual');
  await expect(spiritualCategory).toBeVisible({ timeout: 60_000 });
  await spiritualCategory.click();

  await expect(page.getByTestId('meditation-spiritual-awakening')).toBeVisible();
  await expect(page.getByTestId('meditation-morning-mindfulness')).toHaveCount(0);

  await page.screenshot({
    path: 'test-results/mobile-meditate-category-iphone15pro.png',
    fullPage: true,
  });

  expect(
    filterKnownRuntimeNoise(pageErrors),
    `Runtime page errors detected:\n${pageErrors.join('\n')}`
  ).toEqual([]);
  expect(
    consoleErrors.filter((message) => !message.includes('%cDownload the React DevTools')),
    `Console errors detected:\n${consoleErrors.join('\n')}`
  ).toEqual([]);
});

test('signs in with wallet auth and reaches the VIP upgrade flow', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await attachWorldMiniKitStub(page);
  await gotoApp(page, '/sign-in');

  const signInButton = page.getByTestId('sign-in-button');
  await expect(signInButton).toBeVisible({ timeout: 60_000 });
  await signInButton.click();

  await expect(page).toHaveURL(/\/(index|$)/, { timeout: 60_000 });

  await gotoApp(page, '/profile');
  const vipButton = page.getByTestId('vip-upgrade-button');

  await scrollAllScrollableContainersToBottom(page);
  await expect(page.getByText(/VIP 30-Day Pass/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Instant unlocks/)).toBeVisible({ timeout: 30_000 });
  await expect(vipButton).toBeVisible({ timeout: 30_000 });

  await page.screenshot({
    path: 'test-results/mobile-world-signin-vip-iphone15pro.png',
    fullPage: true,
  });

  expect(
    filterKnownRuntimeNoise(pageErrors),
    `Runtime page errors detected:\n${pageErrors.join('\n')}`
  ).toEqual([]);
  expect(
    consoleErrors.filter((message) => !message.includes('%cDownload the React DevTools')),
    `Console errors detected:\n${consoleErrors.join('\n')}`
  ).toEqual([]);
});

test('opens notification settings and shows the permission state card without runtime errors', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await ensureSignedIn(page);
  await gotoApp(page, '/settings/notifications');

  await expect(page.getByText(/Notifications/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Push reminders are not available on web/)).toBeVisible();
  await expect(page.getByText(/Use the mobile app to receive local meditation reminders/)).toBeVisible();
  await expect(page.getByTestId('daily-reminder-switch')).toBeVisible();

  await page.screenshot({
    path: 'test-results/mobile-notifications-permission-iphone15pro.png',
    fullPage: true,
  });

  expect(
    filterKnownRuntimeNoise(pageErrors),
    `Runtime page errors detected:\n${pageErrors.join('\n')}`
  ).toEqual([]);
  expect(
    consoleErrors.filter((message) => !message.includes('%cDownload the React DevTools')),
    `Console errors detected:\n${consoleErrors.join('\n')}`
  ).toEqual([]);
});

test('locks ambient sounds inside a meditation session for free users', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await ensureSignedIn(page);
  await gotoApp(page, '/meditation/morning-mindfulness');

  const soundButton = page.getByTestId('sound-picker-button');
  await expect(soundButton).toBeVisible({ timeout: 60_000 });
  await soundButton.click();

  await expect(page.getByText(/免費版只開放 5 條環境音|Free tier unlocks only 5 ambient sounds/)).toBeVisible();
  await expect(page.getByText('VIP').first()).toBeVisible();

  await page.screenshot({
    path: 'test-results/mobile-meditation-ambient-lock-iphone15pro.png',
    fullPage: true,
  });

  expect(
    filterKnownRuntimeNoise(pageErrors),
    `Runtime page errors detected:\n${pageErrors.join('\n')}`
  ).toEqual([]);
  expect(
    consoleErrors.filter((message) => !message.includes('%cDownload the React DevTools')),
    `Console errors detected:\n${consoleErrors.join('\n')}`
  ).toEqual([]);
});

test('locks ambient sounds inside the garden for free users', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await ensureSignedIn(page);
  await gotoApp(page, '/garden');

  const soundButton = page.getByTestId('garden-sound-button');
  await expect(soundButton).toBeVisible({ timeout: 60_000 });
  await soundButton.click();

  await expect(page.getByText(/免費版只開放 5 條環境音|Free tier unlocks only 5 ambient sounds/)).toBeVisible();
  await expect(page.getByText('VIP').first()).toBeVisible();

  await page.screenshot({
    path: 'test-results/mobile-garden-ambient-lock-iphone15pro.png',
    fullPage: true,
  });

  expect(
    filterKnownRuntimeNoise(pageErrors),
    `Runtime page errors detected:\n${pageErrors.join('\n')}`
  ).toEqual([]);
  expect(
    consoleErrors.filter((message) => !message.includes('%cDownload the React DevTools')),
    `Console errors detected:\n${consoleErrors.join('\n')}`
  ).toEqual([]);
});
