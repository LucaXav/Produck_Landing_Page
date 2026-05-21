// Convert the pen-duck MP4 (black background) into a WebM with alpha channel.
// Mirrors convert-duck-video.mjs — colorkey on pure black + libvpx-vp9 with
// yuva420p so the alpha rides through to the browser.
import ffmpegPath from 'ffmpeg-static';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const SOURCE = 'C:\\Users\\xande\\Downloads\\hf_20260521_131643_f6b2292b-5494-4bfe-9791-13ee43a72070.mp4';
const PUBLIC = path.resolve('public');
if (!existsSync(PUBLIC)) mkdirSync(PUBLIC, { recursive: true });

const OUT_WEBM = path.join(PUBLIC, 'duck-pen.webm');

console.log('--- source info ---');
try {
  execSync(`"${ffmpegPath}" -hide_banner -i "${SOURCE}"`, {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
} catch {
  // ffmpeg exits non-zero when called without output; info still printed.
}

// Surgical pipeline tuned to the actual source pixel values (probed via
// `ffmpeg -vf crop=2:2:X:Y -pix_fmt rgb24` against the source):
//   - Backdrop      = #ECEDE5 (cream)
//   - Halo around   = grays in the 0xC8C5BD..0x99938C band — these are the
//     duck's anti-aliased outline edges where the black stroke fades into
//     the cream. The tight cream key alone doesn't reach them, so the
//     halo reads as a dark ring "around the dark".
//   - Foot shadow   = #99938C
// We chain multiple colorkeys, each tuned narrow enough that it can't
// reach duck whites (255,255,255), the orange beak/feet, or the body's
// internal colour — all of those sit very far in RGB space from cream
// and from any of the halo greys.
//
// Distance sanity (duck whites are the closest "safe" target):
//   white→cream    ≈ 37     similarity 0.10 → reach 25  ✓ safe
//   white→0xC8C5BD ≈ 103    similarity 0.16 → reach 41  ✓ safe
//   white→0xA09A92 ≈ 138    similarity 0.20 → reach 51  ✓ safe
//   white→0x99938C ≈ 152    similarity 0.14 → reach 36  ✓ safe
//
// Pipeline:
//   1. crop=960:1278:144:200      — tight window so the duck reads at
//                                   the same on-screen size as the walk
//                                   sprite (~79% of container height).
//   2. colorkey=0xECEDE5:0.10:0.08 — main cream backdrop. Widened from
//                                   0.06 so it pulls in the subtle cream
//                                   variation across the frame, not just
//                                   the corner pixel value.
//   3. colorkey=0xC8C5BD:0.16:0.12 — first halo band (light grey, ~80%
//                                   cream + 20% black). Catches the
//                                   lightest fringe.
//   4. colorkey=0xA09A92:0.20:0.12 — second halo band (mid grey, ~50/50)
//                                   plus the foot-shadow gradient core.
//   5. colorkey=0x99938C:0.14:0.08 — the exact foot-shadow value probed
//                                   from the source — backstop for any
//                                   shadow pixel the previous step
//                                   missed.
//   6. format=yuva420p             — prep for libvpx-vp9 encoding.
const cmd = `"${ffmpegPath}" -y -i "${SOURCE}" ` +
  `-vf "crop=960:1278:144:200,` +
  `colorkey=0xECEDE5:0.10:0.08,` +
  `colorkey=0xC8C5BD:0.16:0.12,` +
  `colorkey=0xA09A92:0.20:0.12,` +
  `colorkey=0x99938C:0.14:0.08,` +
  `format=yuva420p" ` +
  `-c:v libvpx-vp9 -b:v 800k -pix_fmt yuva420p ` +
  `-an "${OUT_WEBM}"`;
console.log('\n--- encoding WebM with alpha ---');
console.log(cmd);
execSync(cmd, { stdio: 'inherit' });
console.log('\nWrote', OUT_WEBM);
