import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const src = resolve(process.cwd(), "public/assets/vox-logo.svg");
const out = resolve(process.cwd(), "public/assets/vox-logo.png");

async function main() {
  const svg = readFileSync(src);
  // Render at 2x the intrinsic size (1180×180) so it stays crisp in
  // retina email clients and in the generated PDF.
  const png = await sharp(svg, { density: 600 })
    .resize({ width: 1180, withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(out, png);
  console.log(`✅ ${out} — ${(png.length / 1024).toFixed(1)} KB`);
}

void main();
