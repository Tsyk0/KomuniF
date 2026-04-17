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

function hasReplacementChar(text) {
  return text.includes("\uFFFD");
}

function shouldConvert(buffer) {
  const utf8Text = buffer.toString("utf8");
  if (!hasReplacementChar(utf8Text)) return false;
  const gbkText = new TextDecoder("gbk").decode(buffer);
  return !hasReplacementChar(gbkText);
}

function main() {
  const files = [];
  walk(ROOT, files);

  const converted = [];
  for (const file of files) {
    const buf = fs.readFileSync(file);
    if (!shouldConvert(buf)) continue;
    const gbkText = new TextDecoder("gbk").decode(buf);
    fs.writeFileSync(file, gbkText, "utf8");
    converted.push(path.relative(process.cwd(), file));
  }

  console.log(`Converted files: ${converted.length}`);
  for (const f of converted) {
    console.log(` - ${f}`);
  }

  const remain = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (hasReplacementChar(text)) {
      remain.push(path.relative(process.cwd(), file));
    }
  }

  console.log(`Remaining files with replacement char: ${remain.length}`);
  for (const f of remain) {
    console.log(` * ${f}`);
  }
}

main();
