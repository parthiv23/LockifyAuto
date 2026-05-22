import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

/** Production: backend/.env — Development: backend/.env.development (falls back to .env) */
const envFile = isProduction
  ? ".env"
  : fs.existsSync(path.join(backendDir, ".env.development"))
    ? ".env.development"
    : ".env";

config({ path: path.join(backendDir, envFile) });

if (!isProduction) {
  console.log(`[env] Loaded ${envFile}`);
}
