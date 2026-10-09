import {
  collides,
  distance,
  forestFootprint,
  obstacles,
  WORLD,
  type Player,
  type World,
} from './index.js';

export const FARM = { x: 400, y: 1220, columns: 8, rows: 4, tile: 32 };
export const DAY_SECONDS = 45;
/** Stable deterministic forecast, independent of server or browser randomness. */
export type ValleyWeather = 'sunny' | 'cloudy' | 'rain';
export function weatherForDay(day: number): ValleyWeather {
  const roll = (Math.imul(day, 1664525) + 1013904223) >>> 0;
  const fraction = roll / 4294967296;
  return fraction < 0.35 ? 'rain' : fraction < 0.65 ? 'cloudy' : 'sunny';
}
export const ITEM_IDS = [
  'wood',
  'stone',
  'fiber',
  'ore',
  'carrotSeed',
  'potatoSeed',
  'tomatoSeed',
  'strawberrySeed',
  'carrot',
  'potato',
  'tomato',
  'strawberry',
  'wateringCan',
] as const;
export type ValleyItem = (typeof ITEM_IDS)[number];
export const ITEMS: Record<
  ValleyItem,
  { name: string; buy: number; sell: number }
> = {
  wood: { name: 'Wood', buy: 0, sell: 1 },
  stone: { name: 'Stone', buy: 0, sell: 1 },
  fiber: { name: 'Fibre', buy: 0, sell: 1 },
  ore: { name: 'Ore', buy: 0, sell: 3 },
  carrotSeed: { name: 'Carrot seeds', buy: 4, sell: 0 },
  potatoSeed: { name: 'Potato seeds', buy: 6, sell: 0 },
  tomatoSeed: { name: 'Tomato seeds', buy: 8, sell: 0 },
  strawberrySeed: { name: 'Strawberry seeds', buy: 10, sell: 0 },
  carrot: { name: 'Carrot', buy: 0, sell: 10 },
  potato: { name: 'Potato', buy: 0, sell: 16 },
  tomato: { name: 'Tomato', buy: 0, sell: 24 },
  strawberry: { name: 'Strawberry', buy: 0, sell: 34 },
  wateringCan: { name: 'Watering can', buy: 6, sell: 0 },
};
export const CROPS = {
  carrot: { name: 'Carrot', seed: 'carrotSeed', days: 1 },
  potato: { name: 'Potato', seed: 'potatoSeed', days: 2 },
  tomato: { name: 'Tomato', seed: 'tomatoSeed', days: 3 },
  strawberry: { name: 'Strawberry', seed: 'strawberrySeed', days: 4 },
} as const;
export type Crop = keyof typeof CROPS;
export const CROP_IDS = ['carrot', 'potato', 'tomato', 'strawberry'] as const;
export const RECIPE_IDS = [
  'workbench',
  'chest',
  'fence',
  'gardenBed',
  'shelter',
  'lantern',
] as const;
export type Recipe = (typeof RECIPE_IDS)[number];
export const RECIPES: Record<
  Recipe,
  {
    name: string;
    gold: number;
    cost: Partial<Record<ValleyItem, number>>;
    solid: boolean;
  }
> = {
  workbench: {
    name: 'Workbench',
    gold: 12,
    cost: { wood: 6, stone: 2 },
    solid: true,
  },
  chest: {
    name: 'Supply chest',
    gold: 8,
    cost: { wood: 5, fiber: 2 },
    solid: true,
  },
  fence: { name: 'Wooden fence', gold: 0, cost: { wood: 2 }, solid: true },
  gardenBed: {
    name: 'Garden border',
    gold: 0,
    cost: { wood: 2, fiber: 1 },
    solid: false,
  },
  shelter: {
    name: 'Small shelter',
    gold: 30,
    cost: { wood: 12, stone: 4, fiber: 4 },
    solid: true,
  },
  lantern: {
    name: 'Garden lantern',
    gold: 6,
    cost: { wood: 2, ore: 1 },
    solid: true,
  },
};
export const RESOURCE_NODES = [
  { x: 370, y: 1175, item: 'wood', name: 'Fallen branches' },
  { x: 640, y: 1180, item: 'stone', name: 'Loose stones' },
  { x: 680, y: 1240, item: 'fiber', name: 'Wild fibre' },
  { x: 700, y: 1320, item: 'ore', name: 'Ore fragments' },
] as const;
export type Plot =
  | { cell: number; state: 'tilled' }
  | {
      cell: number;
      state: 'planted';
      crop: Crop;
      growth: number;
      watered: boolean;
    };
