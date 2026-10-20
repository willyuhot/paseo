import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mark = JSON.parse(
  await readFile(path.join(root, "packages/app/src/brand/nio-mark.json"), "utf8"),
);
const paths = (fill) => mark.paths.map((d) => `<path d="${d}" fill="${fill}"/>`).join("");
const gradient = `<defs><linearGradient id="nio" x1="31" y1="0" x2="209" y2="0" gradientUnits="userSpaceOnUse">${mark.stops.map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.color}"/>`).join("")}</linearGradient></defs>`;
const svg = (viewBox, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${gradient}${body}</svg>`;
const symbol = paths("url(#nio)");
const transparent = svg(mark.viewBox, symbol);
const tile = svg("0 0 240 240", `<rect width="240" height="240" rx="52" fill="#0C1019"/>${symbol}`);
// Standard macOS optical bounds: a tile 832/1024 wide, with a 96px safe inset.
const dock = svg(
  "0 0 1024 1024",
  `<rect x="96" y="96" width="832" height="832" rx="186" fill="#0C1019" stroke="#263044" stroke-width="3"/><g transform="translate(74 62) scale(3.65)">${symbol}</g>`,
);
const png = async (source, size, output) => {
  const buffer = await sharp(Buffer.from(source), { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  if (output) await writeFile(path.join(root, output), buffer);
  return buffer;
};
await mkdir(path.join(root, "branding/nio"), { recursive: true });
await writeFile(path.join(root, "branding/nio/mark.svg"), transparent);
await writeFile(path.join(root, "branding/nio/dock.svg"), dock);
await png(dock, 1024, "packages/desktop/assets/icon.png");
await png(dock, 1024, "packages/desktop/assets/icon-dev.png");
const nativeAssets = {
  "icon.png": svg("0 0 240 240", `<rect width="240" height="240" fill="#0C1019"/>${symbol}`),
  "android-icon-foreground.png": svg(
    "0 0 280 280",
    `<g transform="translate(20 20)">${symbol}</g>`,
  ),
  "splash-icon.png": transparent,
  "notification-icon.png": svg(mark.viewBox, paths("white")),
};
for (const [name, source] of Object.entries(nativeAssets)) {
  await png(
    source,
    name === "notification-icon.png" ? 96 : 1024,
    `packages/app/assets/images/${name}`,
  );
}
for (const [name, fill] of [
  ["butterfly-white.svg", "white"],
  ["butterfly-green.svg", "url(#nio)"],
]) {
  await writeFile(
    path.join(root, `packages/app/assets/images/${name}`),
    svg(mark.viewBox, paths(fill)),
  );
}
for (const [name, size] of [
  ["pwa-icon-192.png", 192],
  ["pwa-icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  await png(tile, size, `packages/app/public/${name}`);
}
await png(tile, 64, "packages/app/assets/images/favicon.png");
for (const theme of ["light", "dark"]) {
  for (const status of ["", "-running", "-attention"]) {
    const dot = status
      ? `<circle cx="205" cy="202" r="27" fill="${status === "-running" ? "#2DD4BF" : "#F59E0B"}" stroke="#0C1019" stroke-width="9"/>`
      : "";
    const favicon = tile.replace("</svg>", `${dot}</svg>`);
    await writeFile(
      path.join(root, `packages/app/assets/images/favicon-${theme}${status}.svg`),
      favicon,
    );
    await png(favicon, 64, `packages/app/assets/images/favicon-${theme}${status}.png`);
  }
}
// Windows supports PNG frames inside ICO. Include actual small frames, not just a 256px image.
const sizes = [16, 24, 32, 48, 64, 128, 256];
const frames = await Promise.all(sizes.map((size) => png(tile, size)));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
for (let i = 0; i < frames.length; i++) {
  const at = 6 + i * 16;
  header[at] = sizes[i] % 256;
  header[at + 1] = sizes[i] % 256;
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(frames[i].length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += frames[i].length;
}
await writeFile(
  path.join(root, "packages/desktop/assets/icon.ico"),
  Buffer.concat([header, ...frames]),
);
if (process.platform === "darwin") {
  const temporary = await mkdtemp(path.join(tmpdir(), "paseo-nio-icon-"));
  try {
    const iconset = path.join(temporary, "NIO.iconset");
    await mkdir(iconset);
    for (const size of [16, 32, 128, 256, 512]) {
      for (const scale of [1, 2]) {
        await writeFile(
          path.join(iconset, `icon_${size}x${size}${scale === 2 ? "@2x" : ""}.png`),
          await png(dock, size * scale),
        );
      }
    }
    execFileSync("iconutil", [
      "-c",
      "icns",
      iconset,
      "-o",
      path.join(root, "packages/desktop/assets/icon.icns"),
    ]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
} else {
  console.warn("Run on macOS to regenerate icon.icns with iconutil.");
}
console.log("Generated NIO Dock, native, PWA, favicon/status and notification assets.");
