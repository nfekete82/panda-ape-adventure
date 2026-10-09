/** Tree sprite extracted pixel-for-pixel from the user-supplied CC0 Jofra Mini Farm tileset.
 * Original pixels: tileset.png x=134..171, y=77..110 (transparent below).
 * Source and license: https://jofra.itch.io/mini-farm
 */
const COLORS: Record<string, string> = {
 A: '#00000000', B: '#14a02e', C: '#59c135', D: '#1a7a3e',
 E: '#122020', F: '#9cdb43', G: '#000000f6',
 H: '#322b28', I: '#71413b', J: '#bb7547',
};
const RLE = [
  "A14,E1,F7,E1,A15",
  "A13,E1,F9,E1,A14",
  "A13,E1,F10,E1,A13",
  "A12,E1,F11,E1,A13",
  "A11,E1,F12,E1,A13",
  "A11,E1,F13,E1,A12",
  "A10,E1,F4,C1,F4,C1,F2,C1,F1,E1,A12",
  "A11,E1,C3,F5,C1,F2,C2,E1,A12",
  "A11,E1,C10,F1,C3,E1,A11",
  "A9,E2,C16,E1,A10",
  "A8,E1,C19,E1,A9",
  "A7,E1,C3,B1,C17,E1,A8",
  "A7,E1,C3,B2,C16,E1,A8",
  "A6,E1,C3,B3,C15,B1,E2,A7",
  "A7,E1,B4,C3,B3,C3,B2,C4,B4,E1,A6",
  "A6,E1,B12,C1,B5,C1,B6,E1,A5",
  "A5,E1,B24,E1,B1,E1,A5",
  "A4,E1,B25,E2,A6",
  "A4,E1,B27,E1,A5",
  "A3,E1,B29,E1,A4",
  "A4,E3,B3,D1,B5,D1,B14,D1,B1,E1,A4",
  "A5,E1,B3,D2,B3,D3,B9,D3,B2,D1,E1,A5",
  "A5,E1,D7,B1,D3,B3,D2,B2,D1,B1,D4,B1,D2,E1,A4",
  "A5,E1,D10,B3,D3,B2,D9,E1,A4",
  "A4,E1,D3,E1,D14,B1,D9,E1,A4",
  "A4,E1,D3,E1,D12,H1,D6,E1,D2,E1,D1,E1,A4",
  "A3,E1,D3,E1,A1,E1,D2,E1,D4,H2,D2,H2,D3,E3,D2,E2,A5",
  "A4,E3,A3,E1,D1,E1,H7,D1,H3,E2,A3,E1,D1,E1,A6",
  "A11,E1,A1,H1,I5,H2,I2,H1,A6,E1,A7",
  "A11,G1,H1,I2,J3,I3,J1,I2,H1,G1,A12",
  "A10,G2,H1,I1,J2,H1,J2,I1,J3,I1,H1,G2,A11",
  "A10,G2,H1,I2,H1,G1,H1,I2,H1,I3,H1,G2,A11",
  "A11,G15,A12",
  "A12,G13,A13"
] as const;
export function paintMiniFarmTree(ctx: CanvasRenderingContext2D) {
  // Keep the preexisting 128x160 texture, origin and hitboxes intact.
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < RLE.length; y++) {
    let x = 0;
    for (const token of RLE[y]!.split(',')) {
      if (!token) continue;
      const code = token[0]!;
      const count = Number(token.slice(1));
      if (code !== 'A') {
        ctx.fillStyle = COLORS[code]!;
        ctx.fillRect(7 + x * 3, 20 + y * 3, count * 3, 3);
      }
      x += count;
    }
  }
  ctx.restore();
}
