#!/usr/bin/env python3
"""Remove baked checkerboard-transparency background via edge flood-fill."""
import sys
from collections import deque
from PIL import Image

def is_bg(r, g, b):
    # Near-white or near-light-gray, very low saturation (checker tiles).
    if min(r, g, b) < 220:
        return False
    if max(r, g, b) - min(r, g, b) > 12:
        return False
    return True

def remove_bg(path_in, path_out):
    img = Image.open(path_in).convert("RGBA")
    w, h = img.size
    px = img.load()
    visited = [[False]*w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h-1):
            r, g, b, a = px[x, y]
            if is_bg(r, g, b):
                q.append((x, y))
    for y in range(h):
        for x in (0, w-1):
            r, g, b, a = px[x, y]
            if is_bg(r, g, b):
                q.append((x, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h: continue
        if visited[y][x]: continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if not is_bg(r, g, b): continue
        px[x, y] = (0, 0, 0, 0)
        q.extend([(x+1,y),(x-1,y),(x,y+1),(x,y-1)])
    img.save(path_out)
    print(f"{path_in} -> {path_out}")

if __name__ == "__main__":
    for pair in sys.argv[1:]:
        src, dst = pair.split("::")
        remove_bg(src, dst)
