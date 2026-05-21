"""
Strip the baked-in checkerboard "transparency" pattern AND any white box
surrounding the sticky note. Writes the cleaned image to public/sticky-v01.png.

Strategy: flood-fill from the four corners across any pixel that is either
checkerboard gray (~213 or ~255 grayscale) or pure white. The flood stops at
the cream paper, the black outline, and the dark drop-shadow underneath the
note — so the entire silhouette stays intact, but everything beyond it goes
fully transparent.

Source defaults to the latest matching Higgsfield export in ~/Downloads if no
explicit path is provided; pass a path as the first CLI arg to override.
"""
import os
import sys
import glob
import numpy as np
from PIL import Image
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, 'public', 'sticky-v01.png')


def resolve_source():
    if len(sys.argv) > 1:
        return sys.argv[1]
    downloads = os.path.join(os.path.expanduser('~'), 'Downloads')
    candidates = sorted(
        glob.glob(os.path.join(downloads, 'hf_*sticky*.png')) +
        glob.glob(os.path.join(downloads, 'hf_*.png')),
        key=os.path.getmtime,
        reverse=True,
    )
    if not candidates:
        return DEST
    return candidates[0]


SRC = resolve_source()
print(f'source: {SRC}')

img = Image.open(SRC).convert('RGBA')
arr = np.array(img)
h, w = arr.shape[:2]
r = arr[:, :, 0].astype(int)
g = arr[:, :, 1].astype(int)
b = arr[:, :, 2].astype(int)

chroma = np.maximum(np.maximum(np.abs(r - g), np.abs(g - b)), np.abs(r - b))
brightness = (r + g + b) // 3
# Anything that LOOKS like the painted background: grayscale + bright.
# Cream paper (253,251,238) fails chroma check, so it's protected.
# Black outline (~0) fails brightness check, so it's protected.
is_bg_color = (chroma < 10) & (brightness > 170)

# Flood-fill from every border pixel that matches the background mask, so we
# only erase pixels that are actually reachable from outside the note.
visited = np.zeros((h, w), dtype=bool)
queue = deque()
for x in range(w):
    for y in (0, h - 1):
        if is_bg_color[y, x] and not visited[y, x]:
            visited[y, x] = True
            queue.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if is_bg_color[y, x] and not visited[y, x]:
            visited[y, x] = True
            queue.append((y, x))

while queue:
    y, x = queue.popleft()
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg_color[ny, nx]:
            visited[ny, nx] = True
            queue.append((ny, nx))

arr[visited, 3] = 0
arr[visited, :3] = 0  # zero RGB so resamplers don't bleed gray halos

Image.fromarray(arr, 'RGBA').save(DEST)
print(f'wiped {int(visited.sum())} px / kept {int((~visited).sum())} px')
print(f'wrote: {DEST}')
