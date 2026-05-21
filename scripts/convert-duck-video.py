"""
Convert source MP4 to alpha-channel WebM that preserves the duck's own black
pixels (outlines + eye) and only removes the EXTERIOR black background.

Pipeline:
  1. ffmpeg → trim first second, crop to a full-duck window, dump PNG frames
  2. Python → for each frame:
       a. Mark non-black pixels (any RGB channel > 4) — this is the
          "definitely duck" mask. Eye + outline pixels (pure black) are
          NOT in this mask yet.
       b. Dilate the mask by N pixels using numpy slice-OR. Any black pixel
          within N pixels of a non-black pixel gets pulled in — that's the
          outline + eye. Background black is far from non-black so it's left
          out.
       c. Inside the dilated region: keep original RGB (so outline pixels
          stay pure black). Outside: alpha 0.
  3. ffmpeg → re-encode processed PNG sequence as VP9 WebM with alpha.

Why this is faster than corner-flood-fill: O(N) numpy passes instead of
O(pixels) recursive Python flood. Each pass is ~6ms on 1120×1380 frames.
"""
import os
import shutil
import subprocess
import sys
import numpy as np
from PIL import Image

ROOT       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_MP4 = r'C:\Users\xande\Downloads\hf_20260521_085414_6490e7c3-6f25-457e-9ac0-0da560d29759.mp4'
FRAMES_DIR = os.path.join(ROOT, 'scripts', '.frames')
OUT_WEBM   = os.path.join(ROOT, 'public', 'duck-walk.webm')

FFMPEG = subprocess.check_output(
    ['node', '-e', "process.stdout.write(require('ffmpeg-static'))"],
    cwd=ROOT,
    text=True,
).strip()
print('ffmpeg:', FFMPEG)

# Wider crop than before — keeps the tail in frame across the whole walk
# cycle. Numbers came from inspecting source frames; safe margin on all sides.
CROP = 'crop=1200:1500:24:80'

# Outline-thickness in source pixels. The dilation passes need to reach this
# far from a non-black pixel to capture the full outline ring.
DILATE_N = 3

# ── 1. Extract frames ──────────────────────────────────────────────────
shutil.rmtree(FRAMES_DIR, ignore_errors=True)
os.makedirs(FRAMES_DIR, exist_ok=True)
subprocess.run([
    FFMPEG, '-y', '-ss', '1', '-i', SOURCE_MP4,
    '-vf', CROP,
    os.path.join(FRAMES_DIR, 'in_%04d.png'),
], check=True)

frames_in = sorted(f for f in os.listdir(FRAMES_DIR) if f.startswith('in_'))
print(f'Processing {len(frames_in)} frames via dilate-from-non-black…')


def dilate(mask, iterations):
    """4-connected boolean dilation via numpy slice-OR."""
    for _ in range(iterations):
        m = mask.copy()
        m[1:, :]  |= mask[:-1, :]
        m[:-1, :] |= mask[1:, :]
        m[:, 1:]  |= mask[:, :-1]
        m[:, :-1] |= mask[:, 1:]
        mask = m
    return mask


for i, name in enumerate(frames_in):
    src = os.path.join(FRAMES_DIR, name)
    dst = os.path.join(FRAMES_DIR, name.replace('in_', 'out_'))

    arr = np.array(Image.open(src).convert('RGB'))
    rgb = arr  # (h, w, 3)

    # 2a. "Definitely duck" mask = any RGB channel above near-black threshold.
    non_black = rgb.max(axis=2) > 4

    # 2b. Dilate to reclaim outlines + eye that are within DILATE_N of body.
    duck_region = dilate(non_black, iterations=DILATE_N)

    # 2c. Build RGBA — keep original colors inside, transparent outside.
    alpha = np.where(duck_region, 255, 0).astype(np.uint8)
    out_arr = np.dstack([rgb, alpha])
    Image.fromarray(out_arr, 'RGBA').save(dst)

    if i % 12 == 0:
        print(f'  frame {i + 1}/{len(frames_in)}')

# ── 3. Re-encode ───────────────────────────────────────────────────────
subprocess.run([
    FFMPEG, '-y',
    '-framerate', '24',
    '-i', os.path.join(FRAMES_DIR, 'out_%04d.png'),
    '-c:v', 'libvpx-vp9', '-b:v', '900k', '-pix_fmt', 'yuva420p',
    OUT_WEBM,
], check=True)
print('\nWrote', OUT_WEBM)
