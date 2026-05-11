import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..", "..", "..");
const required = [
  "dist/desktop/src/main.js",
  "dist/desktop/src/preload.js",
  "vendor/hermes-webui/server.py",
  "vendor/hermes-webui/api/routes.py",
  "vendor/hermes-agent/README.md"
];

let failed = false;
for (const rel of required) {
  const target = path.join(root, rel);
  if (!fs.existsSync(target)) {
    failed = true;
    console.error(`missing: ${rel}`);
  } else {
    console.log(`ok: ${rel}`);
  }
}

if (failed) process.exit(1);
