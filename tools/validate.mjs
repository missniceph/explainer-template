#!/usr/bin/env node
/*
 * Checks content files the same way the web page does.
 *
 *   node tools/validate.mjs                    (checks every file in content/)
 *   node tools/validate.mjs content/topic.json (checks one file)
 *
 * Exits with an error code if a file has errors, so the GitHub Action
 * shows a red ✗ instead of letting a broken explainer go live unnoticed.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateContent } from "../assets/engine.js";

const files = process.argv.slice(2);
if (files.length === 0) {
  for (const f of readdirSync("content")) if (f.endsWith(".json")) files.push(join("content", f));
}

const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10); // Philippine date
let failed = false;

for (const file of files) {
  console.log(`\nChecking ${file}`);
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    console.log(`  ✗ Not valid JSON: ${err.message}`);
    console.log(`    Look for a missing/extra comma, a missing quote, curly quotes “ ”, or // comments.`);
    failed = true;
    continue;
  }
  const { errors, warnings } = validateContent(data, { today });
  for (const e of errors) console.log(`  ✗ ${e.where}: ${e.message}`);
  for (const w of warnings) console.log(`  ! ${w.where}: ${w.message}`);
  if (errors.length) failed = true;
  console.log(errors.length
    ? `  → ${errors.length} error(s) to fix, ${warnings.length} warning(s).`
    : `  ✓ Looks good${warnings.length ? ` (${warnings.length} warning(s) worth a look)` : ""}.`);
}

process.exit(failed ? 1 : 0);
