#!/usr/bin/env node
/**
 * start-backend.js
 * Smart local backend launcher for development use only.
 *
 * Behaviour:
 *  - Refuses to run when NODE_ENV=production (backend is on Render).
 *  - Skips venv setup when:
 *      • venv already exists, AND
 *      • requirements.txt has not changed since last setup (hash stored in backend/.venv_hash)
 *  - Detects platform and picks the correct Python executable path.
 *  - Starts uvicorn with --reload on port 8000.
 *
 * Usage:
 *   npm run backend              # from project root
 *   NODE_ENV=production npm run backend  # exits with a clear message
 */

"use strict";

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ── Guard: never start local backend in production ─────────────────────────
const env = process.env.NODE_ENV || "development";
if (env === "production") {
  console.log(
    "ℹ  NODE_ENV=production — skipping local backend.\n" +
      "   The production backend is already running at:\n" +
      `   ${process.env.NEXT_PUBLIC_API_URL || "https://techsevaweb.onrender.com"}\n`
  );
  process.exit(0);
}

// ── Paths ──────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT, "backend");
const VENV_DIR = path.join(BACKEND_DIR, "venv");
const REQUIREMENTS = path.join(BACKEND_DIR, "requirements.txt");
const HASH_FILE = path.join(BACKEND_DIR, ".venv_hash");

const isWin = process.platform === "win32";
const VENV_PYTHON = isWin
  ? path.join(VENV_DIR, "Scripts", "python.exe")
  : path.join(VENV_DIR, "bin", "python");

// ── Helpers ────────────────────────────────────────────────────────────────
function md5(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(filePath)).digest("hex");
}

function needsSetup() {
  // Venv missing → always set up
  if (!fs.existsSync(VENV_PYTHON)) {
    console.log("⚙  Virtual environment not found — running setup...");
    return true;
  }

  // requirements.txt changed since last setup?
  const currentHash = md5(REQUIREMENTS);
  const savedHash = fs.existsSync(HASH_FILE)
    ? fs.readFileSync(HASH_FILE, "utf8").trim()
    : null;

  if (currentHash !== savedHash) {
    console.log("⚙  requirements.txt has changed — re-running setup...");
    return true;
  }

  console.log("✓  Virtual environment is up-to-date — skipping setup.");
  return false;
}

function runSetup() {
  console.log("─".repeat(60));
  try {
    execSync(`python ${path.join(BACKEND_DIR, "setup_venv.py")}`, {
      stdio: "inherit",
      cwd: ROOT,
    });
    // Save current requirements hash so next run skips setup
    fs.writeFileSync(HASH_FILE, md5(REQUIREMENTS), "utf8");
    console.log("─".repeat(60));
  } catch (err) {
    console.error("\n✗  Backend setup failed. Fix the error above and retry.");
    process.exit(1);
  }
}

function startUvicorn() {
  console.log(`\n🚀  Starting FastAPI (uvicorn) on http://localhost:8000\n`);

  const args = [
    "-m",
    "uvicorn",
    "main:app",
    "--reload",
    "--port",
    "8000",
    "--app-dir",
    BACKEND_DIR,
  ];

  const child = spawn(VENV_PYTHON, args, {
    stdio: "inherit",
    cwd: BACKEND_DIR,
    env: { ...process.env },
  });

  child.on("error", (err) => {
    console.error(`\n✗  Failed to start uvicorn: ${err.message}`);
    process.exit(1);
  });

  child.on("close", (code) => {
    if (code !== 0) {
      console.error(`\n⚠  uvicorn exited with code ${code}`);
      process.exit(code);
    }
  });

  // Forward SIGINT / SIGTERM so Ctrl-C shuts down cleanly
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
      child.kill(sig);
    });
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
console.log("\n📦  Fluenzy-AI — Local Backend Launcher");
console.log(`    Environment : ${env}`);
console.log(
  `    Production API: ${
    process.env.NEXT_PUBLIC_API_URL || "https://techsevaweb.onrender.com"
  }\n`
);

if (needsSetup()) {
  runSetup();
}

startUvicorn();
