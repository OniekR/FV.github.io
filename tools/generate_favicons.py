"""
Generate favicon PNG/ICO files from KR_fav.jpg using Pillow.

Usage:
  - Install Pillow if needed: pip install pillow
  - Run: python tools/generate_favicons.py

Outputs:
  - favicon-16x16.png
  - favicon-32x32.png
  - apple-touch-icon.png (180x180)
  - favicon.ico (contains 16x16 and 32x32)

Files are written into the repository root (same folder as KR_fav.jpg).
"""

from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'KR_fav.jpg'

if not SRC.exists():
    print(f"Source image not found: {SRC}")
    raise SystemExit(1)

with Image.open(SRC) as im:
    # Ensure RGBA for transparency-friendly icons
    im = im.convert('RGBA')

    sizes = {
        'favicon-16x16.png': (16, 16),
        'favicon-32x32.png': (32, 32),
        'apple-touch-icon.png': (180, 180),
    }

    out_dir = ROOT / 'assets' / 'favicons'
    out_dir.mkdir(parents=True, exist_ok=True)

    for name, size in sizes.items():
        out = out_dir / name
        resized = im.resize(size, Image.LANCZOS)
        resized.save(out, format='PNG')
        print(f'Wrote {out} ({size[0]}x{size[1]})')

    # Create .ico with multiple sizes
    ico_out = out_dir / 'favicon.ico'
    ico_sizes = [(16, 16), (32, 32)]
    ico_images = [im.resize(s, Image.LANCZOS) for s in ico_sizes]
    # PIL supports saving multiple sizes in an ICO when passing a list of images
    ico_images[0].save(ico_out, format='ICO', sizes=ico_sizes)
    print(f'Wrote {ico_out} (ICO with sizes: {ico_sizes})')

print('\nDone. Add these files to your repo and refresh your browser to see the new favicon.')