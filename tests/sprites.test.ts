import { it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
// A PNG header fixture tests importer dimensions and registration, not rendered artwork.
it('sprite importer preserves the other hero contract and records explicit provenance', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'panda-sprites-'));
  try {
    await mkdir(join(directory, 'assets'));
    await writeFile(
      join(directory, 'assets/hero-sheets.json'),
      JSON.stringify({
        panda: { source: null, states: ['walk'] },
        ape: { source: null, states: ['walk'] },
      }),
    );
    const header = Buffer.alloc(24);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header);
    header.writeUInt32BE(256, 16);
    header.writeUInt32BE(1024, 20);
    await writeFile(join(directory, 'sheet.png'), header);
    const run = (states: string) =>
      spawnSync(
        process.execPath,
        [
          '--import',
          resolve('node_modules/tsx/dist/loader.mjs'),
          resolve('scripts/import-sprites.ts'),
          'panda',
          'sheet.png',
          states,
          'CC0-1.0',
          'Test fixture',
        ],
        { cwd: directory, encoding: 'utf8' },
      );
    expect(run('walk').status).not.toBe(0);
    expect(run('walk,attack').status).toBe(0);
    const value: unknown = JSON.parse(
      await readFile(join(directory, 'assets/hero-sheets.json'), 'utf8'),
    );
    expect(value).toEqual({
      panda: {
        source: 'sprites/panda.png',
        states: ['walk', 'attack'],
        license: 'CC0-1.0',
        provenance: 'Test fixture',
      },
      ape: { source: null, states: ['walk'] },
    });
    expect(
      await readFile(join(directory, 'apps/game/public/sprites/panda.png')),
    ).toEqual(header);
    expect(run('attack,walk').status).not.toBe(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
