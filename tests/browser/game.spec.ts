import { test, expect } from '@playwright/test';
test('curated forest art loads, animates and keeps the full game playable', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin adventure' }).click();
  const hud = page.locator('#hud');
  await expect(hud).toHaveAttribute('data-vendor-art', 'ready');
  await expect(hud).toHaveAttribute(
    'data-landscape-style',
    'illustrated-forest-v2',
  );
  await expect(hud).toHaveAttribute('data-hero-style', 'concept-64px');
  await expect
    .poll(async () => Number(await hud.getAttribute('data-vendor-trees')))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await hud.getAttribute('data-vendor-enemies')))
    .toBeGreaterThan(0);
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/environment-forest-v2.png' });
  expect(errors).toEqual([]);
});

test('Panda and Ape display equipped weapons while attacking', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin adventure' }).click();
  await expect(page.locator('#hud')).toHaveAttribute(
    'data-weapon-visible',
    'true',
  );
  await page.keyboard.down('Space');
  try {
    await expect(page.locator('#hud')).toHaveAttribute(
      'data-weapon-active',
      'true',
      { timeout: 8000 },
    );
  } finally {
    await page.keyboard.up('Space');
  }
  await page.screenshot({ path: 'test-results/panda-weapon.png' });

  // New browser context starts with a different hero and empty local progress.
  await page.goto('/');
  await page.locator('[data-hero="ape"]').click();
  await page.getByRole('button', { name: 'Begin adventure' }).click();
  await expect(page.locator('#hud')).toHaveAttribute(
    'data-weapon-visible',
    'true',
  );
  await page.keyboard.down('Space');
  try {
    await expect(page.locator('#hud')).toHaveAttribute(
      'data-weapon-active',
      'true',
      { timeout: 8000 },
    );
  } finally {
    await page.keyboard.up('Space');
  }
  await page.screenshot({ path: 'test-results/ape-weapon.png' });
  expect(errors).toEqual([]);
});

test('camera zoom can be adjusted and survives a browser reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin adventure' }).click();
  await expect
    .poll(async () =>
      Number(await page.locator('#hud').getAttribute('data-camera-zoom')),
    )
    .toBeGreaterThanOrEqual(1.49);
  await page.getByRole('button', { name: 'Settings' }).click();
  const zoomSlider = page.locator('#camera-zoom');
  await zoomSlider.focus();
  for (let i = 0; i < 4; i++) await zoomSlider.press('ArrowRight');
  await expect(page.locator('#zoom-value')).toHaveText('170%');
  await expect
    .poll(async () =>
      Number(await page.locator('#hud').getAttribute('data-camera-zoom')),
    )
    .toBeGreaterThanOrEqual(1.69);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Begin adventure' }).click();
  await expect
    .poll(async () =>
      Number(await page.locator('#hud').getAttribute('data-camera-zoom')),
    )
    .toBeGreaterThanOrEqual(1.69);
});

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
  if (process.env.CI)
    expect(
      await page.evaluate(
        () =>
          document
            .querySelector<HTMLCanvasElement>('#game canvas')!
            .getContext('2d') !== null,
      ),
    ).toBe(true);
  await expect(page.locator('#hud')).toHaveAttribute('data-x', /^\d/);
  const x = Number(await page.locator('#hud').getAttribute('data-x'));
  await page.keyboard.down('KeyD');
  try {
    await expect
      .poll(
        async () => Number(await page.locator('#hud').getAttribute('data-x')),
        { timeout: 10000 },
      )
      .toBeGreaterThan(x + 50);
  } finally {
    await page.keyboard.up('KeyD');
  }
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
    try {
      await expect
        .poll(
          async () =>
            Number(await b.locator('#hud').getAttribute('data-remote-x')),
          { timeout: 10000 },
        )
        .toBeGreaterThan(x + 85);
    } finally {
      await a.keyboard.up('KeyD');
      await a.keyboard.up('KeyW');
    }
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
    try {
      await expect
        .poll(
          async () =>
            Number(await a.locator('#hud').getAttribute('data-remote-x')),
          { timeout: 10000 },
        )
        .toBeGreaterThan(bx + 45);
    } finally {
      await b.keyboard.up('KeyD');
    }
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
    await b.evaluate(() => localStorage.removeItem('panda-character-ape'));
    await b.reload();
    await expect
      .poll(() =>
        b.evaluate(
          () =>
            localStorage.getItem('panda-character-ape') ===
            JSON.parse(sessionStorage.getItem('panda-session') ?? 'null')
              ?.token,
        ),
      )
      .toBe(true);
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
  await expect(page.locator('#hud')).toHaveAttribute('data-player-id', /.+/);
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

