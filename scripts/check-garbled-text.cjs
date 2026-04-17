const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "src");
const EXTENSIONS = new Set([".vue", ".ts", ".tsx", ".js", ".jsx", ".css", ".html"]);
const SUSPICIOUS_PATTERNS = [
  /\?{3,}/g,
  /缇よ亰/g,
  /鐢ㄦ埛/g,
  /鍔犺浇/g,
  /娑堟伅/g
];

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

  const findings = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of SUSPICIOUS_PATTERNS) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        findings.push({
          file: path.relative(process.cwd(), file),
          pattern: pattern.toString(),
          count: matches.length
        });
      }
    }
  }

  if (findings.length > 0) {
    console.error("Garbled-text check found suspicious content:");
    for (const item of findings) {
      console.error(` - ${item.file} | ${item.pattern} | matches=${item.count}`);
    }
    process.exit(1);
  }

  console.log(`Garbled-text check passed (${files.length} files scanned).`);
}

main();
