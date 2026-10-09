import type Phaser from 'phaser';
import {
  FARM,
  DAY_SECONDS,
  CROP_IDS,
  CROPS,
  ITEMS,
  ITEM_IDS,
  RECIPE_IDS,
  RECIPES,
  RESOURCE_NODES,
  cellPoint,
  plotStage,
  placementError,
  distance,
  WORLD,
  type Crop,
  type Recipe,
  type World,
  type Player,
  type ValleyAction,
} from '@panda/shared';
type Tool = 'none' | 'hoe' | 'plant' | 'water' | 'harvest' | 'build' | 'remove';
export class ValleyView {
  private tool: Tool = 'none';
  private crop: Crop = 'carrot';
  private recipe: Recipe = 'workbench';
  private open = false;
  private tab: 'garden' | 'supplies' | 'market' = 'garden';
  private signature = '';
  private visualSignature = '';
  private readonly icons = new Map<string, string>();
  private readonly ghost: Phaser.GameObjects.Image;
  private readonly root: HTMLElement;
  private readonly content: HTMLElement;
  private readonly status: HTMLElement;
  private readonly clock: HTMLElement;
  private readonly objects = new Map<string, Phaser.GameObjects.Image>();
  private readonly preview: Phaser.GameObjects.Graphics;
  constructor(
    private scene: Phaser.Scene,
    private world: () => World,
    private player: () => Player | undefined,
    private send: (a: ValleyAction) => void,
  ) {
    this.root = document.createElement('section');
    this.root.id = 'valley';
    this.root.innerHTML =
      '<div class="valley-summary"><button id="valley-toggle" aria-label="Open farm management">☰ Farm · F</button><span id="valley-clock"></span></div><div id="valley-content" hidden></div><div id="valley-hotbar" role="toolbar" aria-label="Farming tools"><button data-quick-tool="none" title="Explore">✋</button><button data-quick-tool="hoe" title="Hoe">▦</button><button data-quick-tool="plant" title="Plant">🌱</button><button data-quick-tool="water" title="Water">💧</button><button data-quick-tool="harvest" title="Harvest">🌾</button><button data-quick-tool="build" title="Build">🔨</button><button data-quick-tool="remove" title="Remove furniture">✕</button></div><p id="valley-status" role="status" hidden></p>';
    document.getElementById('hud')!.append(this.root);
    this.content = this.root.querySelector('#valley-content')!;
    this.status = this.root.querySelector('#valley-status')!;
    this.clock = this.root.querySelector('#valley-clock')!;
    this.root.querySelector<HTMLButtonElement>('#valley-toggle')!.onclick =
      () => this.toggle();
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-quick-tool]')) {
      button.onclick = () => {
        this.tool = button.dataset.quickTool as Tool;
        this.open = false;
        this.signature = '';
        this.preview.clear();
        this.ghost.setVisible(false);
        this.update();
      };
    }
    const ground = scene.add.graphics().setDepth(0.5);
    ground.fillStyle(0x785c3c, 0.92);
    ground.fillRect(
      FARM.x - 12,
      FARM.y - 8,
      FARM.columns * 32 + 24,
      FARM.rows * 32 + 16,
    );
    ground.lineStyle(2, 0xbda177, 0.8);
    for (let cell = 0; cell < FARM.columns * FARM.rows; cell++) {
      const p = cellPoint(cell);
      ground.fillStyle((Math.floor(cell / FARM.columns) + cell % FARM.columns) % 2 ? 0x765435 : 0x866341, 0.95);
      ground.fillRect(p.x - 15, p.y - 15, 30, 30);
      ground.strokeRect(p.x - 15, p.y - 15, 30, 30);
    }
    scene.add
      .text(FARM.x + 128, FARM.y - 28, 'ROWAN’S GARDEN · F', {
        fontFamily: 'Georgia',
        fontSize: '12px',
        color: '#e5d39b',
        stroke: '#20352f',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(1190);
    for (const node of RESOURCE_NODES)
      scene.add
        .image(node.x, node.y, `valley-cache-${node.item}`)
        .setDepth(node.y);
    for (const id of ITEM_IDS) {
      const crop = CROP_IDS.find(
        (crop) => id === crop || id === CROPS[crop].seed,
      );
      if (crop)
        this.icons.set(id, scene.textures.getBase64(`valley-crop-${crop}`, 2));
      else if (RESOURCE_NODES.some((node) => node.item === id))
        this.icons.set(id, scene.textures.getBase64(`valley-cache-${id}`));
      else this.icons.set(id, scene.textures.getBase64('valley-watering-can'));
    }
    this.ghost = scene.add
      .image(0, 0, 'valley-building-workbench')
      .setAlpha(0.55)
      .setDepth(2051)
      .setVisible(false);
    this.preview = scene.add.graphics().setDepth(2050);
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) =>
      this.previewAt(pointer.worldX, pointer.worldY),
    );
  }
  get working() {
    return this.tool !== 'none';
  }
  toggle(force?: boolean) {
    this.open = force ?? !this.open;
    if (!this.open) {
      this.preview.clear();
      this.ghost.setVisible(false);
      this.status.hidden = true;
    }
    this.signature = '';
    this.update();
  }
  key(code: string): boolean {
    if (code === 'KeyF') {
      this.toggle();
      return true;
    }
    if (code === 'Escape' && this.open) {
      this.toggle(false);
      return true;
    }
    if (code === 'KeyT') {
      this.open = true;
      this.tab = 'market';
      this.tool = 'none';
      this.signature = '';
      this.update();
      return true;
    }
    return false;
  }
  feedback(message: string) {
    this.status.hidden = false;
    this.status.textContent = message;
  }
  private cell(x: number, y: number): number | null {
    const col = Math.floor((x - FARM.x) / 32),
      row = Math.floor((y - FARM.y) / 32);
    return col >= 0 && col < 8 && row >= 0 && row < 4 ? row * 8 + col : null;
  }
  private previewAt(x: number, y: number) {
    this.preview.clear();
    this.ghost.setVisible(false);
    if (!this.working) return;
    const cell = this.cell(x, y);
    if (cell === null) return;
    const w = this.world(),
      p = this.player(),
      point = cellPoint(cell);
    const error =
      this.tool === 'build'
        ? placementError(w, cell, RECIPES[this.recipe].solid)
        : null;
    const definition = RECIPES[this.recipe];
    const affordable =
      w.valley.gold >= definition.gold &&
      ITEM_IDS.every(
        (key) =>
          w.valley.bag[key] >=
          Math.max(
            0,
            (definition.cost[key] ?? 0) -
              (p?.hero === 'ape' && key === 'wood' ? 1 : 0),
          ),
      );
    const valid =
      !error &&
      (this.tool !== 'build' || affordable) &&
      !!p &&
      distance(p, point) <= 90 &&
      !(
        this.tool === 'build' &&
        w.valley.plots.some((plot) => plot.cell === cell)
      );
    if (this.tool === 'build')
      this.ghost
        .setTexture(`valley-building-${this.recipe}`)
        .setPosition(point.x, point.y - 8)
        .setTint(valid ? 0xc3dea0 : 0xe28f79)
        .setVisible(true);
    this.preview.fillStyle(valid ? 0xa7c886 : 0xe28f79, 0.22);
    this.preview.fillRect(point.x - 16, point.y - 16, 32, 32);
    this.preview.lineStyle(2, valid ? 0xc3dea0 : 0xe28f79, 0.8);
    this.preview.strokeRect(point.x - 16, point.y - 16, 32, 32);
  }
  pointer(x: number, y: number): boolean {
    if (!this.working) return false;
    const node = RESOURCE_NODES.findIndex(
      (node) => Math.hypot(node.x - x, node.y - y) < 22,
    );
    if (node >= 0) {
      this.send({ kind: 'gather', node });
      return true;
    }
    const cell = this.cell(x, y);
    if (cell === null) {
      this.feedback('Choose a tile in Rowan’s garden, south of the camp.');
      return true;
    }
    if (this.tool === 'plant')
      this.send({ kind: 'plant', cell, crop: this.crop });
    else if (this.tool === 'build')
      this.send({ kind: 'build', cell, recipe: this.recipe });
    else if (this.tool !== 'none') this.send({ kind: this.tool, cell });
    this.previewAt(x, y);
    return true;
  }
  update() {
    const w = this.world(),
      p = this.player();
    if (!p) return;
    this.content.hidden = !this.open;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-quick-tool]'))
      button.setAttribute('aria-pressed', String(button.dataset.quickTool === this.tool));
    this.clock.textContent = `Day ${w.valley.day} · ${Math.ceil(DAY_SECONDS - w.valley.elapsed)}s · ${w.valley.gold} gold`;
    this.root.dataset.gold = String(w.valley.gold);
    this.root.dataset.day = String(w.valley.day);
    this.root.dataset.ripe = String(
      w.valley.plots.filter((plot) => plotStage(plot) === 3).length,
    );
    this.root.dataset.plots = String(w.valley.plots.length);
    this.root.dataset.buildings = String(w.valley.buildings.length);
    const nearby = [
      distance(p, WORLD.npc) <= 90,
      ...RESOURCE_NODES.map((n) => distance(p, n) <= 85),
    ];
    const signature = JSON.stringify([
      w.instanceId,
      w.valley.bag,
      w.valley.plots,
      w.valley.buildings,
      w.valley.nodes,
      w.valley.day,
      nearby,
      this.tool,
      this.crop,
      this.recipe,
      this.open,
      this.tab,
      w.valley.gold,
    ]);
    if (signature === this.signature) return;
    this.signature = signature;
    const visualSignature = JSON.stringify([
      w.instanceId,
      w.valley.plots,
      w.valley.buildings,
    ]);
    if (visualSignature !== this.visualSignature) {
      this.visualSignature = visualSignature;
      for (const object of this.objects.values()) object.destroy();
      this.objects.clear();
      for (const plot of w.valley.plots) {
        const at = cellPoint(plot.cell);
        this.objects.set(
          `soil${plot.cell}`,
          this.scene.add
            .image(
              at.x,
              at.y,
              plot.state === 'planted' && plot.watered
                ? 'valley-soil-wet'
                : 'valley-soil',
            )
            .setDepth(1),
        );
        if (plot.state === 'planted')
          this.objects.set(
            `crop${plot.cell}`,
            this.scene.add
              .image(
                at.x,
                at.y - 9,
                `valley-crop-${plot.crop}`,
                plotStage(plot) - 1,
              )
              .setDepth(at.y + 5),
          );
      }
      for (const building of w.valley.buildings) {
        const at = cellPoint(building.cell);
        this.objects.set(
          `build${building.cell}`,
          this.scene.add
            .image(at.x, at.y - 8, `valley-building-${building.recipe}`)
            .setDepth(at.y + 13),
        );
      }
    }
    if (!this.open) return;
    this.content.innerHTML = `<h3>Our woodland home</h3><nav class="valley-tabs" aria-label="Wild Valley menus">${(['garden', 'supplies', 'market'] as const).map((tab) => `<button data-tab="${tab}" aria-pressed="${tab === this.tab}">${tab === 'garden' ? 'Garden' : tab === 'supplies' ? 'Supplies' : 'Market'}</button>`).join('')}</nav><section ${this.tab === 'garden' ? '' : 'hidden'}><p>Select a tool, then click a nearby garden tile. Dry crops wait safely; days last 45 seconds.</p>
      <div class="valley-tools">${(['none', 'hoe', 'plant', 'water', 'harvest', 'build', 'remove'] as const).map((tool) => `<button data-tool="${tool}" aria-pressed="${tool === this.tool}">${tool === 'none' ? 'Explore' : tool === 'remove' ? 'Remove furniture' : tool}</button>`).join('')}</div>
      <label>Seed <select id="valley-seed">${CROP_IDS.map((crop) => `<option value="${crop}" ${this.crop === crop ? 'selected' : ''}>${CROPS[crop].name} · ${CROPS[crop].days} day(s) · ${w.valley.bag[CROPS[crop].seed]} seeds</option>`).join('')}</select></label>
      <label>Build <select id="valley-recipe">${RECIPE_IDS.map((recipe) => `<option value="${recipe}" ${recipe === this.recipe ? 'selected' : ''}>${RECIPES[recipe].name}</option>`).join('')}</select></label>
      <p>${RECIPES[this.recipe].gold} gold · ${ITEM_IDS.filter(
        (key) => RECIPES[this.recipe].cost[key],
      )
        .map((key) => `${RECIPES[this.recipe].cost[key]} ${ITEMS[key].name}`)
        .join(', ')}. Ape saves 1 wood. Removing furniture gives no refund.</p>
      <h4>Gather nearby</h4><div class="valley-tools">${RESOURCE_NODES.map((node, i) => `<button data-node="${i}" ${!nearby[i + 1] || w.valley.nodes[i] === w.valley.day ? 'disabled' : ''}>${node.name} +4</button>`).join('')}</div>
      </section><section ${this.tab === 'supplies' ? '' : 'hidden'}><h4>Shared supplies</h4><div class="valley-grid">${ITEM_IDS.filter(
        (key) => w.valley.bag[key] > 0,
      )
        .map(
          (key) =>
            `<div class="valley-item" title="${ITEMS[key].name}"><img src="${this.icons.get(key)}" alt="" width="24" height="24"><span>${ITEMS[key].name}</span><strong>${w.valley.bag[key]}</strong></div>`,
        )
        .join('')}</div>
      </section><section ${this.tab === 'market' ? '' : 'hidden'}><h4>Rowan’s market ${nearby[0] ? '' : '· visit Rowan (T)'}</h4><p>Shared gold: <strong>${w.valley.gold}</strong>. Buy a watering can first. Panda waters a neighbour too.</p>
      <div class="valley-market">${ITEM_IDS.filter((key) => ITEMS[key].buy)
        .map(
          (key) =>
            `<button data-buy="${key}" ${!nearby[0] || (key === 'wateringCan' && w.valley.bag.wateringCan > 0) ? 'disabled' : ''}>Buy ${ITEMS[key].name} · ${ITEMS[key].buy}g</button>`,
        )
        .join('')}
      ${ITEM_IDS.filter((key) => ITEMS[key].sell && w.valley.bag[key] > 0)
        .map(
          (key) =>
            `<button data-sell="${key}" ${!nearby[0] ? 'disabled' : ''}>Sell ${ITEMS[key].name} · ${ITEMS[key].sell}g</button>`,
        )
        .join('')}</div></section>`;
    for (const button of this.content.querySelectorAll<HTMLButtonElement>(
      '[data-tab]',
    ))
      button.onclick = () => {
        const value = button.dataset.tab;
        if (value === 'garden' || value === 'supplies' || value === 'market') {
          this.tab = value;
          this.signature = '';
          this.update();
        }
      };
    for (const button of this.content.querySelectorAll<HTMLButtonElement>(
      '[data-tool]',
    ))
      button.onclick = () => {
        const value = button.dataset.tool;
        if (
          value === 'none' ||
          value === 'hoe' ||
          value === 'plant' ||
          value === 'water' ||
          value === 'harvest' ||
          value === 'build' ||
          value === 'remove'
        ) {
          this.tool = value;
          this.signature = '';
          this.preview.clear();
          this.ghost.setVisible(false);
          this.update();
        }
      };
    const seed = this.content.querySelector<HTMLSelectElement>('#valley-seed')!;
    seed.onchange = () => {
      const value = seed.value;
      const selected = CROP_IDS.find((id) => id === value);
      if (selected) {
        this.crop = selected;
        this.tool = 'plant';
        this.signature = '';
        this.update();
      }
    };
    const recipe =
      this.content.querySelector<HTMLSelectElement>('#valley-recipe')!;
    recipe.onchange = () => {
      const selected = RECIPE_IDS.find((id) => id === recipe.value);
      if (selected) {
        this.recipe = selected;
        this.tool = 'build';
        this.signature = '';
        this.update();
      }
    };
    for (const button of this.content.querySelectorAll<HTMLButtonElement>(
      '[data-node]',
    ))
      button.onclick = () =>
        this.send({ kind: 'gather', node: Number(button.dataset.node) });
    for (const item of ITEM_IDS) {
      const buy = this.content.querySelector<HTMLButtonElement>(
          `[data-buy="${item}"]`,
        ),
        sell = this.content.querySelector<HTMLButtonElement>(
          `[data-sell="${item}"]`,
        );
      if (buy) buy.onclick = () => this.send({ kind: 'buy', item, count: 1 });
      if (sell)
        sell.onclick = () => this.send({ kind: 'sell', item, count: 1 });
    }
  }
}
