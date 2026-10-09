/** CC0 pixel samples transcribed from Jofra's Mini Farm Asset Pack tileset.png.
 * Source: https://jofra.itch.io/mini-farm (user-provided archive).
 * 16×16 sprite sample: source rectangle x=30,y=140,width=16,height=16.
 * A small source sample enables a gradual atlas integration without changing world geometry.
 */
const SPRITE = [
  'DCBCAAAAAAAAAAAB',
  'DCBCAAAAAAAAAAAB',
  'DCBCAAAAAAAADAAA',
  'CBBCAAAAAAAAAAAA',
  'BBBCAAAAAAAAAAAA',
  'CCCCAAAAAAAADAAA',
  'DAAAAAAAAAAAAAAB',
  'AAAAAAAAAAAAAAAB',
  'AAAAADAAAAAAAAAA',
  'AAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAA',
  'AAAAAAABBBBAAAAB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBDDDDBBBBBB',
] as const;
const PALETTE: Record<string, string> = {
  A: '#9cdb43', B: '#59c135', C: '#1a7a3e', D: '#14a02e',
};
export function paintMiniFarmGrass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // A cached sprite gives us the pack's real colors/pixels without thousands of draw calls.
  const tile = document.createElement('canvas');
  tile.width = 16;
  tile.height = 16;
  const source = tile.getContext('2d')!;
  for (let y = 0; y < SPRITE.length; y++) {
    const row = SPRITE[y]!;
    for (let x = 0; x < row.length; x++) {
      source.fillStyle = PALETTE[row[x]!]!;
      source.fillRect(x, y, 1, 1);
    }
  }
  for (let y = 0; y < height; y += 16)
    for (let x = 0; x < width; x += 16)
      ctx.drawImage(tile, x, y);
  ctx.restore();
}
