import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@spotify", "basic-pitch", "model");
const destination = join(root, "public", "models", "basic-pitch");

if (!existsSync(source)) {
  throw new Error("@spotify/basic-pitch is not installed. Run npm install before building.");
}

mkdirSync(destination, { recursive: true });
for (const name of ["model.json", "group1-shard1of1.bin"]) {
  copyFileSync(join(source, name), join(destination, name));
}

console.log("Basic Pitch model copied to public/models/basic-pitch.");
