import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
// Import finished sprites, never infer licensing or invent missing reference images.
const [hero, source, stateList, license, provenance] = process.argv.slice(2);
if (
  (hero !== 'panda' && hero !== 'ape') ||
  !source ||
  !stateList ||
  !license ||
  !provenance
)
  throw Error(
    'Usage: npm run sprites:import -- panda sheet.png walk,idle,attack,special,guard,hit,downed LICENSE "Provenance"',
  );
const states = stateList.split(',');
const supported = [
  'walk',
  'idle',
  'attack',
  'special',
  'guard',
  'hit',
  'downed',
];
if (
  states[0] !== 'walk' ||
  new Set(states).size !== states.length ||
  states.some((s) => !supported.includes(s))
)
  throw Error('First state must be walk; use unique supported states.');
const png = await readFile(resolve(source));
if (
  !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
  png.length < 24 ||
  png.readUInt32BE(16) !== 256 ||
  png.readUInt32BE(20) !== 512 * states.length
)
  throw Error('Expected PNG dimensions: 256 × (512 × state count).');
const configPath = resolve('assets/hero-sheets.json');
const config: unknown = JSON.parse(await readFile(configPath, 'utf8'));
if (
  !config ||
  typeof config !== 'object' ||
  !('panda' in config) ||
  !('ape' in config)
)
  throw Error('Invalid sprite registry.');
const destination = join('apps/game/public/sprites', `${hero}.png`);
await mkdir('apps/game/public/sprites', { recursive: true });
await copyFile(resolve(source), destination);
const entry = { source: `sprites/${hero}.png`, states, license, provenance };
await writeFile(
  configPath,
  JSON.stringify(
    { panda: config.panda, ape: config.ape, [hero]: entry },
    null,
    2,
  ) + '\n',
);
console.log(
  `Imported ${hero}: ${states.join(', ')}. Run browser checks and commit the PNG and registry together.`,
);
