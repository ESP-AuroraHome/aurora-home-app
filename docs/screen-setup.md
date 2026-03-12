# OrangePi Screen Setup — GME12864 (I2C)

This guide explains how to connect and configure the GME12864 128×64 I2C display on an **OrangePi 3 LTS (Allwinner H6)** for the OTP screen feature.

---

## 1. Enable I2C via Device Tree Overlay

Edit `/boot/armbianEnv.txt` as root:

```bash
sudo nano /boot/armbianEnv.txt
```

Append `sun50i-h6-i2c0` to the existing `overlays=` line (space-separated). If you already have other overlays, keep them:

```
overlays=spi-spidev sun50i-h6-i2c0
```

> ⚠️ Only one `overlays=` line is allowed. Do **not** add a second one.

Save and reboot:

```bash
sudo reboot
```

---

## 2. Verify I2C is Active

After reboot, check that the I2C device node exists:

```bash
ls /dev/i2c-*
```

Scan the bus to confirm your screen is detected (address `3c` or `3d`):

```bash
i2cdetect -y 0
```

If `i2cdetect` is missing: `sudo apt install i2c-tools`

---

## 3. Add User to the i2c Group

So the app can access I2C without root:

```bash
sudo usermod -aG i2c $USER
```

Log out and back in (or reboot) for this to take effect.

---

## 4. Install the Node.js I2C Package

`i2c-bus` is listed as an `optionalDependency` in `package.json`. Running `npm install` in the project directory handles it automatically:

```bash
npm install
```

If the build fails (native addon compilation), install build tools first:

```bash
sudo apt install build-essential
npm install
```

---

## 5. Configure Environment Variables

In your `.env` file:

```env
DISPLAY_OTP_ENABLED=true       # enable the physical screen
DISPLAY_OTP_I2C_BUS=0          # I2C bus number (from /dev/i2c-X)
DISPLAY_OTP_I2C_ADDRESS=0x3C   # screen I2C address (0x3C or 0x3D)
```

> For local development on a laptop (no screen), use `DISPLAY_OTP_DEV_MODE=true` instead — this prints a mock screen in the Next.js terminal.

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `/dev/i2c-*` not found after reboot | Check `armbianEnv.txt` has only one `overlays=` line with `sun50i-h6-i2c0` |
| `i2cdetect -y 0` shows no device | Try buses 1 and 2 (`-y 1`, `-y 2`), update `DISPLAY_OTP_I2C_BUS` accordingly |
| Screen shows at `0x3D` instead of `0x3C` | Set `DISPLAY_OTP_I2C_ADDRESS=0x3D` in `.env` |
| `npm install` fails on i2c-bus | Run `sudo apt install build-essential` then retry |
| Permission denied on `/dev/i2c-0` | Run `sudo usermod -aG i2c $USER` and re-login |
