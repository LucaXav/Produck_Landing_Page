"""
Strip the checker-transparency-preview background from the Higgsfield duck-with-pencil
PNG and emit a clean cursor PNG sized for browser <cursor> use (<= 128x128).

Why the structural approach:
  - The checker pattern uses two colors: grey ~(85,85,85) and black ~(1,1,1).
  - The duck's outline is PURE BLACK — same color as one of the checker squares.
  - A naive "erase all near-grey/near-black pixels" would eat the outline.
  - A parity-aware "erase pixels matching expected checker color at their grid
    position" still erases outline cells that happen to align with a black-supposed
    checker block.
  - Instead: identify pixels that are CLEARLY duck-colored (anything that's not
    near-grey AND not near-black), then dilate that mask by ~one pixel-art cell
    to absorb the outline ring. Everything outside that becomes transparent.

After cleanup: downsample to native pixel-art resolution (each duck cell is 12px
in the source), find the pencil-tip pixel, save as PNG. Browser cursor size cap
is 128x128 on Chrome / Firefox — we stay well under.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

SRC = Path(r'C:\Users\xande\Downloads\hf_20260522_024558_f9dc1351-9383-4c4f-8abe-ef06459a1139.png')
OUT_DIR = Path(__file__).parent.parent / 'public'
OUT_PATH = OUT_DIR / 'duck-pencil-cursor.png'

PIXEL_ART_CELL = 12  # source pixels per native pixel-art cell

def main():
    im = Image.open(SRC).convert('RGB')
    arr = np.array(im)
    H, W, _ = arr.shape

    # Checker squares are pure grey (~85,85,85) and pure black (~1,1,1) but the
    # boundaries between them have anti-aliased intermediate greys (e.g. 66,68,67
    # and 18,20,19). Match the whole monochromatic-dark family in one go: any
    # pixel where R/G/B are tightly equal AND max channel < 110.
    arr_i = arr.astype(np.int16)
    max_c = arr_i.max(axis=2)
    min_c = arr_i.min(axis=2)
    is_monochromatic = (max_c - min_c) <= 8
    is_dark = max_c <= 110
    is_checker_color = is_monochromatic & is_dark

    # "Definitely duck" = clearly NOT checker color (white feathers, orange beak,
    # yellow pencil shaft, pink eraser, wood tip, anti-aliased edge fuzz, etc.)
    definitely_duck = ~is_checker_color

    # Outline rescue: the duck's outline is pure black — same color as the
    # checker's black squares. So `definitely_duck` misses every outline pixel.
    # Recover them structurally: dilate `definitely_duck` by ~one art-cell to
    # build a "halo region", then within the halo, KEEP only pixels that look
    # like outline (near-black) and DROP anything else (grey checker fragments).
    # This isolates the outline ring without dragging adjacent checker squares
    # into the cursor.
    DILATE_R = PIXEL_ART_CELL  # 12 px — exactly one art-cell
    mask_im = Image.fromarray((definitely_duck.astype(np.uint8) * 255), mode='L')
    kernel = DILATE_R * 2 + 1
    halo_im = mask_im.filter(ImageFilter.MaxFilter(size=kernel))
    halo_region = np.array(halo_im) > 127

    near_black = max_c < 30  # near-pure-black pixels — outline candidates
    halo_only = halo_region & ~definitely_duck
    outline_rescue = halo_only & near_black

    keep = definitely_duck | outline_rescue

    # Compose RGBA: keep pixels at full alpha, drop the rest.
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[..., :3] = arr
    rgba[..., 3] = np.where(keep, 255, 0)

    # Crop to non-transparent bounding box (with 1-cell padding).
    ys, xs = np.where(keep)
    if len(xs) == 0:
        print('no duck pixels found — aborting'); sys.exit(1)
    pad = PIXEL_ART_CELL
    x0 = max(0, xs.min() - pad);  x1 = min(W, xs.max() + pad + 1)
    y0 = max(0, ys.min() - pad);  y1 = min(H, ys.max() + pad + 1)
    cropped = rgba[y0:y1, x0:x1]
    print(f'cropped to {cropped.shape[1]}x{cropped.shape[0]} (from {W}x{H})')

    # Downsample to a cursor-friendly resolution. Browsers cap CSS cursors at
    # 128x128 (Chrome/Firefox both bail to default if larger). Pick the highest
    # integer divisor of PIXEL_ART_CELL (12) that keeps max dim <= 96 — that
    # leaves headroom and lets each art-cell map to a clean nearest-neighbour
    # block (no sub-pixel blur).
    src_h, src_w = cropped.shape[:2]
    MAX_DIM = 96
    for art_px in (4, 3, 2, 1):  # 12/3=4, 12/4=3, 12/6=2, 12/12=1
        target_w = round(src_w / PIXEL_ART_CELL * art_px)
        target_h = round(src_h / PIXEL_ART_CELL * art_px)
        if max(target_w, target_h) <= MAX_DIM:
            break
    out_im = Image.fromarray(cropped).resize((target_w, target_h), Image.NEAREST)
    print(f'downsampled to {target_w}x{target_h} ({art_px}px per art-cell)')

    # Find pencil-tip hotspot: it's the bottom-left-most yellow/wood pixel
    # (the pencil's wooden point). Pencil shaft = yellow ~(230,180,50);
    # tip = wood/tan. Scan from bottom-left corner outward for the first
    # opaque non-white pixel that's in the brown/yellow range.
    out_arr = np.array(out_im)
    h, w = out_arr.shape[:2]
    hotspot = None
    # Scan diagonally from bottom-left — the tip points down-left in this art.
    for d in range(h + w):
        for y in range(h - 1, -1, -1):
            x = d - (h - 1 - y)
            if 0 <= x < w:
                r, g, b, a = out_arr[y, x]
                if a == 0:
                    continue
                # wood-tan or yellow pencil shaft hue
                if r > 140 and 60 < g < 200 and b < 120:
                    hotspot = (x, y)
                    break
        if hotspot:
            break
    print(f'pencil-tip hotspot (px): {hotspot}  (cursor size: {w}x{h})')

    out_im.save(OUT_PATH)
    print(f'wrote {OUT_PATH}')

if __name__ == '__main__':
    main()
