#!/usr/bin/env node
// Copies package.json's version into every plugin manifest
// (.claude-plugin/plugin.json and .devin-plugin/plugin.json).
// Runs as part of `npm run version`, immediately after `changeset version`.
// With --check it changes nothing and exits 1 if any version differs.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifests = [
  join(repo, ".claude-plugin", "plugin.json"),
  join(repo, ".devin-plugin", "plugin.json"),
];

const { version } = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
const check = process.argv.includes("--check");
let failed = false;

for (const pluginPath of manifests) {
  const name = pluginPath.slice(repo.length + 1);
  const source = readFileSync(pluginPath, "utf8");
  const plugin = JSON.parse(source);

  if (plugin.version === version) {
    console.log(`${name} version is ${version} (already in sync)`);
    continue;
  }

  if (check) {
    console.error(
      `${name} version is ${plugin.version}, package.json is ${version}. Run \`node scripts/sync-plugin-version.mjs\`.`,
    );
    failed = true;
    continue;
  }

  // Rewrite only the version line, to keep the key order and the formatting.
  const updated = source.replace(
    /("version"\s*:\s*")[^"]*(")/,
    `$1${version}$2`,
  );

  if (JSON.parse(updated).version !== version) {
    console.error(`Could not find a version field to replace in ${pluginPath}.`);
    failed = true;
    continue;
  }

  writeFileSync(pluginPath, updated);
  console.log(`${name} version ${plugin.version} -> ${version}`);
}

process.exit(failed ? 1 : 0);
