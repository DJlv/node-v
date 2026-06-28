import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { walkCoLocatedAssets } from "./sync-docs-assets.mjs";

const EXCEL_EXT = new Set([".xlsx", ".xlsm", ".xls"]);

function isWorkbookFile(filePath) {
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    return buf[0] === 0x50 && buf[1] === 0x4b;
  } finally {
    fs.closeSync(fd);
  }
}

/** 校验 docs 下 img、excel 资源，返回问题列表 */
export function validateDocsAssets(projectRoot) {
  const root =
    projectRoot ||
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const docsRoot = path.join(root, "docs");
  const issues = [];

  for (const filePath of walkCoLocatedAssets(docsRoot)) {
    const relative = path.relative(root, filePath).replace(/\\/g, "/");
    const { size } = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (size === 0) {
      issues.push({ type: "empty", file: relative });
      continue;
    }

    if (EXCEL_EXT.has(ext) && !isWorkbookFile(filePath)) {
      issues.push({ type: "invalid-xlsx", file: relative });
    }
  }

  return issues;
}

function formatIssue(issue) {
  if (issue.type === "empty") {
    return `[empty] ${issue.file}（0 字节，请重新保存）`;
  }
  return `[invalid-xlsx] ${issue.file}（不是有效的 xlsx 文件）`;
}

/** 打印校验结果；CI 环境下有问题则 exit 1 */
export function reportDocsAssetIssues(options = {}) {
  const { failOnIssues = !!process.env.CI, projectRoot } = options;
  const issues = validateDocsAssets(projectRoot);

  if (!issues.length) {
    console.log("[prep-docs] docs assets validation passed");
    return { ok: true, issues };
  }

  console.warn(`[prep-docs] found ${issues.length} docs asset issue(s):`);
  for (const issue of issues) {
    console.warn(`  - ${formatIssue(issue)}`);
  }

  if (failOnIssues) {
    process.exitCode = 1;
  }

  return { ok: false, issues };
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  reportDocsAssetIssues({ failOnIssues: process.argv.includes("--strict") });
}
