import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test('health endpoint returns OK', async ({ request }) => {
  let response: { status: number; body: string } | null = null;

  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const res = await request.get(`${BASE_URL}/api/v1/health/live`);
      response = { status: res.status(), body: await res.text() };
      if (res.ok()) break;
    } catch {
      response = null;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  expect(response).not.toBeNull();
  expect(response).toMatchObject({ status: 200 });
});
