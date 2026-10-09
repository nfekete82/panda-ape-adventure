import { obstacles, WORLD, buildingCollision, type World } from '@panda/shared';

export interface Waypoint { x: number; y: number }
const SIZE = 32;
const COLS = Math.ceil(WORLD.width / SIZE);
const ROWS = Math.ceil(WORLD.height / SIZE);
const inside = (c: number, r: number) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
const point = (c: number, r: number): Waypoint => ({ x: Math.min(WORLD.width - 16, c * SIZE + 16), y: Math.min(WORLD.height - 16, r * SIZE + 16) });

/** Bounded 8-neighbour A* routing over server-shared static and farm obstacles. */
export function findClickPath(start: Waypoint, target: Waypoint, world: World): Waypoint[] {
  const blocked = new Uint8Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const at = point(c, r);
    if (obstacles.some(o => at.x >= o.x - 17 && at.x <= o.x + o.w + 17 && at.y >= o.y - 17 && at.y <= o.y + o.h + 17) || buildingCollision(world, at.x, at.y, 16)) blocked[r * COLS + c] = 1;
  }
  const index = (p: Waypoint) => Math.max(0, Math.min(ROWS - 1, Math.floor(p.y / SIZE))) * COLS + Math.max(0, Math.min(COLS - 1, Math.floor(p.x / SIZE)));
  const source = index(start), goal = index(target);
  blocked[source] = 0;
  if (blocked[goal]) return [];
  const count = COLS * ROWS;
  const previous = new Int32Array(count).fill(-1);
  const distance = new Float64Array(count).fill(Infinity);
  const visited = new Uint8Array(count);
  const frontier: number[] = [source];
  distance[source] = 0;
  const estimate = (id: number) => Math.hypot((id % COLS) - (goal % COLS), Math.floor(id / COLS) - Math.floor(goal / COLS));
  while (frontier.length) {
    let best = 0;
    for (let n = 1; n < frontier.length; n++) if (distance[frontier[n]!] + estimate(frontier[n]!) < distance[frontier[best]!] + estimate(frontier[best]!)) best = n;
    const current = frontier.splice(best, 1)[0]!;
    if (visited[current]) continue;
    if (current === goal) break;
    visited[current] = 1;
    const x = current % COLS, y = Math.floor(current / COLS);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dy) || !inside(x + dx, y + dy)) continue;
      const next = (y + dy) * COLS + x + dx;
      if (blocked[next] || visited[next]) continue;
      if (dx && dy && (blocked[y * COLS + x + dx] || blocked[(y + dy) * COLS + x])) continue;
      const candidate = distance[current] + Math.hypot(dx, dy);
      if (candidate < distance[next]) {
        distance[next] = candidate;
        previous[next] = current;
        if (!frontier.includes(next)) frontier.push(next);
      }
    }
  }
  if (source !== goal && previous[goal] < 0) return [];
  const path: Waypoint[] = [];
  for (let at = goal; at !== source && at >= 0; at = previous[at]!) path.push(point(at % COLS, Math.floor(at / COLS)));
  path.reverse();
  // Clicking a nearby unobstructed cell retains the precise target.
  if (path.length && Math.hypot(path[path.length - 1]!.x - target.x, path[path.length - 1]!.y - target.y) < 16) path[path.length - 1] = target;
  return path;
}
