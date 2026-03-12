#!/usr/bin/env python3
"""
display-otp.py — Drive the GME12864 128x64 I2C display to show or clear an OTP code.

Usage:
    python3 display-otp.py show <otp> <email>
    python3 display-otp.py clear

Environment variables:
    DISPLAY_OTP_I2C_BUS      I2C bus number (default: 0)
    DISPLAY_OTP_I2C_ADDRESS  I2C address in hex (default: 0x3C)

Dependencies:
    pip3 install luma.oled Pillow
"""

import sys
import os
from luma.core.interface.serial import i2c
from luma.oled.device import ssd1306
from luma.core.render import canvas
from PIL import ImageFont

I2C_BUS = int(os.environ.get("DISPLAY_OTP_I2C_BUS", "0"))
I2C_ADDRESS = int(os.environ.get("DISPLAY_OTP_I2C_ADDRESS", "0x3C"), 16)

def get_device():
    serial = i2c(port=I2C_BUS, address=I2C_ADDRESS)
    return ssd1306(serial, width=128, height=64)

def show_otp(otp: str, email: str):
    device = get_device()

    # Truncate email if too long to fit on 128px width
    max_email_len = 20
    display_email = email if len(email) <= max_email_len else email[:max_email_len - 1] + "…"

    with canvas(device) as draw:
        # Title bar
        draw.rectangle((0, 0, 127, 12), fill="white")
        draw.text((4, 1), "AuroraHome", fill="black", font=ImageFont.load_default())

        # Email
        draw.text((4, 16), display_email, fill="white", font=ImageFont.load_default())

        # OTP code — large, centered
        try:
            big_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
        except OSError:
            big_font = ImageFont.load_default()

        # Calculate text width to center it
        try:
            bbox = draw.textbbox((0, 0), otp, font=big_font)
            text_width = bbox[2] - bbox[0]
        except AttributeError:
            text_width = len(otp) * 14  # fallback estimate

        x = (128 - text_width) // 2
        draw.text((x, 30), otp, fill="white", font=big_font)

        # Expiry hint
        draw.text((4, 56), "Expires in 5 min", fill="white", font=ImageFont.load_default())

def clear_screen():
    device = get_device()
    device.clear()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: display-otp.py show <otp> <email> | display-otp.py clear", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "show":
        if len(sys.argv) < 4:
            print("Usage: display-otp.py show <otp> <email>", file=sys.stderr)
            sys.exit(1)
        show_otp(sys.argv[2], sys.argv[3])

    elif command == "clear":
        clear_screen()

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)
