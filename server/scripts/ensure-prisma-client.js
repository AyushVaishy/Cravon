const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const serverRoot = path.resolve(__dirname, "..");
const schemaPath = path.join(serverRoot, "prisma/schema.prisma");
const prismaClientEntry = path.resolve(serverRoot, "../node_modules/.prisma/client/default.js");
const prismaClientTypes = path.resolve(serverRoot, "../node_modules/.prisma/client/index.d.ts");

const needsGenerate = () => {
  if (!fs.existsSync(prismaClientEntry)) return true;
  if (!fs.existsSync(schemaPath)) return false;

  const schemaMtime = fs.statSync(schemaPath).mtimeMs;
  const clientMtime = fs.existsSync(prismaClientTypes)
    ? fs.statSync(prismaClientTypes).mtimeMs
    : 0;

  return schemaMtime > clientMtime;
};

if (!needsGenerate()) {
  console.log("Prisma client is up to date.");
  process.exit(0);
}

console.log("Prisma schema changed or client missing. Running prisma generate...");
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCmd, ["prisma", "generate"], {
  cwd: serverRoot,
  stdio: "inherit",
  shell: false,
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
