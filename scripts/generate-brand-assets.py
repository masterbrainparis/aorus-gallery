#!/usr/bin/env python3
"""Generate ORUS web assets from the supplied high-resolution master symbol."""

from argparse import ArgumentParser
from pathlib import Path

from PIL import Image, ImageOps


def load_symbol(source: Path) -> Image.Image:
    Image.MAX_IMAGE_PIXELS = None
    rgba = Image.open(source).convert("RGBA")
    alpha_box = rgba.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError("The source image has no visible pixels")
    return rgba.crop(alpha_box)


def square_asset(symbol: Image.Image, size: int, occupancy: float = 0.76) -> Image.Image:
    target = max(1, round(size * occupancy))
    resized = ImageOps.contain(symbol, (target, target), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), "white")
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas.convert("RGB")


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()

    symbol = load_symbol(args.source)
    root = args.root.resolve()

    icon = square_asset(symbol, 512)
    icon.save(root / "app/icon.png", optimize=True)
    square_asset(symbol, 180).save(root / "app/apple-icon.png", optimize=True)
    icon.save(root / "public/logo.png", optimize=True)

    square_asset(symbol, 48).convert("RGBA").save(
        root / "app/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    og = Image.new("RGB", (1200, 630), "white")
    og_symbol = ImageOps.contain(symbol, (430, 430), Image.Resampling.LANCZOS)
    og.paste(og_symbol, ((og.width - og_symbol.width) // 2, (og.height - og_symbol.height) // 2), og_symbol)
    og.save(root / "app/opengraph-image.png", optimize=True)


if __name__ == "__main__":
    main()
