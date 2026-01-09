#!/usr/bin/env python3
"""Generate X/Twitter logo icons in various sizes."""

from PIL import Image, ImageDraw
import os

def create_x_icon(size):
    """Create an X logo icon."""
    # Create image with black background
    img = Image.new('RGB', (size, size), color='#000000')
    draw = ImageDraw.Draw(img)

    # Draw white X
    padding = size // 8
    draw.rectangle([padding, padding, size - padding, size - padding],
                   fill='white', outline=None)

    # Draw X bars in black
    bar_thickness = max(2, size // 8)
    center = size // 2

    # Draw diagonal bars to create X shape
    draw.polygon([
        (padding, padding),
        (size - padding, padding),
        (size - padding - bar_thickness, padding + bar_thickness),
        (padding + bar_thickness, padding + bar_thickness)
    ], fill='black')

    draw.polygon([
        (padding, size - padding),
        (size - padding, size - padding),
        (size - padding - bar_thickness, size - padding - bar_thickness),
        (padding + bar_thickness, size - padding - bar_thickness)
    ], fill='black')

    return img

def create_simple_x_icon(size):
    """Create a simpler X logo icon."""
    # Create image with black background
    img = Image.new('RGB', (size, size), color='#000000')
    draw = ImageDraw.Draw(img)

    # Calculate dimensions
    padding = size // 5
    thickness = max(2, size // 7)

    # Draw white X with rounded effect
    for i in range(thickness):
        offset = i - thickness // 2
        draw.line([
            (padding + offset, padding),
            (size - padding + offset, size - padding)
        ], fill='white', width=1)
        draw.line([
            (size - padding + offset, padding),
            (padding + offset, size - padding)
        ], fill='white', width=1)

    return img

# Create icons directory if it doesn't exist
os.makedirs('icons', exist_ok=True)

# Generate icons in all required sizes
sizes = [16, 32, 48, 128]
for size in sizes:
    icon = create_simple_x_icon(size)
    filename = f'icons/icon{size}.png'
    icon.save(filename, 'PNG')
    print(f'Created {filename}')

print('All icons generated successfully!')
