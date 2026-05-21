// Convert the source MP4 (black background) into a WebM with alpha channel.
// Runs ffmpeg-static and writes the output into public/ so Vite serves it.
import ffmpegPath from 'ffmpeg-static';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const SOURCE = 'C:\\Users\\xande\\Downloads\\hf_20260521_085414_6490e7c3-6f25-457e-9ac0-0da560d29759.mp4';
const PUBLIC = path.resolve('public');
if (!existsSync(PUBLIC)) mkdirSync(PUBLIC, { recursive: true });

const OUT_WEBM = path.join(PUBLIC, 'duck-walk.webm');

// ── 1. Probe the source ──────────────────────────────────
console.log('--- ffmpeg version / source info ---');
try {
  // ffmpeg writes info to stderr; capture and print
  execSync(`"${ffmpegPath}" -hide_banner -i "${SOURCE}"`, {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
} catch (e) {
  // ffmpeg returns non-zero when called with no output — that's fine, the
  // stream info still printed to stderr above.
}

// ── 2. Convert to WebM with proper alpha ─────────────────
// Pipeline:
//   trim first 24 frames (1s) — skips the "grow-in" intro so we start
//     directly on the walking cycle
//   crop to a 720×1080 window centered on the walking duck, removing the
//     dead black padding that wastes pixels and makes the duck look tiny
//   colorkey black with similarity 0.18, soft edge 0.10
//   format=yuva420p carries the alpha channel through libvpx-vp9
const cmd = `"${ffmpegPath}" -y -ss 1 -i "${SOURCE}" ` +
  `-vf "crop=720:1080:20:160,colorkey=0x000000:0.18:0.10,format=yuva420p" ` +
  `-c:v libvpx-vp9 -b:v 800k -pix_fmt yuva420p ` +
  `-an "${OUT_WEBM}"`;
console.log('\n--- encoding WebM with alpha ---');
console.log(cmd);
execSync(cmd, { stdio: 'inherit' });
console.log('\nWrote', OUT_WEBM);
