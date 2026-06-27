import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const DIR_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_ROOT = "docs";

const ROOT_EXCLUDE = new Set([
  ".vitepress",
  "node_modules",
  ".idea",
  "assets",
  "componts",
  "sideBar.js",
  "allOther.js",
]);

const SCAN_EXCLUDE = new Set([
  ".vitepress",
  "node_modules",
  ".idea",
  "assets",
  "componts",
  "allOther.js",
  "sideBar.js",
]);

const isDirectory = (target) => fs.lstatSync(target).isDirectory();

const filterEntries = (names, exclude) =>
  names.filter((name) => !exclude.has(name));

const toUrlPath = (relativePath) =>
  `/${relativePath.replace(/\\/g, "/")}`;

const formatText = (name) => path.basename(name, path.extname(name));

const sortEntries = (entries) =>
  entries.sort((a, b) => {
    const aIsDir = isDirectory(a.fullPath);
    const bIsDir = isDirectory(b.fullPath);
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.name.localeCompare(b.name, "zh-CN");
  });

const sortNames = (dirPath, names) =>
  sortEntries(
    names.map((name) => ({
      name,
      fullPath: path.join(dirPath, name),
    })),
  ).map(({ name }) => name);

function getMarkdownFiles(dirPath) {
  return fs
    .readdirSync(dirPath)
    .filter(
      (file) =>
        file.endsWith(".md") && file !== "index.md" && file !== "home.md",
    );
}

function getChildDirs(dirPath) {
  return filterEntries(fs.readdirSync(dirPath), SCAN_EXCLUDE).filter((name) =>
    isDirectory(path.join(dirPath, name)),
  );
}

function getDocSections() {
  const docsPath = path.join(DIR_PATH, DOCS_ROOT);
  if (!fs.existsSync(docsPath)) return [];

  return sortNames(docsPath, filterEntries(fs.readdirSync(docsPath), ROOT_EXCLUDE))
    .filter((name) => isDirectory(path.join(docsPath, name)));
}

/** 仅一级 section 自动生成 home 首页；二级及以下用侧边栏导航，不再生成 home */
function shouldHaveAutoHome(relativeDir) {
  const normalized = relativeDir.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[0] === "docs" && parts.length === 2;
}

