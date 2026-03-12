#!/usr/bin/env bash
# setup-orangepi.sh — Install npm dependencies for the GME12864 I2C screen
# Run as root: sudo bash scripts/setup-orangepi.sh

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Installing build tools..."
apt-get install -y build-essential python3 make g++

echo "Installing i2c-bus..."
cd "$APP_DIR"
npm install i2c-bus

echo ""
echo "Done! Test with:"
echo "  node scripts/display-otp.mjs show 123456 test@example.com"

