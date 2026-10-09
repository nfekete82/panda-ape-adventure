import { test, expect, type Page } from '@playwright/test';
import {
  createWorld,
  createPlayer,
  FARM,
  WORLD,
  cellPoint,
} from '@panda/shared';

async function clickWorld(page: Page, x: number, y: number) {
  const hud = page.locator('#hud');
  const box = await page.locator('#game canvas').boundingBox();
  if (!box) throw Error('Missing game canvas');
  let previous: { x: number; y: number } | undefined;
  await expect
    .poll(
      async () => {
        const current = {
          x: Number(await hud.getAttribute('data-camera-x')),
          y: Number(await hud.getAttribute('data-camera-y')),
        };
        const drift = previous
          ? Math.hypot(current.x - previous.x, current.y - previous.y)
          : Infinity;
        previous = current;
        const zoom = Number(await hud.getAttribute('data-camera-zoom'));
        const halfWidth = box.width / (2 * zoom);
        const halfHeight = box.height / (2 * zoom);
        const expectedX = Math.max(
          halfWidth,
          Math.min(
            WORLD.width - halfWidth,
            Number(await hud.getAttribute('data-x')),
          ),
        );
        const expectedY = Math.max(
          halfHeight,
          Math.min(
            WORLD.height - halfHeight,
            Number(await hud.getAttribute('data-y')),
          ),
        );
        // Title-to-game telemetry can repeat before the camera starts following.
        // Require it to reach the player's clamped position as well as settle.
        return Math.max(
          drift,
          Math.hypot(current.x - expectedX, current.y - expectedY),
        );
      },
      { intervals: [100], timeout: 5000 },
    )
    .toBeLessThan(0.1);
  // Use the actual clamped camera midpoint. Near the bottom of the map its
  // y coordinate is 1140, even when the player stands at y=1160.
  const cx = Number(await hud.getAttribute('data-camera-x'));
  const cy = Number(await hud.getAttribute('data-camera-y'));
  const zoom = Number(await hud.getAttribute('data-camera-zoom'));
  await page.mouse.click(
    box.x + box.width / 2 + (x - cx) * zoom,
    box.y + box.height / 2 + (y - cy) * zoom,
  );
}

for (const hero of ['panda', 'ape'] as const) {
  test(`${hero} click-to-move reaches the farm approach and keyboard input cancels it`, async ({
    page,
  }) => {
    const world = createWorld(),
      player = createPlayer('local', hero);
    Object.assign(player, { x: 520, y: 1160 });
    world.players = [player];
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((value) => {
      if (!localStorage.getItem('panda-save'))
        localStorage.setItem('panda-save', value);
    }, JSON.stringify(world));
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Continue saved solo adventure' })
      .click();
    await expect(page.locator('#hud')).toHaveAttribute('data-x', '520');
    await clickWorld(page, 600, 1160);
    await expect
      .poll(async () => {
        const hud = page.locator('#hud');
        return Math.hypot(
          Number(await hud.getAttribute('data-x')) - 600,
          Number(await hud.getAttribute('data-y')) - 1160,
        );
      })
      .toBeLessThan(16);
    await clickWorld(page, 450, 1160);
    await page.keyboard.down('KeyD');
    try {
      await expect
        .poll(async () =>
          Number(await page.locator('#hud').getAttribute('data-x')),
        )
        .toBeGreaterThan(620);
    } finally {
      await page.keyboard.up('KeyD');
    }
    // HUD telemetry refreshes every 100 ms; let the key-up frame publish.
    await page.waitForTimeout(200);
    const stopped = Number(await page.locator('#hud').getAttribute('data-x'));
    await page.waitForTimeout(250);
    expect(
      Math.abs(
        Number(await page.locator('#hud').getAttribute('data-x')) - stopped,
      ),
    ).toBeLessThan(4);
    expect(errors).toEqual([]);
  });
}

test('all 32 occupied cells render and survive a legacy save reload', async ({
  page,
}) => {
  const world = createWorld(),
    player = createPlayer('local', 'ape');
  Object.assign(player, { x: 520, y: 1160 });
  world.players = [player];
  for (let cell = 0; cell < FARM.columns * FARM.rows; cell++) {
    world.valley.plots.push({
      cell,
      state: 'planted',
      crop: 'carrot',
      growth: 1,
      watered: cell % 2 === 0,
    });
  }
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const legacy = JSON.stringify(world);
  await page.addInitScript((value) => {
    if (!localStorage.getItem('panda-save'))
      localStorage.setItem('panda-save', value);
  }, legacy);
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Continue saved solo adventure' })
    .click();
  await expect(page.locator('#valley')).toHaveAttribute('data-plots', '32');
  await expect(page.locator('#valley')).toHaveAttribute('data-ripe', '32');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save progress' }).click();
  const saved: unknown = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('panda-save') ?? 'null'),
  );
  expect(saved).toMatchObject({
    version: 3,
    world: { valley: { plots: world.valley.plots } },
  });
  await page.reload();
  await page
    .getByRole('button', { name: 'Continue saved solo adventure' })
    .click();
  await expect(page.locator('#valley')).toHaveAttribute('data-plots', '32');
  await expect(page.locator('#valley')).toHaveAttribute('data-ripe', '32');
  // Corners still map to the original 8×4 authoritative grid.
  expect(cellPoint(0)).toEqual({ x: 416, y: 1236 });
  expect(cellPoint(31)).toEqual({ x: 640, y: 1332 });
  expect(errors).toEqual([]);
});
