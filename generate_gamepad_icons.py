#!/usr/bin/env python3
"""Generate gamepad/controller icons in various sizes."""

from PIL import Image, ImageDraw
import os

def create_gamepad_icon(size):
    """Create a gamepad icon."""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Calculate dimensions
    padding = size // 10
    body_width = size - (2 * padding)
    body_height = int(body_width * 0.6)  # Gamepad is wider than tall
    body_y = (size - body_height) // 2

    # Draw main body (rounded rectangle effect)
    # Use dark color for visibility
    body_color = (50, 50, 50, 255)  # Dark gray

    # Draw body as ellipse/rounded rect
    draw.ellipse([
        padding + body_height // 3,
        body_y,
        size - padding - body_height // 3,
        body_y + body_height
    ], fill=body_color)

    # Draw left stick (circle)
    stick_radius = max(2, size // 10)
    left_stick_x = padding + body_height // 2 + stick_radius + 2
    left_stick_y = body_y + body_height // 2
    draw.ellipse([
        left_stick_x - stick_radius,
        left_stick_y - stick_radius,
        left_stick_x + stick_radius,
        left_stick_y + stick_radius
    ], fill=(100, 100, 100, 255))

    # Draw right stick (circle)
    right_stick_x = size - padding - body_height // 2 - stick_radius - 2
    right_stick_y = body_y + body_height // 2
    draw.ellipse([
        right_stick_x - stick_radius,
        right_stick_y - stick_radius,
        right_stick_x + stick_radius,
        right_stick_y + stick_radius
    ], fill=(100, 100, 100, 255))

    # Draw D-pad (cross shape) on left side
    dpad_center_x = padding + body_height // 3 + stick_radius + 2
    dpad_center_y = body_y + body_height // 3
    dpad_size = max(2, size // 12)

    # Horizontal bar of D-pad
    draw.rectangle([
        dpad_center_x - dpad_size,
        dpad_center_y - dpad_size // 2,
        dpad_center_x + dpad_size,
        dpad_center_y + dpad_size // 2
    ], fill=(80, 80, 80, 255))

    # Vertical bar of D-pad
    draw.rectangle([
        dpad_center_x - dpad_size // 2,
        dpad_center_y - dpad_size,
        dpad_center_x + dpad_size // 2,
        dpad_center_y + dpad_size
    ], fill=(80, 80, 80, 255))

    # Draw action buttons (4 small circles) on right side
    button_radius = max(1, size // 16)
    button_center_x = size - padding - body_height // 3 - stick_radius - 2
    button_center_y = body_y + body_height // 3

    # Button positions: Y (top), X (left), B (right), A (bottom)
    offsets = [
        (0, -1),  # Y (top)
        (-1, 0),  # X (left)
        (1, 0),   # B (right)
        (0, 1)    # A (bottom)
    ]

    colors = [
        (100, 200, 100, 255),  # Green for Y
        (100, 100, 200, 255),  # Blue for X
        (200, 100, 100, 255),  # Red for B
        (200, 200, 100, 255)   # Yellow for A
    ]

    for i, (dx, dy) in enumerate(offsets):
        bx = button_center_x + dx * (button_radius * 3)
        by = button_center_y + dy * (button_radius * 3)
        draw.ellipse([
            bx - button_radius,
            by - button_radius,
            bx + button_radius,
            by + button_radius
        ], fill=colors[i])

    return img

# Create icons directory if it doesn't exist
os.makedirs('icons', exist_ok=True)

# Generate icons in all required sizes
sizes = [16, 32, 48, 128]
for size in sizes:
    icon = create_gamepad_icon(size)
    filename = f'icons/icon{size}.png'
    icon.save(filename, 'PNG')
    print(f'Created {filename}')

print('All gamepad icons generated successfully!')