/** docs/测试/group-java/thread -> docs/测试 */
function getSectionRoot(relativePath) {
  const parts = relativePath.replace(/\\/g, "/").split("/");
  if (parts[0] === "docs" && parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return relativePath;
}

function getDirDepth(relativePath, sectionRoot) {
  const normalized = relativePath.replace(/\\/g, "/");
  const root = sectionRoot.replace(/\\/g, "/");
  if (!normalized.startsWith(root)) return 0;
  const rest = normalized.slice(root.length).replace(/^\//, "");
  return rest ? rest.split("/").length : 0;
}

/** docs/测试/group-java/thread -> docs/测试/group-java */
function getL2Root(relativePath) {
  const sectionRoot = getSectionRoot(relativePath);
  const depth = getDirDepth(relativePath, sectionRoot);
  if (depth === 0) return null;

  const rest = relativePath
    .replace(/\\/g, "/")
    .slice(sectionRoot.length)
    .replace(/^\//, "");
  const l2Name = rest.split("/")[0];
  return `${sectionRoot}/${l2Name}`;
}

function resolveDirLink(name, dirPath, pathname) {
  const mdFiles = getMarkdownFiles(dirPath);
  const childDirs = getChildDirs(dirPath);
  const relativeDir = path.relative(DIR_PATH, dirPath).replace(/\\/g, "/");
  const itemPath = `${pathname}/${name}`;
  const label = formatText(name);

  if (
    mdFiles.length === 1 &&
    mdFiles[0] === `${name}.md` &&
    childDirs.length === 0
  ) {
    return `${itemPath}/${label}`;
  }

  if (shouldHaveAutoHome(relativeDir)) {
    return `${itemPath}/home`;
  }

  if (mdFiles.length > 0) {
    const first = [...mdFiles].sort((a, b) => a.localeCompare(b, "zh-CN"))[0];
    return `${itemPath}/${formatText(first)}`;
  }

  if (childDirs.length > 0) {
    const first = sortNames(dirPath, childDirs)[0];
    return resolveDirLink(first, path.join(dirPath, first), itemPath);
  }

  return null;
}

/** 递归列出目录下所有文件夹与 md 文件 */
function buildDirTree(dirPath, urlPath) {
  const items = [];

  for (const name of sortNames(
    dirPath,
    filterEntries(fs.readdirSync(dirPath), SCAN_EXCLUDE),
  )) {
    const fullPath = path.join(dirPath, name);

    if (isDirectory(fullPath)) {
      const subUrlPath = `${urlPath}/${name}`;
      const label = formatText(name);
      const mdFiles = getMarkdownFiles(fullPath);
      const childDirs = getChildDirs(fullPath);

      if (
        mdFiles.length === 1 &&
        mdFiles[0] === `${name}.md` &&
        childDirs.length === 0
      ) {
        items.push({ text: label, link: `${subUrlPath}/${label}` });
        continue;
      }

      const subItems = buildDirTree(fullPath, subUrlPath);
      if (subItems.length > 0) {
        items.push({
          text: label,
          collapsed: true,
          items: subItems,
        });
      } else {
        const link = resolveDirLink(name, fullPath, urlPath);
        if (link) items.push({ text: label, link });
      }
      continue;
    }

    if (!name.endsWith(".md") || name === "index.md" || name === "home.md") continue;

    items.push({
      text: formatText(name),
      link: `${urlPath}/${formatText(name)}`,
    });
  }

  return items;
}

/** 一级 section 根：只列二级目录/文件 */
function buildSectionRootSidebar(relativePath) {
  const dirPath = path.join(DIR_PATH, relativePath);
  const urlPath = toUrlPath(relativePath);
  const items = [];

  for (const name of sortNames(
    dirPath,
    filterEntries(fs.readdirSync(dirPath), SCAN_EXCLUDE),
  )) {
    const fullPath = path.join(dirPath, name);

    if (isDirectory(fullPath)) {
      const link = resolveDirLink(name, fullPath, urlPath);
      if (link) items.push({ text: formatText(name), link });
      continue;
    }

    if (!name.endsWith(".md") || name === "index.md" || name === "home.md") continue;

    items.push({
      text: formatText(name),
      link: `${urlPath}/${formatText(name)}`,
    });
  }

  return items;
}

function buildL2Sidebar(l2RelativePath) {
  const dirPath = path.join(DIR_PATH, l2RelativePath);
  if (!fs.existsSync(dirPath) || !isDirectory(dirPath)) return [];
  return buildL3AndBelowSidebar(l2RelativePath);
}

/** 二级目录下的 md（无三级子目录时的兜底） */
function buildL2DirectMdItems(dirPath, urlPath) {
  const items = [];

  for (const name of sortNames(
    dirPath,
    filterEntries(fs.readdirSync(dirPath), SCAN_EXCLUDE),
  )) {
    if (!name.endsWith(".md") || name === "index.md" || name === "home.md") continue;

    items.push({
      text: formatText(name),
      link: `${urlPath}/${formatText(name)}`,
    });
  }

  return items;
}

/**
 * 三级及以下：只列二级目录下的子文件夹（及其内部全部 md），
 * 不含二级目录本身的 md（如 overview.md、home.md）
 */
function buildL3AndBelowSidebar(l2RelativePath) {
  const dirPath = path.join(DIR_PATH, l2RelativePath);
  const urlPath = toUrlPath(l2RelativePath);
  const items = [];

  for (const name of sortNames(
    dirPath,
    filterEntries(fs.readdirSync(dirPath), SCAN_EXCLUDE),
  )) {
    const fullPath = path.join(dirPath, name);
    if (!isDirectory(fullPath)) continue;

    const subUrlPath = `${urlPath}/${name}`;
    const label = formatText(name);
    const mdFiles = getMarkdownFiles(fullPath);
    const childDirs = getChildDirs(fullPath);

    if (
      mdFiles.length === 1 &&
      mdFiles[0] === `${name}.md` &&
      childDirs.length === 0
    ) {
      items.push({ text: label, link: `${subUrlPath}/${label}` });
      continue;
    }

    const subItems = buildDirTree(fullPath, subUrlPath);
    if (subItems.length > 0) {
      items.push({
        text: label,
        collapsed: true,
        items: subItems,
      });
    } else {
      const link = resolveDirLink(name, fullPath, urlPath);
      if (link) items.push({ text: label, link });
    }
  }

  if (items.length === 0) {
    return buildL2DirectMdItems(dirPath, urlPath);
  }

  return items;
}

function featuresFromSidebarItems(items) {
  return items.map((item) => ({
    title: item.text,
    details: "",
    link: item.link ?? item.items?.[0]?.link ?? "",
  }));
}

/**
 * 侧边栏规则（不含 docs）：
 * - 一级（section 根）：只列二级目录/文件
 * - 二级及以下任意页面：只列该二级目录下三级及以下的文件夹与文件
 */
function buildSidebarItems(relativePath, l2Cache = new Map()) {
  const dirPath = path.join(DIR_PATH, relativePath);
  if (!fs.existsSync(dirPath) || !isDirectory(dirPath)) return [];

  const sectionRoot = getSectionRoot(relativePath);
  const depth = getDirDepth(relativePath, sectionRoot);

  if (depth === 0) {
    return buildSectionRootSidebar(relativePath);
  }

  const l2Root = getL2Root(relativePath);
  if (!l2Cache.has(l2Root)) {
    l2Cache.set(l2Root, buildL2Sidebar(l2Root));
  }
  return l2Cache.get(l2Root);
}

function walkAllDirs(relativePath, sidebar, l2Cache = new Map()) {
  const dirPath = path.join(DIR_PATH, relativePath);
  if (!fs.existsSync(dirPath) || !isDirectory(dirPath)) return;

  const items = buildSidebarItems(relativePath, l2Cache);
  if (items.length > 0) {
    sidebar[`${toUrlPath(relativePath)}/`] = items;
  }

  for (const name of getChildDirs(dirPath)) {
    walkAllDirs(path.join(relativePath, name), sidebar, l2Cache);
  }
}

export function generateHomeFeatures(relativePath) {
  return featuresFromSidebarItems(buildSectionRootSidebar(relativePath));
}

export const set_sidebar = (pathname) => {
  const normalized = pathname.replace(/^\//, "");
  return buildSidebarItems(normalized);
};

export const generateNavbar = () =>
  getDocSections().map((section) => ({
    text: section,
    link: `/docs/${section}/home`,
  }));

export const generateAllSidebars = () => {
  const sidebar = {};
  const l2Cache = new Map();
  for (const section of getDocSections()) {
    walkAllDirs(path.join(DOCS_ROOT, section), sidebar, l2Cache);
  }
  return sidebar;
};

/** 一级 section 用短 key（笔记）；二级目录不再生成 home 卡片 */
export const generateHomeFeaturesMap = () => {
  const map = {};

  for (const section of getDocSections()) {
    const sectionRel = path.join(DOCS_ROOT, section).replace(/\\/g, "/");
    map[section] = generateHomeFeatures(sectionRel);
  }

  return map;
};

/** 根据页面目录路径解析 home features 的 map key */
export function resolveHomeFeaturesKey(sectionDir, map) {
  const normalized = sectionDir.replace(/\\/g, "/");
  if (map[normalized]?.length) return normalized;

  const parts = normalized.split("/");
  if (parts[0] === "docs" && parts.length >= 2) {
    return parts[1];
  }
  return normalized;
}

export { getMarkdownFiles, getChildDirs, getDocSections, shouldHaveAutoHome };
