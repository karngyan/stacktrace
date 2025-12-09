#!/usr/bin/env node

/**
 * Stacktrace Visual Capture Script
 *
 * Automatically captures all poster and visual elements from HTML files
 * and saves them as PNG images.
 *
 * Usage:
 *   node capture-visuals.js                    # Capture all articles
 *   node capture-visuals.js articles/01.html   # Capture specific file
 *
 * Requirements:
 *   npm install puppeteer
 */

import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Elements to capture (by ID prefix)
  capturePatterns: [
    "poster-", // poster-dark, poster-light, poster-social, etc.
    "visual-", // visual-prng, visual-magic, etc.
    "code-", // code-slots-def, code-barrier, etc.
    "logo-", // logo-icon-only, etc.
    "brand-", // brand-poster
  ],
  // Output settings
  outputDir: "images",
  scale: 2, // 2x for retina quality
};

async function captureVisuals(htmlFile) {
  const absolutePath = path.resolve(htmlFile);
  const fileUrl = `file://${absolutePath}`;
  const baseName = path.basename(htmlFile, ".html");

  // Create output directory
  const outputDir = path.join(
    path.dirname(absolutePath),
    CONFIG.outputDir,
    baseName
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n📸 Capturing visuals from: ${htmlFile}`);
  console.log(`📁 Output directory: ${outputDir}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set viewport large enough for all elements
  await page.setViewport({
    width: 2400,
    height: 1600,
    deviceScaleFactor: CONFIG.scale,
  });

  await page.goto(fileUrl, { waitUntil: "networkidle0" });

  // Wait for fonts to load
  await page.evaluateHandle("document.fonts.ready");

  // Give a bit more time for any animations/transitions
  await new Promise((r) => setTimeout(r, 500));

  // Find all elements matching our patterns
  const elements = await page.evaluate((patterns) => {
    const results = [];
    const allElements = document.querySelectorAll("[id]");

    allElements.forEach((el) => {
      const id = el.id;
      if (patterns.some((pattern) => id.startsWith(pattern))) {
        const rect = el.getBoundingClientRect();
        results.push({
          id,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    return results;
  }, CONFIG.capturePatterns);

  console.log(`Found ${elements.length} elements to capture:\n`);

  // Capture each element
  for (const element of elements) {
    const outputPath = path.join(outputDir, `${element.id}.png`);

    try {
      const elementHandle = await page.$(`#${element.id}`);

      if (elementHandle) {
        await elementHandle.screenshot({
          path: outputPath,
          omitBackground: false,
        });

        const actualWidth = Math.round(element.width * CONFIG.scale);
        const actualHeight = Math.round(element.height * CONFIG.scale);

        console.log(`  ✅ ${element.id}.png (${actualWidth}x${actualHeight})`);
      } else {
        console.log(`  ⚠️  ${element.id} - element not found`);
      }
    } catch (err) {
      console.log(`  ❌ ${element.id} - ${err.message}`);
    }
  }

  await browser.close();

  console.log(`\n✨ Done! Images saved to: ${outputDir}\n`);

  return outputDir;
}

async function findHtmlFiles(dir) {
  const articlesDir = path.join(dir, "articles");
  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  return fs
    .readdirSync(articlesDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => path.join(articlesDir, file));
}

async function main() {
  const args = process.argv.slice(2);

  console.log("╔═══════════════════════════════════════╗");
  console.log("║   📷 Stacktrace Visual Capture Tool   ║");
  console.log("╚═══════════════════════════════════════╝");

  let filesToProcess = [];

  if (args.length > 0) {
    // Process specific files
    filesToProcess = args.filter((arg) => fs.existsSync(arg));

    if (filesToProcess.length === 0) {
      console.error("\n❌ No valid HTML files found in arguments");
      process.exit(1);
    }
  } else {
    // Find all HTML files in articles/
    filesToProcess = await findHtmlFiles(__dirname);

    if (filesToProcess.length === 0) {
      // Try current directory
      filesToProcess = await findHtmlFiles(process.cwd());
    }

    if (filesToProcess.length === 0) {
      console.error("\n❌ No HTML files found in articles/ directory");
      console.error(
        "   Run this script from the stacktrace directory, or pass file paths as arguments."
      );
      process.exit(1);
    }
  }

  console.log(`\nFound ${filesToProcess.length} file(s) to process`);

  for (const file of filesToProcess) {
    await captureVisuals(file);
  }

  console.log("🎉 All captures complete!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
