import { defineConfig, devices } from '@playwright/test';

const PORT = 4110;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/mobile',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run world:mock',
      url: 'http://127.0.0.1:8787/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: `CI=1 EXPO_NO_INTERACTIVE=1 EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 EXPO_PUBLIC_LOCAL_DEV=true EXPO_PUBLIC_DEV_FULL_MOCK=false npx expo start --web --clear --port ${PORT}`,
      url: baseURL,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'iphone-15-pro',
      use: {
        ...devices['iPhone 15 Pro'],
      },
    },
  ],
});