test('a downed online hero sends revive intent and returns to camp using a potion', async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.goto('/');
  await page.locator('[data-hero="ape"]').click();
  await page.getByRole('button', { name: 'Create co-op room' }).click();
  await expect(page.locator('#hero-name')).toHaveText('Ape');
  await expect(page.locator('#hud')).toHaveAttribute('data-players', '1');
  const start = Number(await page.locator('#hud').getAttribute('data-x'));
  await page.keyboard.down('KeyD');
  await page.keyboard.down('KeyW');
  try {
    await expect
      .poll(
        async () => Number(await page.locator('#hud').getAttribute('data-x')),
        { timeout: 10000 },
      )
      .toBeGreaterThan(start + 90);
  } finally {
    await page.keyboard.up('KeyD');
    await page.keyboard.up('KeyW');
  }
  await expect(page.locator('#health-text')).toHaveText('0 / 110', {
    timeout: 25000,
  });
  await page.keyboard.down('KeyR');
  await page.waitForTimeout(200);
  await page.keyboard.up('KeyR');
  await expect
    .poll(
      async () =>
        parseInt((await page.locator('#health-text').textContent()) ?? '0'),
      { timeout: 5000 },
    )
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await page.locator('#hud').getAttribute('data-x')))
    .toBe(430);
  await expect(page.locator('#potions')).not.toHaveText('Potion ×3');
});

test('legacy solo progression migrates, points can be allocated and survive a reload', async ({
  page,
}) => {
  const { createWorld, createPlayer } = await import('@panda/shared');
  const world = createWorld();
  const p = createPlayer('local', 'panda');
  p.level = 2;
  p.maxHp = 180;
  p.hp = 180;
  p.crystals = 7;
  const legacy: Record<string, unknown> = { ...world, players: [p] };
  delete legacy.respawn;
  delete legacy.instanceId;
  await page.addInitScript((save) => {
    if (!localStorage.getItem('panda-save'))
      localStorage.setItem('panda-save', save);
  }, JSON.stringify(legacy));
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Continue saved solo adventure' })
    .click();
  await page.keyboard.press('KeyI');
  await expect(page.locator('#modal-content')).toContainText(
    '3 attribute points',
  );
  await page.getByRole('button', { name: '+ vitality', exact: true }).click();
  await expect(page.locator('#modal-content')).toContainText('HP 192');
  await expect(page.locator('#modal-content')).toContainText(
    '2 attribute points',
  );
  await expect
    .poll(() =>
      page.evaluate(() => !!localStorage.getItem('panda-save-v1-backup')),
    )
    .toBe(true);
  await page.reload();
  await page
    .getByRole('button', { name: 'Continue saved solo adventure' })
    .click();
  await page.keyboard.press('KeyI');
  await expect(page.locator('#modal-content')).toContainText(
    '2 attribute points',
  );
  await expect(page.locator('#modal-content')).toContainText('HP 192');
});

test('forge spends materials, upgrades combat stats and retains the weapon in a new adventure', async ({
  page,
}) => {
  const { createWorld, createPlayer, grant, WORLD } =
    await import('@panda/shared');
  const world = createWorld();
  const p = createPlayer('local', 'panda');
  p.x = WORLD.smith.x;
  p.y = WORLD.smith.y;
  grant(p, 'coin', 100);
  grant(p, 'leather', 8);
  grant(p, 'crystal', 5);
  world.players.push(p);
  await page.addInitScript(
    (save) => {
      if (!localStorage.getItem('panda-save'))
        localStorage.setItem('panda-save', save);
    },
    JSON.stringify({ version: 2, world }),
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Continue saved solo adventure' })
    .click();
  await page.keyboard.press('KeyE');
  await expect(
    page.getByRole('button', { name: 'Upgrade weapon' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Upgrade weapon' }).click();
  await expect(page.locator('#modal-content')).toContainText(
    'Oakguard sword +1',
  );
  await expect(page.locator('#modal-content')).toContainText('Damage 29');
  await page.getByRole('button', { name: 'Upgrade weapon' }).click();
  await expect(page.locator('#modal-content')).toContainText(
    'Oakguard sword +2',
  );
  await page.getByRole('button', { name: 'Upgrade weapon' }).click();
  await expect(page.locator('#rpg-status')).toHaveText(
    'Not enough materials or coins.',
  );
  await page.waitForTimeout(250);
  await expect(page.locator('#rpg-status')).toHaveText(
    'Not enough materials or coins.',
  );
  await page.screenshot({ path: 'test-results/rpg-forge.png' });
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Return to title' }).click();
  await page.getByRole('button', { name: 'Begin adventure' }).click();
  await page.keyboard.press('KeyI');
  await expect(page.locator('#modal-content')).toContainText(
    'Oakguard sword +2',
  );
  await expect(page.locator('#modal-content')).toContainText('Damage 33');
});
