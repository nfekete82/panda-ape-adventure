import { test, expect, type Page } from '@playwright/test';
import { createWorld, createPlayer, cellPoint, WORLD } from '@panda/shared';

async function walk(page: Page, x: number, y: number) {
  const keys = new Set<string>();
  try {
    await expect
      .poll(
        async () => {
          const px = Number(await page.locator('#hud').getAttribute('data-x'));
          const py = Number(await page.locator('#hud').getAttribute('data-y'));
          const wanted = new Set<string>();
          if (Math.abs(x - px) > 15) wanted.add(x > px ? 'KeyD' : 'KeyA');
          if (Math.abs(y - py) > 15) wanted.add(y > py ? 'KeyS' : 'KeyW');
          for (const key of keys)
            if (!wanted.has(key)) {
              await page.keyboard.up(key);
              keys.delete(key);
            }
          for (const key of wanted)
            if (!keys.has(key)) {
              await page.keyboard.down(key);
              keys.add(key);
            }
          return Math.hypot(px - x, py - y);
        },
        { timeout: 10000, intervals: [50] },
      )
      .toBeLessThan(24);
  } finally {
    for (const key of keys) await page.keyboard.up(key);
  }
}
async function clickCell(page: Page, cell: number, click = true) {
  const at = cellPoint(cell);
  const hud = page.locator('#hud');
  // Movement stops before the camera's lerp does. Wait for the rendered
  // midpoint to settle before projecting a world tile into screen coordinates.
  let last: { x: number; y: number } | undefined;
  await expect
    .poll(
      async () => {
        const point = {
          x: Number(await hud.getAttribute('data-camera-x')),
          y: Number(await hud.getAttribute('data-camera-y')),
        };
        const drift = last
          ? Math.hypot(point.x - last.x, point.y - last.y)
          : Infinity;
        last = point;
        return drift;
      },
      { intervals: [200], timeout: 5000 },
    )
    .toBeLessThan(0.1);
  const cx = Number(await hud.getAttribute('data-camera-x'));
  const cy = Number(await hud.getAttribute('data-camera-y'));
  const zoom = Number(await hud.getAttribute('data-camera-zoom'));
  const box = await page.locator('#game canvas').boundingBox();
  if (!box) throw Error('Missing canvas');
  const pointer = click
    ? page.mouse.click.bind(page.mouse)
    : page.mouse.move.bind(page.mouse);
  await pointer(
    box.x + box.width / 2 + (at.x - cx) * zoom,
    box.y + box.height / 2 + (at.y - cy) * zoom,
  );
}

test('solo farming loop gathers, plants, waters, grows, sells, builds and restores', async ({
  page,
}) => {
  test.setTimeout(85000);
  const world = createWorld(),
    p = createPlayer('local', 'panda');
  Object.assign(p, cellPoint(0));
  p.y -= 60;
  world.players = [p];
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
  await expect
    .poll(async () =>
      Number(await page.locator('#hud').getAttribute('data-camera-y')),
    )
    .toBeGreaterThan(1000);
  await page.keyboard.press('KeyF');
  await page.getByRole('button', { name: 'Fallen branches +4' }).click();
  await walk(page, WORLD.npc.x, WORLD.npc.y + 40);
  await page.keyboard.press('KeyT');
  await page.getByRole('button', { name: 'Buy Watering can · 6g' }).click();
  await page.getByRole('button', { name: 'Garden', exact: true }).click();
  await expect(page.locator('#valley')).toHaveAttribute('data-gold', '12');
  await walk(page, cellPoint(0).x, cellPoint(0).y - 60);
  await page.getByRole('button', { name: 'hoe', exact: true }).click();
  await clickCell(page, 0);
  await expect(page.locator('#valley')).toHaveAttribute('data-plots', '1');
  await page.getByRole('button', { name: 'plant', exact: true }).click();
  await clickCell(page, 0);
  await page.getByRole('button', { name: 'water', exact: true }).click();
  await clickCell(page, 0);
  await expect(page.locator('#valley-status')).toContainText('Done');
  await page.screenshot({ path: 'test-results/wild-valley-planted.png' });
  await expect(page.locator('#valley')).toHaveAttribute('data-ripe', '1', {
    timeout: 50000,
  });
  await page.getByRole('button', { name: 'harvest', exact: true }).click();
  await clickCell(page, 0);
  await expect(page.locator('#valley')).toHaveAttribute('data-ripe', '0');
  await page.getByRole('button', { name: 'Fallen branches +4' }).click();
  await walk(page, 640, 1180);
  await page.getByRole('button', { name: 'Loose stones +4' }).click();
  await walk(page, WORLD.npc.x, WORLD.npc.y + 40);
  await page.keyboard.press('KeyT');
  await page.getByRole('button', { name: 'Sell Carrot · 10g' }).click();
  await page.getByRole('button', { name: 'Garden', exact: true }).click();
  await expect(page.locator('#valley')).toHaveAttribute('data-gold', '22');
  await walk(page, cellPoint(4).x, cellPoint(4).y - 60);
  await page.getByRole('button', { name: 'build', exact: true }).click();
  await clickCell(page, 4);
  await expect(page.locator('#valley')).toHaveAttribute('data-buildings', '1');
  await expect(page.locator('#valley')).toHaveAttribute('data-gold', '10');
  await page.screenshot({ path: 'test-results/wild-valley-workbench.png' });
  // Navigation unloads and restores the actual automatically persisted envelope.
  await page.reload();
  await page
    .getByRole('button', { name: 'Continue saved solo adventure' })
    .click();
  await expect(page.locator('#valley')).toHaveAttribute('data-buildings', '1');
  await expect(page.locator('#valley')).toHaveAttribute('data-gold', '10');
  expect(errors).toEqual([]);
});

test('four crop silhouettes and placement preview render with a compact responsive menu', async ({
  page,
}) => {
  const world = createWorld(),
    p = createPlayer('local', 'ape');
  Object.assign(p, cellPoint(3));
  p.y -= 60;
  world.players = [p];
  world.valley.bag.wood = 20;
  world.valley.bag.stone = 8;
  for (const [cell, crop] of (
    ['carrot', 'potato', 'tomato', 'strawberry'] as const
  ).entries())
    world.valley.plots.push({
      cell,
      state: 'planted',
      crop,
      growth: cell + 1,
      watered: false,
    });
  await page.addInitScript((value) => {
    if (!localStorage.getItem('panda-save'))
      localStorage.setItem('panda-save', value);
  }, JSON.stringify(world));
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Continue saved solo adventure' })
    .click();
  await expect(page.locator('#valley')).toHaveAttribute('data-ripe', '4');
  await page.keyboard.press('KeyF');
  await page.getByRole('button', { name: 'build', exact: true }).click();
  await expect
    .poll(async () =>
      Number(await page.locator('#hud').getAttribute('data-camera-y')),
    )
    .toBeGreaterThan(1100);
  await clickCell(page, 5, false);
  await page.screenshot({ path: 'test-results/wild-valley-crops.png' });
  await page.setViewportSize({ width: 900, height: 700 });
  await expect(page.locator('#valley-content')).toBeVisible();
  const bounds = await page.locator('#valley').boundingBox();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect(bounds && bounds.x + bounds.width).toBeLessThanOrEqual(900);
  await expect
    .poll(async () =>
      Number(await page.locator('#hud').getAttribute('data-camera-y')),
    )
    .toBeGreaterThan(1150);
  await page.screenshot({ path: 'test-results/wild-valley-compact.png' });
});
