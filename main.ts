// Entry program for make.fun "Sum up 26 November's world news in one image".
//
// The front page itself (entry.png, 1024x1024) is rendered from page.html in
// this repository, so the program's only job is to place that exact file into
// the output directory. Copying instead of re-rendering keeps both grader
// runs byte-identical, which is what the bounty requires.
//
// Run locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function abort(message: string): never {
  throw new Error(`news-image-20261126: ${message}`);
}

function main(): void {
  const repoRoot = new URL(".", import.meta.url).pathname;
  const sourcePath = join(repoRoot, "entry.png");
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const targetPath = resolve(outputDir, "entry.png");

  let stats;
  try {
    stats = statSync(sourcePath);
  } catch {
    abort(`cannot find entry image at ${sourcePath}`);
  }
  if (stats.size === 0) abort(`entry image is empty: ${sourcePath}`);

  const head = readFileSync(sourcePath);
  if (!head.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    abort(`entry image is not a PNG file: ${sourcePath}`);
  }

  // The bounty caps the image at 1 MiB and 1024x1024 pixels. The IHDR chunk
  // carries the width at bytes 16-19 and the height at bytes 20-23,
  // big-endian; refuse anything outside the limits instead of shipping it.
  const MAX_BYTES = 1024 * 1024;
  if (stats.size > MAX_BYTES) {
    abort(`entry image is ${stats.size} bytes, over the 1 MiB cap`);
  }
  if (head.length < 24) abort(`entry image is too short to hold an IHDR`);
  const width = head.readUInt32BE(16);
  const height = head.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    abort(`entry image must be 1024x1024, got ${width}x${height}`);
  }

  mkdirSync(outputDir, { recursive: true });
  copyFileSync(sourcePath, targetPath);

  const copied = statSync(targetPath);
  if (copied.size !== stats.size) {
    abort(
      `copy is incomplete: ${targetPath} is ${copied.size} bytes, ` +
        `expected ${stats.size}`,
    );
  }
  console.log(`wrote ${targetPath} (${stats.size} bytes)`);
}

main();
