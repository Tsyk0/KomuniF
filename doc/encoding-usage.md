# 编码防复发使用说明

本文档用于说明本项目如何检查/修复前端中文乱码问题，以及日常如何使用脚本防止复发。

## 1. 已配置内容

项目已包含以下配置与脚本：

- `.editorconfig`
  - 全局固定 `utf-8`
  - 统一换行、缩进与尾部空格处理
- `.vscode/settings.json`
  - `files.encoding = "utf8"`
  - `files.autoGuessEncoding = false`
- `scripts/check-encoding.cjs`
  - 检查 `src` 下是否包含替换字符 `�`
- `scripts/check-garbled-text.cjs`
  - 检查典型乱码模式（例如连续问号、常见错码片段）
- `scripts/convert-gbk-to-utf8.cjs`
  - 对检测为 GBK 污染的文件执行转为 UTF-8

`package.json` 中可用命令：

- `npm run check:encoding`
- `npm run check:garbled`
- `npm run fix:encoding`
- `npm run verify:encoding`

## 2. 日常使用（推荐）

在每次提交前执行：

```bash
npm run verify:encoding
```

含义：

- 先跑 `check:encoding`，确保无 `�`
- 再跑 `check:garbled`，确保无典型乱码文本

若命令通过，说明当前编码状态正常。

## 3. 出现乱码时怎么处理

先修复，再复检：

```bash
npm run fix:encoding
npm run verify:encoding
```

说明：

- `fix:encoding` 只会转换“可确认是 GBK 污染”的文件，不会盲目全量重写
- 若修复后仍有乱码，通常表示文本内容已经不可逆损坏，需要从 git 历史恢复文案

## 4. 快速排查单个文件

以 `src/views/HomeView.vue` 为例：

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('src/views/HomeView.vue','utf8');const i=s.indexOf('title=');console.log(s.slice(i,i+120));"
```

若输出出现 `��`，说明文件内容本身已损坏，不是浏览器显示问题。

可尝试：

```bash
node -e "const fs=require('fs');const b=fs.readFileSync('src/views/HomeView.vue');const s=new TextDecoder('gbk').decode(b);const i=s.indexOf('title=');console.log(s.slice(i,i+120));"
```

如果 GBK 解码后恢复正常中文，说明该文件是 GBK 污染，可用 `fix:encoding` 修复。

## 5. 可选：提交前自动拦截

可使用 git hook 在 commit 前自动检查：

1. 新建 `.githooks/pre-commit`，内容：

```sh
#!/bin/sh
npm run verify:encoding
```

2. 执行一次：

```bash
git config core.hooksPath .githooks
```

配置后，若检测失败将阻止提交。

