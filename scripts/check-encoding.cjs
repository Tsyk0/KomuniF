const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "src");
const EXTENSIONS = new Set([".vue", ".ts", ".tsx", ".js", ".jsx", ".css", ".html"]);

function walk(dir, collector) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collector);
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      collector.push(fullPath);
    }
  }
}

function main() {
  const files = [];
  walk(ROOT, files);

  const broken = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (text.includes("\uFFFD")) {
      broken.push(path.relative(process.cwd(), file));
    }
  }

  if (broken.length > 0) {
    console.error("Encoding check failed. These files contain replacement character (�):");
    for (const f of broken) {
      console.error(` - ${f}`);
    }
    process.exit(1);
  }

  console.log(`Encoding check passed (${files.length} files scanned).`);
}

main();
