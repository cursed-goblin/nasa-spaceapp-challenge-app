#!/usr/bin/env node
/**
 * Validate the NASA resource drop-in manifest and the provisional dataset.
 *
 *   node scripts/check-resources.mjs
 *   node scripts/check-resources.mjs --strict
 *
 * The normal run is a readiness check and exits 0 while the official NASA pack
 * is still pending. --strict is the release gate and exits 1 until the pack has
 * been supplied, mapped and marked official/mixed.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = join(ROOT, "resources", "manifest.json");
const STRICT = process.argv.includes("--strict");
const SOURCE_STATUSES = new Set([
  "pending",
  "verified",
  "integrated-reference",
  "integrated-inspiration",
  "integrated-handoff",
  "deferred-adapter",
]);
const errors = [];
const warnings = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function note(message) {
  notes.push(message);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Cannot read ${relative(ROOT, path)}: ${error.message}`);
    return null;
  }
}

function assertFile(path, label) {
  if (!existsSync(join(ROOT, path))) {
    fail(`${label} is missing: ${path}`);
  }
}

function walkFiles(dir, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const absolute = join(dir, entry);
    const info = statSync(absolute);
    if (info.isDirectory()) walkFiles(absolute, results);
    else if (info.isFile()) results.push(absolute);
  }
  return results;
}

const manifest = readJson(MANIFEST_PATH);
if (!manifest) {
  finish();
} else {
  validate();
  finish();
}

function validate() {
  if (manifest.schemaVersion !== 1) {
    fail("resources/manifest.json must set schemaVersion to 1.");
  }

  const dataset = manifest.dataset ?? {};
  for (const field of ["name", "version", "status", "lastReviewed", "targetDirectory"]) {
    if (typeof dataset[field] !== "string" || !dataset[field].trim()) {
      fail(`dataset.${field} must be a non-empty string.`);
    }
  }

  const integration = manifest.integration ?? {};
  for (const field of ["state", "dropZone", "instructions", "validationCommand"]) {
    if (typeof integration[field] !== "string" || !integration[field].trim()) {
      fail(`integration.${field} must be a non-empty string.`);
    }
  }

  assertFile(dataset.uiStatusModule ?? "src/data/dataset.ts", "Dataset status module");
  assertFile(dataset.targetDirectory ?? "src/data/", "Dataset target directory");

  const datasetSource = readFileSync(
    join(ROOT, dataset.uiStatusModule ?? "src/data/dataset.ts"),
    "utf8",
  );
  const versionMatch = datasetSource.match(/version:\s*"([^"]+)"/);
  const statusMatch = datasetSource.match(/status:\s*"([^"]+)"/);
  if (!versionMatch || versionMatch[1] !== dataset.version) {
    fail(
      `Dataset version mismatch: manifest says ${dataset.version}, src/data/dataset.ts says ${versionMatch?.[1] ?? "unknown"}.`,
    );
  }
  if (!statusMatch || statusMatch[1] !== dataset.status) {
    fail(
      `Dataset status mismatch: manifest says ${dataset.status}, src/data/dataset.ts says ${statusMatch?.[1] ?? "unknown"}.`,
    );
  }

  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    fail("manifest.sources must contain at least one source.");
  }

  const sourceIds = new Set();
  for (const [index, source] of (manifest.sources ?? []).entries()) {
    const label = `sources[${index}]`;
    if (!source || typeof source !== "object") {
      fail(`${label} must be an object.`);
      continue;
    }
    for (const field of ["id", "name", "publisher", "kind", "status"]) {
      if (typeof source[field] !== "string" || !source[field].trim()) {
        fail(`${label}.${field} must be a non-empty string.`);
      }
    }
    if (sourceIds.has(source.id)) {
      fail(`${label}.id is duplicated: ${source.id}.`);
    }
    sourceIds.add(source.id);
    if (!SOURCE_STATUSES.has(source.status)) {
      fail(`${label}.status "${source.status}" is not a recognised integration state.`);
    }
    if (source.required === true && source.status === "pending") {
      if (STRICT) {
        fail(`${label} (${source.name}) is required but still pending.`);
      } else {
        warn(`Official source still pending: ${source.name}.`);
      }
    }
    if (source.url && !/^https:\/\//u.test(source.url)) {
      warn(`${label}.url is not HTTPS: ${source.url}`);
    }
    if (source.files !== undefined && !Array.isArray(source.files)) {
      fail(`${label}.files must be an array when present.`);
    }
    for (const file of source.files ?? []) {
      assertFile(file, `${label}.files entry`);
    }
    for (const feed of source.feeds ?? []) {
      assertFile(feed, `${label}.feeds entry`);
    }
    if (source.required === true && (source.files ?? []).length === 0) {
      warn(`${source.name} is required but lists no supplied files.`);
    }
  }

  const requiredPack = (manifest.sources ?? []).find(
    (source) => source.required === true && source.kind === "official-dataset",
  );
  if (!requiredPack) {
    fail("A required official-dataset source must be declared.");
  }

  const mappingIds = new Set();
  for (const [index, mapping] of (manifest.fieldMappings ?? []).entries()) {
    const label = `fieldMappings[${index}]`;
    for (const field of ["id", "target", "fallback"]) {
      if (typeof mapping[field] !== "string" || !mapping[field].trim()) {
        fail(`${label}.${field} must be a non-empty string.`);
      }
    }
    if (mappingIds.has(mapping.id)) {
      fail(`${label}.id is duplicated: ${mapping.id}.`);
    }
    mappingIds.add(mapping.id);
    assertFile(mapping.target, `${label}.target`);
    if (!Array.isArray(mapping.fields) || mapping.fields.length === 0) {
      fail(`${label}.fields must be a non-empty array.`);
    }
    if (!Array.isArray(mapping.sourceIds) || mapping.sourceIds.length === 0) {
      fail(`${label}.sourceIds must be a non-empty array.`);
    }
    for (const sourceId of mapping.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) {
        fail(`${label}.sourceIds references unknown source: ${sourceId}.`);
      }
    }
  }

  if (!Array.isArray(manifest.releaseChecklist) || manifest.releaseChecklist.length < 3) {
    fail("releaseChecklist must contain the release gate steps.");
  }

  const dropZone = join(ROOT, integration.dropZone ?? "resources/incoming");
  if (!existsSync(dropZone)) {
    fail(`Drop zone is missing: ${integration.dropZone ?? "resources/incoming"}`);
  } else {
    const incoming = walkFiles(dropZone);
    const declared = new Set(
      (manifest.sources ?? []).flatMap((source) =>
        (source.files ?? []).map((file) => resolve(ROOT, file)),
      ),
    );
    const unlisted = incoming.filter((file) => !declared.has(file));
    if (incoming.length > 0) {
      note(`${incoming.length} file${incoming.length === 1 ? "" : "s"} present in the drop zone.`);
    }
    if (unlisted.length > 0) {
      warn(
        `${unlisted.length} drop-zone file${unlisted.length === 1 ? "" : "s"} not listed in the manifest: ${unlisted
          .map((file) => relative(ROOT, file))
          .join(", ")}`,
      );
    }
    if (STRICT && incoming.length === 0) {
      fail("The official-resource drop zone is empty.");
    }
  }

  if (dataset.status === "provisional") {
    if (STRICT) {
      fail("Dataset is still provisional. Update src/data/dataset.ts and the manifest before release.");
    } else {
      warn("Dataset is provisional. Run with --strict for the release gate.");
    }
  }
}

function finish() {
  console.log("TRADEOFF resource integration check\n");
  for (const item of notes) console.log(`  note  ${item}`);
  for (const item of warnings) console.log(`  warn  ${item}`);
  for (const item of errors) console.error(`  FAIL  ${item}`);

  if (errors.length > 0) {
    console.error(`\n${errors.length} error${errors.length === 1 ? "" : "s"} found.`);
    process.exitCode = 1;
    return;
  }

  const status = STRICT ? "release gate passed" : "provisional check passed";
  console.log(
    `\n${status}. ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`,
  );
  if (!STRICT) {
    console.log("Official pack is not required for local development; use --strict before release.");
  }
}
