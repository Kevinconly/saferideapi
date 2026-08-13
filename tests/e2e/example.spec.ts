import { test, expect } from '@playwright/test';

test('health endpoint returns OK', async ({ request }) => {
  const res = await request.get(
    process.env.E2E_BASE_URL || 'http://localhost:3000/api/v1/health/live',
  );
  expect(res.ok()).toBeTruthy();
});
