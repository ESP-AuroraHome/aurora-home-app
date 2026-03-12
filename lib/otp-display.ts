import { spawn } from "child_process";
import path from "path";

const isEnabled = process.env.DISPLAY_OTP_ENABLED === "true";
const isDevMode = process.env.DISPLAY_OTP_DEV_MODE === "true";
const isLinux = process.platform === "linux";

const scriptPath = path.join(process.cwd(), "scripts", "display-otp.py");

// ANSI helpers
const reset = "\x1b[0m";
const bold = "\x1b[1m";
const cyan = "\x1b[36m";
const white = "\x1b[37m";
const bgBlack = "\x1b[40m";

function printMockScreen(otp: string, email: string): void {
  const width = 36;
  const border = "═".repeat(width);
  const pad = (text: string, w: number) => text + " ".repeat(Math.max(0, w - text.length));
  const center = (text: string, w: number) => {
    const total = Math.max(0, w - text.length);
    const left = Math.floor(total / 2);
    const right = total - left;
    return " ".repeat(left) + text + " ".repeat(right);
  };

  const truncatedEmail = email.length > width - 2 ? email.slice(0, width - 3) + "…" : email;
  const otpCentered = center(otp, width - 2);

  console.log(`\n${cyan}${bold}╔${border}╗`);
  console.log(`║${bgBlack}${white}${bold}  ${pad("AuroraHome", width - 2)}${reset}${cyan}${bold}║`);
  console.log(`║  ${white}${pad(truncatedEmail, width - 2)}${reset}${cyan}${bold}║`);
  console.log(`║${" ".repeat(width)}║`);
  console.log(`║${white}${bold}${otpCentered}${reset}${cyan}${bold}║`);
  console.log(`║${" ".repeat(width)}║`);
  console.log(`║  ${white}${pad("Expires in 5 min", width - 2)}${reset}${cyan}${bold}║`);
  console.log(`╚${border}╝${reset}\n`);
}

function printMockClear(): void {
  console.log(`\n${cyan}${bold}[ SCREEN CLEARED ]${reset}\n`);
}

function runScript(args: string[]): void {
  if (isDevMode) {
    if (args[0] === "show") {
      printMockScreen(args[1], args[2]);
    } else if (args[0] === "clear") {
      printMockClear();
    }
    return;
  }

  if (!isEnabled || !isLinux) return;

  const child = spawn("python3", [scriptPath, ...args], {
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
    },
  });

  child.unref();
}

export function displayOTPOnScreen(otp: string, email: string): void {
  runScript(["show", otp, email]);
}

export function clearScreen(): void {
  runScript(["clear"]);
}