export interface Building {
  cell: number;
  recipe: Recipe;
}
export interface Valley {
  version: 1;
  settled: boolean;
  owners: string[];
  day: number;
  elapsed: number;
  gold: number;
  bag: Record<ValleyItem, number>;
  plots: Plot[];
  buildings: Building[];
  nodes: number[];
  /** Hits this game day; optional to retain compatibility with older saved settlements. */
  nodeHits?: number[];
  felledTrees?: number[];
  treeHits?: Record<string, number>;
  clearedStumps?: number[];
  saplings?: Record<string, number>;
  toolLevels?: { axe: number; pickaxe: number };
  weather?: ValleyWeather;
}
export function createValley(): Valley {
  return {
    version: 1,
    settled: false,
    owners: [],
    day: 1,
    elapsed: 0,
    gold: 18,
    bag: {
      wood: 0,
      stone: 0,
      fiber: 0,
      ore: 0,
      carrotSeed: 2,
      potatoSeed: 2,
      tomatoSeed: 2,
      strawberrySeed: 2,
      carrot: 0,
      potato: 0,
      tomato: 0,
      strawberry: 0,
      wateringCan: 0,
    },
    plots: [],
    buildings: [],
    nodes: [0, 0, 0, 0],
    nodeHits: [0, 0, 0, 0],
    felledTrees: [],
    treeHits: {},
    clearedStumps: [],
    saplings: {},
    toolLevels: { axe: 1, pickaxe: 1 },
    weather: weatherForDay(1),
  };
}
export function cellPoint(cell: number) {
  return {
    x: FARM.x + (cell % FARM.columns) * FARM.tile + 16,
    y: FARM.y + Math.floor(cell / FARM.columns) * FARM.tile + 16,
  };
}
export function buildingBounds(b: Building) {
  const p = cellPoint(b.cell);
  return { x: p.x - 13, y: p.y - 13, w: 26, h: 26 };
}
export function buildingCollision(v: Valley, x: number, y: number, r: number) {
  return v.buildings.some((b) => {
    if (!RECIPES[b.recipe].solid) return false;
    const box = buildingBounds(b);
    return (
      x + r > box.x &&
      x - r < box.x + box.w &&
      y + r > box.y &&
      y - r < box.y + box.h
    );
  });
}
export function plotStage(plot: Plot): number {
  return plot.state === 'tilled'
    ? 0
    : plot.growth >= CROPS[plot.crop].days
      ? 3
      : 1 + Math.floor((plot.growth / CROPS[plot.crop].days) * 2);
}
/** Called once per shared step; plants are visited only on day boundaries. */
export function advanceValley(v: Valley, dt: number) {
  v.elapsed += dt;
  while (v.elapsed >= DAY_SECONDS) {
    v.elapsed -= DAY_SECONDS;
    v.day++;
    for (const [key, readyDay] of Object.entries(v.saplings ?? {})) {
      if (v.day >= readyDay) {
        const index = Number(key);
        v.felledTrees = (v.felledTrees ?? []).filter((tree) => tree !== index);
        v.clearedStumps = (v.clearedStumps ?? []).filter((tree) => tree !== index);
        delete v.saplings![key];
      }
    }
    v.nodeHits = [0, 0, 0, 0];
    // Previous-day watering grows crops first; rain then wets beds for the new day.
    for (const plot of v.plots)
      if (
        plot.state === 'planted' &&
        plot.watered &&
        plot.growth < CROPS[plot.crop].days
      ) {
        plot.growth++;
        plot.watered = false;
      }
    v.weather = weatherForDay(v.day);
    if (v.weather === 'rain') for (const plot of v.plots)
      if (plot.state === 'planted' && plot.growth < CROPS[plot.crop].days)
        plot.watered = true;
  }
}
export type ValleyAction =
  | { kind: 'hoe' | 'water' | 'harvest' | 'remove'; cell: number }
  | { kind: 'plant'; cell: number; crop: Crop }
  | { kind: 'build'; cell: number; recipe: Recipe }
  | { kind: 'gather' | 'strike'; node: number }
  | { kind: 'chopTree' | 'clearStump' | 'plantSapling'; tree: number }
  | { kind: 'upgradeTool'; tool: 'axe' | 'pickaxe' }
  | { kind: 'buy' | 'sell'; item: ValleyItem; count: number };
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const item = (v: unknown): v is ValleyItem => ITEM_IDS.some((id) => id === v);
const crop = (v: unknown): v is Crop => CROP_IDS.some((id) => id === v);
const recipe = (v: unknown): v is Recipe => RECIPE_IDS.some((id) => id === v);
export function parseValleyAction(v: unknown): ValleyAction | null {
  if (!record(v)) return null;
  const exact = (fields: string[]) =>
    Object.keys(v).length === fields.length &&
    Object.keys(v).every((k) => fields.includes(k));
  if (
    (v.kind === 'buy' || v.kind === 'sell') &&
    exact(['kind', 'item', 'count']) &&
    item(v.item) &&
    integer(v.count, 1, 99)
  )
    return { kind: v.kind, item: v.item, count: v.count };
  if ((v.kind === 'gather' || v.kind === 'strike') && exact(['kind', 'node']) && integer(v.node, 0, 3))
    return { kind: v.kind, node: v.node };
  if ((v.kind === 'chopTree' || v.kind === 'clearStump' || v.kind === 'plantSapling') && exact(['kind', 'tree']) && integer(v.tree, 0, obstacles.length - 1) && obstacles[v.tree]?.kind === 'tree') return { kind: v.kind, tree: v.tree };
  if (v.kind === 'upgradeTool' && exact(['kind', 'tool']) && (v.tool === 'axe' || v.tool === 'pickaxe')) return { kind: 'upgradeTool', tool: v.tool };
  if (!integer(v.cell, 0, FARM.columns * FARM.rows - 1)) return null;
  if (
    (v.kind === 'hoe' ||
      v.kind === 'water' ||
      v.kind === 'harvest' ||
      v.kind === 'remove') &&
    exact(['kind', 'cell'])
  )
    return { kind: v.kind, cell: v.cell };
  if (v.kind === 'plant' && exact(['kind', 'cell', 'crop']) && crop(v.crop))
    return { kind: 'plant', cell: v.cell, crop: v.crop };
  if (
    v.kind === 'build' &&
    exact(['kind', 'cell', 'recipe']) &&
    recipe(v.recipe)
  )
    return { kind: 'build', cell: v.cell, recipe: v.recipe };
  return null;
}
export function placementError(
  w: World,
  cell: number,
  solid = false,
): string | null {
  if (!integer(cell, 0, 31)) return 'Choose a tile inside the farm.';
  const p = cellPoint(cell);
  if (collides(p.x, p.y, 17) || w.valley.buildings.some((b) => b.cell === cell))
    return 'This tile is occupied.';
  if (
    obstacles.some(
      (o) =>
        o.kind === 'tree' &&
        (() => {
          const b = forestFootprint(o);
          return (
            p.x + 16 > b.x &&
            p.x - 16 < b.x + b.w &&
            p.y + 16 > b.y &&
            p.y - 16 < b.y + b.h
          );
        })(),
    )
  )
    return 'Leave space beneath the trees.';
  if (
    solid &&
    w.players.some(
      (player) =>
        Math.abs(player.x - p.x) < 30 && Math.abs(player.y - p.y) < 30,
    )
  )
    return 'Leave space around heroes.';
  return null;
}
export function applyValleyAction(
  w: World,
  p: Player,
  a: ValleyAction,
  seq: number,
): string | null {
  if (!Number.isSafeInteger(seq) || seq <= p.commandSeq)
    return 'Command already processed.';
  p.commandSeq = seq;
  if (!p.connected || p.hp <= 0) return 'Your hero cannot work right now.';
  const v = w.valley;
  if (a.kind === 'upgradeTool') {
    const bench = v.buildings.some((b) => b.recipe === 'workbench' && distance(p, cellPoint(b.cell)) <= 95);
    if (!bench) return 'Stand next to a workbench to upgrade tools.';
    v.toolLevels ??= { axe: 1, pickaxe: 1 };
    const level = v.toolLevels[a.tool];
    if (level >= 3) return 'This tool is fully upgraded.';
    const required = level === 1 ? { wood: 4, stone: 4, ore: 1, gold: 8 } : { wood: 8, stone: 8, ore: 4, gold: 18 };
    if (v.bag.wood < required.wood || v.bag.stone < required.stone || v.bag.ore < required.ore || v.gold < required.gold) return 'Not enough resources for the upgrade.';
    v.bag.wood -= required.wood;
    v.bag.stone -= required.stone;
    v.bag.ore -= required.ore;
    v.gold -= required.gold;
    v.toolLevels[a.tool]++;
  } else if (a.kind === 'chopTree' || a.kind === 'clearStump' || a.kind === 'plantSapling') {
    const tree = obstacles[a.tree];
    if (!tree || tree.kind !== 'tree') return 'Invalid tree.';
    if (a.kind === 'chopTree' && v.felledTrees?.includes(a.tree)) return 'Tree already felled.';
    const cx = tree.x + tree.w / 2;
    const cy = tree.y + tree.h / 2;
    if (Math.hypot(p.x - cx, p.y - cy) > 90) return 'Move closer to the tree.';
    if (a.kind === 'clearStump') {
      if (!v.felledTrees?.includes(a.tree) || v.clearedStumps?.includes(a.tree)) return 'No stump to clear.';
      v.clearedStumps ??= [];
      v.clearedStumps.push(a.tree);
      return null;
    }
    if (a.kind === 'plantSapling') {
      if (!v.clearedStumps?.includes(a.tree) || v.saplings?.[String(a.tree)] !== undefined) return 'Clear a stump before planting.';
      if (v.bag.fiber < 2) return 'You need 2 fibre for a sapling.';
      v.bag.fiber -= 2;
      v.saplings ??= {};
      v.saplings[String(a.tree)] = v.day + 3;
      return null;
    }
    v.treeHits ??= {};
    const hit = (v.treeHits[String(a.tree)] ?? 0) + 1;
    if (hit >= Math.max(1, 4 - (v.toolLevels?.axe ?? 1))) {
      if (v.bag.wood > 9995) return 'Shared storage is full.';
      v.felledTrees ??= [];
      v.felledTrees.push(a.tree);
      delete v.treeHits[String(a.tree)];
      v.bag.wood += 4;
    } else v.treeHits[String(a.tree)] = hit;
  } else if (a.kind === 'buy' || a.kind === 'sell') {
    if (distance(p, WORLD.npc) > 90) return 'Visit Rowan to trade.';
    const product = ITEMS[a.item],
      price = a.kind === 'buy' ? product.buy : product.sell;
    if (!price) return 'This product is not traded that way.';
    if (a.kind === 'buy') {
      if (a.item === 'wateringCan' && (v.bag.wateringCan > 0 || a.count !== 1))
        return 'Your shared watering can is already available.';
      if (v.gold < price * a.count || v.bag[a.item] + a.count > 9999)
        return 'Not enough gold or storage space.';
      v.gold -= price * a.count;
      v.bag[a.item] += a.count;
    } else {
      if (v.bag[a.item] < a.count || v.gold + price * a.count > 999999)
        return 'Not enough items or gold capacity.';
      v.bag[a.item] -= a.count;
      v.gold += price * a.count;
    }
  } else if (a.kind === 'gather' || a.kind === 'strike') {
    const node = RESOURCE_NODES[a.node];
    if (!node || distance(p, node) > 85)
      return 'Move closer to the resource cache.';
    if ((v.nodes[a.node] ?? 0) >= v.day) return 'This cache renews tomorrow.';
    if (a.kind === 'strike' && node.item !== 'fiber') {
      v.nodeHits ??= [0, 0, 0, 0];
      const base = node.item === 'ore' ? 4 : 3;
      const upgrade = node.item === 'wood' ? (v.toolLevels?.axe ?? 1) : (v.toolLevels?.pickaxe ?? 1);
      const required = Math.max(1, base - upgrade + 1);
      const hits = (v.nodeHits[a.node] ?? 0) + 1;
      if (hits < required) {
        v.nodeHits[a.node] = hits;
      } else {
        if (v.bag[node.item] > 9995) return 'Shared storage is full.';
        v.bag[node.item] += 4;
        v.nodes[a.node] = v.day;
        v.nodeHits[a.node] = 0;
      }
    } else {
      if (v.bag[node.item] > 9995) return 'Shared storage is full.';
      v.bag[node.item] += 4;
      v.nodes[a.node] = v.day;
    }
  } else if ('cell' in a) {
    if (distance(p, cellPoint(a.cell)) > 90)
      return 'Move closer to that farm tile.';
    const plot = v.plots.find((plot) => plot.cell === a.cell);
    if (a.kind === 'build') {
      const definition = RECIPES[a.recipe],
        error = placementError(w, a.cell, definition.solid);
      if (error) return error;
      if (plot) return 'Use an empty tile for furniture.';
      const cost = (key: ValleyItem) =>
        Math.max(
          0,
          (definition.cost[key] ?? 0) -
            (key === 'wood' && p.hero === 'ape' ? 1 : 0),
        );
      if (
        v.gold < definition.gold ||
        ITEM_IDS.some((key) => v.bag[key] < cost(key))
      )
        return 'Gather the listed materials and gold first.';
      for (const key of ITEM_IDS) v.bag[key] -= cost(key);
      v.gold -= definition.gold;
      v.buildings.push({ cell: a.cell, recipe: a.recipe });
    } else if (a.kind === 'remove') {
      const building = v.buildings.find((b) => b.cell === a.cell);
      if (!building) return 'There is no furniture here.';
      // No refund: removing/rebuilding cannot duplicate discounted materials.
      v.buildings = v.buildings.filter((b) => b !== building);
    } else if (a.kind === 'hoe') {
      const error = placementError(w, a.cell);
      if (error) return error;
      if (plot) return 'This soil is already prepared.';
      v.plots.push({ cell: a.cell, state: 'tilled' });
    } else if (a.kind === 'plant') {
      if (!plot || plot.state !== 'tilled')
        return 'Prepare empty soil with the hoe first.';
      const seed = CROPS[a.crop].seed;
      if (v.bag[seed] < 1) return 'Buy more seeds from Rowan.';
      v.bag[seed]--;
      v.plots[v.plots.indexOf(plot)] = {
        cell: a.cell,
        state: 'planted',
        crop: a.crop,
        growth: 0,
        watered: false,
      };
    } else if (a.kind === 'water') {
      if (!v.bag.wateringCan) return 'Buy a watering can from Rowan (6 gold).';
      if (
        !plot ||
        plot.state !== 'planted' ||
        plot.watered ||
        plotStage(plot) === 3
      )
        return 'Choose a growing, dry crop.';
      plot.watered = true;
      if (p.hero === 'panda') {
        const next = v.plots.find(
          (other) =>
            other.cell === a.cell + 1 &&
            Math.floor(other.cell / 8) === Math.floor(a.cell / 8),
        );
        if (next?.state === 'planted' && plotStage(next) < 3)
          next.watered = true;
      }
    } else {
      if (!plot || plot.state !== 'planted' || plotStage(plot) !== 3)
        return 'This crop is not ripe yet.';
      if (v.bag[plot.crop] >= 9999) return 'Shared storage is full.';
      v.bag[plot.crop]++;
      v.plots[v.plots.indexOf(plot)] = { cell: a.cell, state: 'tilled' };
    }
  }
  v.settled = true;
  for (const player of w.players)
    if (!v.owners.includes(player.id) && v.owners.length < 2)
      v.owners.push(player.id);
  return null;
}
export function isValley(value: unknown): value is Valley {
  if (
    !record(value) ||
    value.version !== 1 ||
    typeof value.settled !== 'boolean' ||
    !Array.isArray(value.owners) ||
    value.owners.length > 2 ||
    !value.owners.every((id) => typeof id === 'string' && id.length <= 100) ||
    new Set(value.owners).size !== value.owners.length ||
    !integer(value.day, 1, 100000000) ||
    typeof value.elapsed !== 'number' ||
    !Number.isFinite(value.elapsed) ||
    value.elapsed < 0 ||
    value.elapsed >= DAY_SECONDS ||
    !integer(value.gold, 0, 999999) ||
    !record(value.bag)
  )
    return false;
  if (
    Object.keys(value.bag).length !== ITEM_IDS.length ||
    !ITEM_IDS.every(
      (key) =>
        record(value.bag) &&
        integer(value.bag[key], 0, key === 'wateringCan' ? 1 : 9999),
    )
  )
    return false;
  if (
    !Array.isArray(value.nodes) ||
    value.nodes.length !== 4 ||
    !value.nodes.every((n) => integer(n, 0, Number(value.day)))
  )
    return false;
  if (value.felledTrees !== undefined && (!Array.isArray(value.felledTrees) || value.felledTrees.length > obstacles.length || !value.felledTrees.every((n) => integer(n, 0, obstacles.length - 1) && obstacles[n]?.kind === 'tree') || new Set(value.felledTrees).size !== value.felledTrees.length)) return false;
  if (value.treeHits !== undefined && (!record(value.treeHits) || Object.keys(value.treeHits).length > obstacles.length || !Object.entries(value.treeHits).every(([key, hit]) => /^\d+$/.test(key) && integer(Number(key), 0, obstacles.length - 1) && obstacles[Number(key)]?.kind === 'tree' && integer(hit, 1, 2) && !(Array.isArray(value.felledTrees) && value.felledTrees.includes(Number(key)))))) return false;
  if (value.clearedStumps !== undefined && (!Array.isArray(value.clearedStumps) || new Set(value.clearedStumps).size !== value.clearedStumps.length || !value.clearedStumps.every((index) => integer(index, 0, obstacles.length - 1) && obstacles[index]?.kind === 'tree' && (Array.isArray(value.felledTrees) && value.felledTrees.includes(index))))) return false;
  if (value.saplings !== undefined && (!record(value.saplings) || !Object.entries(value.saplings).every(([key, day]) => /^\d+$/.test(key) && integer(Number(key), 0, obstacles.length - 1) && (Array.isArray(value.clearedStumps) && value.clearedStumps.includes(Number(key))) && integer(day, value.day as number, (value.day as number) + 3)))) return false;
  if (value.weather !== undefined && value.weather !== 'sunny' && value.weather !== 'cloudy' && value.weather !== 'rain') return false;
  if (value.toolLevels !== undefined && (!record(value.toolLevels) || Object.keys(value.toolLevels).length !== 2 || !integer(value.toolLevels.axe, 1, 3) || !integer(value.toolLevels.pickaxe, 1, 3))) return false;
  if (value.nodeHits !== undefined && (!Array.isArray(value.nodeHits) || value.nodeHits.length !== 4 || !value.nodeHits.every((n) => integer(n, 0, 3)))) return false;
  if (
    !Array.isArray(value.plots) ||
    value.plots.length > 32 ||
    !Array.isArray(value.buildings) ||
    value.buildings.length > 32
  )
    return false;
  const cells = new Set<number>();
  for (const plot of value.plots) {
    if (!record(plot) || !integer(plot.cell, 0, 31) || cells.has(plot.cell))
      return false;
    cells.add(plot.cell);
    if (plot.state === 'tilled') continue;
    if (
      plot.state !== 'planted' ||
      !crop(plot.crop) ||
      !integer(plot.growth, 0, CROPS[plot.crop].days) ||
      typeof plot.watered !== 'boolean'
    )
      return false;
  }
  for (const building of value.buildings) {
    if (
      !record(building) ||
      !integer(building.cell, 0, 31) ||
      !recipe(building.recipe) ||
      cells.has(building.cell)
    )
      return false;
    cells.add(building.cell);
  }
  return true;
}
