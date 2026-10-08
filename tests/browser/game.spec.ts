import { test, expect } from '@playwright/test';
test('solo renders the forest, moves, opens inventory and saves', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Panda');
  await page.screenshot({ path: 'test-results/title.png' });
  await page.getByRole('button', { name: 'Begin adventure' }).click();
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#game canvas')).toBeVisible();
  const x = Number(await page.locator('#hud').getAttribute('data-x'));
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyD');
  await expect
    .poll(async () => Number(await page.locator('#hud').getAttribute('data-x')))
    .toBeGreaterThan(x + 50);
  await page.keyboard.press('KeyI');
  await expect(
    page.getByRole('heading', { name: 'Your satchel' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save progress' }).click();
  await expect
    .poll(() => page.evaluate(() => !!localStorage.getItem('panda-save')))
    .toBe(true);
  await page.getByRole('button', { name: 'Resume adventure' }).click();
  await page.screenshot({ path: 'test-results/solo-forest.png' });
  expect(errors).toEqual([]);
});
test('two browser windows join one room and observe shared movement and combat', async ({
  browser,
}) => {
  const ca = await browser.newContext(),
    cb = await browser.newContext();
  const a = await ca.newPage(),
    b = await cb.newPage();
  const errors: string[] = [];
  a.on('pageerror', (e) => errors.push(e.message));
  b.on('pageerror', (e) => errors.push(e.message));
  try {
    await a.goto('/');
    await a.getByRole('button', { name: 'Create co-op room' }).click();
    await expect(a.locator('#room-label')).toHaveText(/^[A-Z2-9]{5}$/);
    const code = (await a.locator('#room-label').textContent())!;
    await b.goto(`/?room=${code}`);
    await b.getByRole('button', { name: 'Join a friend' }).click();
    await expect(b.locator('#hud')).toHaveAttribute('data-players', '2');
    await expect(a.locator('#hud')).toHaveAttribute('data-players', '2');
    await expect(b.locator('#hero-name')).toHaveText('Ape');
    const x = Number(await a.locator('#hud').getAttribute('data-x'));
    const hp = Number(await a.locator('#hud').getAttribute('data-enemy-hp'));
    await a.keyboard.down('KeyD');
    await a.keyboard.down('KeyW');
    await a.waitForTimeout(850);
    await a.keyboard.up('KeyD');
    await a.keyboard.up('KeyW');
    await expect
      .poll(async () => Number(await a.locator('#hud').getAttribute('data-x')))
      .toBeGreaterThan(x + 70);
    await expect
      .poll(async () =>
        Number(await b.locator('#hud').getAttribute('data-remote-x')),
      )
      .toBeGreaterThan(x + 70);
    await expect(a.locator('#hud')).toHaveAttribute(
      'data-rendered-players',
      '2',
    );
    await expect(b.locator('#hud')).toHaveAttribute(
      'data-rendered-players',
      '2',
    );
    const bx = Number(await b.locator('#hud').getAttribute('data-x'));
    await b.keyboard.down('KeyD');
    await b.waitForTimeout(400);
    await b.keyboard.up('KeyD');
    await expect
      .poll(async () =>
        Number(await a.locator('#hud').getAttribute('data-remote-x')),
      )
      .toBeGreaterThan(bx + 40);
    // Each canvas visibly owns both player sprites; both clients receive server ticks.
    await expect
      .poll(async () =>
        Number(await b.locator('#hud').getAttribute('data-tick')),
      )
      .toBeGreaterThan(20);
    await a.keyboard.down('Space');
    await a.keyboard.down('KeyD');
    await a.waitForTimeout(650);
    await a.keyboard.up('KeyD');
    await a.keyboard.up('Space');
    await a.keyboard.down('KeyQ');
    await expect
      .poll(
        async () =>
          Number(await b.locator('#hud').getAttribute('data-enemy-hp')),
        { timeout: 12000 },
      )
      .toBeLessThan(hp);
    await a.keyboard.up('KeyQ');
    await expect
      .poll(async () =>
        Number(await a.locator('#hud').getAttribute('data-enemy-hp')),
      )
      .toBeLessThan(hp);
    await a.screenshot({ path: 'test-results/coop-panda.png' });
    await b.screenshot({ path: 'test-results/coop-ape.png' });
    await expect
      .poll(() => b.evaluate(() => !!sessionStorage.getItem('panda-session')))
      .toBe(true);
    await b.reload();
    await b
      .getByRole('button', { name: 'Reconnect to last co-op room' })
      .click();
    await expect(b.locator('#hero-name')).toHaveText('Ape');
    await expect(b.locator('#hud')).toHaveAttribute('data-players', '2');
    expect(errors).toEqual([]);
  } finally {
    await ca.close();
    await cb.close();
  }
});

test('transport loss restores the same session and returning to title cancels pending reconnect', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWebSocket = window.WebSocket;
    window.WebSocket = class extends NativeWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        (window as unknown as { testSocket: WebSocket }).testSocket = this;
      }
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create co-op room' }).click();
  await expect(page.locator('#connection-status')).toHaveText(
    'CO-OP · CONNECTED',
  );
  const playerId = await page.locator('#hud').getAttribute('data-player-id');
  await page.evaluate(() =>
    (window as unknown as { testSocket: WebSocket }).testSocket.close(),
  );
  await expect(page.locator('#connection-status')).toHaveText(
    'CO-OP · RECONNECTING',
  );
  await expect(page.locator('#connection-status')).toHaveText(
    'CO-OP · CONNECTED',
    { timeout: 6000 },
  );
  await expect(page.locator('#hud')).toHaveAttribute(
    'data-player-id',
    playerId!,
  );
  await page.evaluate(() =>
    (window as unknown as { testSocket: WebSocket }).testSocket.close(),
  );
  await expect(page.locator('#connection-status')).toHaveText(
    'CO-OP · RECONNECTING',
  );
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Return to title' }).click();
  await page.waitForTimeout(1800);
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#hud')).toBeHidden();
});
