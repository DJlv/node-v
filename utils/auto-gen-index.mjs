import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  getDocSections,
  getChildDirs,
  shouldHaveAutoHome,
} from "./auto-gen-sidebar.mjs";

const DIR_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export { shouldHaveAutoHome as shouldHaveAutoIndex };

export function getAutoHomeLogicalPaths() {
  const paths = [];

  for (const section of getDocSections()) {
    const sectionRel = `docs/${section}`;
    if (shouldHaveAutoHome(sectionRel)) {
      paths.push(`${sectionRel}/home.md`);
    }
  }

  return paths;
}

function buildHomeContent(relativeDir) {
  const name = path.basename(relativeDir);
  return `---
layout: home
hero:
  name: ${name}
  text:
---
`;
}

function cleanupStaleHomes(activePaths) {
  const activeSet = new Set(
    activePaths.map((p) => path.join(DIR_PATH, p.replace(/\//g, path.sep))),
  );

  for (const section of getDocSections()) {
    walkStaleHomes(path.join(DIR_PATH, "docs", section), activeSet);
  }
}

function walkStaleHomes(dirPath, activeSet) {
  if (!fs.existsSync(dirPath)) return;

  const homeFile = path.join(dirPath, "home.md");
  if (fs.existsSync(homeFile) && !activeSet.has(homeFile)) {
    const content = fs.readFileSync(homeFile, "utf-8");
    if (content.includes("layout: home") && content.includes("hero:")) {
      fs.unlinkSync(homeFile);
    }
  }

  for (const name of getChildDirs(dirPath)) {
    walkStaleHomes(path.join(dirPath, name), activeSet);
  }
}

/** 生成各目录下的 home.md（自动维护，已 gitignore，不是 index.md） */
export function prepareAutoHomes() {
  const logicalPaths = getAutoHomeLogicalPaths();
  cleanupStaleHomes(logicalPaths);

  for (const logicalPath of logicalPaths) {
    const homeFile = path.join(DIR_PATH, logicalPath.replace(/\//g, path.sep));
    fs.mkdirSync(path.dirname(homeFile), { recursive: true });
    fs.writeFileSync(homeFile, buildHomeContent(path.dirname(logicalPath)), "utf-8");
  }

  return { count: logicalPaths.length };
}

export function resolveLogicalPagePath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.endsWith("/home.md")) return normalized;
  return null;
}
