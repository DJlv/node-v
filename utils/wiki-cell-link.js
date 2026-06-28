import { SITE_BASE } from "./site-base.js";
import { buildDocsAssetUrl } from "./docs-asset-url.js";

const WIKI_TOKEN_RE =
  /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]|\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;

const EXCEL_FILE_RE = /\.(xlsx|xlsm|xls)$/i;
const PDF_FILE_RE = /\.pdf$/i;
const VIDEO_FILE_RE = /\.(mp4|webm|mov|ogg)$/i;
const AUDIO_FILE_RE = /\.(mp3|wav|m4a|flac|ogg)$/i;
const IMAGE_FILE_RE = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i;
const ATTACH_FILE_RE = /\.(zip|rar|7z|tar|gz|doc|docx|ppt|pptx)$/i;
const HTTP_URL_RE = /^https?:\/\//i;
const DOMAIN_LIKE_RE =
  /^([a-z][a-z0-9+.-]*:\/\/)?[a-z0-9][-a-z0-9.]*\.[a-z]{2,}(?:[/:?#][^\s]*)?$/i;

function classifyWikiTarget(target) {
  const file = target.trim();
  if (EXCEL_FILE_RE.test(file)) return "table";
  if (PDF_FILE_RE.test(file)) return "pdf";
  if (VIDEO_FILE_RE.test(file)) return "video";
  if (AUDIO_FILE_RE.test(file)) return "audio";
  if (IMAGE_FILE_RE.test(file)) return "image";
  if (ATTACH_FILE_RE.test(file)) return "attach";
  if (/\.[a-z0-9]+$/i.test(file)) return "attach";
  return "page";
}

function resolveCoLocatedAsset(mdDir, subDir, target) {
  const file = target.trim().replace(new RegExp(`^\\.?\\/?${subDir}[/\\\\]`, "i"), "");
  return mdDir
    ? `${mdDir}/${subDir}/${file.replace(/\\/g, "/")}`
    : `${subDir}/${file.replace(/\\/g, "/")}`;
}

function resolveAssetSubDir(target) {
  const file = target.trim().toLowerCase();
  if (EXCEL_FILE_RE.test(file)) return "excel";
  if (
    PDF_FILE_RE.test(file) ||
    VIDEO_FILE_RE.test(file) ||
    AUDIO_FILE_RE.test(file) ||
    ATTACH_FILE_RE.test(file)
  ) {
    return "files";
  }
  return "img";
}

function resolveWikiPagePath(target, mdDir) {
  const name = target.trim().replace(/\.md$/i, "").replace(/\\/g, "/");
  if (name.startsWith("docs/")) return name;
  if (name.includes("/")) return `docs/${name.replace(/^\/+/, "")}`;
  return mdDir ? `${mdDir}/${name}` : `docs/${name}`;
}

function toSiteHref(docPath, base = SITE_BASE) {
  const normalized = String(docPath || "").replace(/^\//, "");
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${normalized}`.replace(/\/{2,}/g, "/");
}

function resolveUrlTarget(target, mdDir, base = SITE_BASE) {
  const value = target.trim();
  if (!value) return { href: "#", external: false };

  if (HTTP_URL_RE.test(value)) {
    return { href: value, external: true };
  }

  if (value.startsWith("//")) {
    return { href: `https:${value}`, external: true };
  }

  if (/^(mailto:|tel:)/i.test(value)) {
    return { href: value, external: true };
  }

  if (value.startsWith("/")) {
    const href = value.startsWith(base) ? value : `${base.replace(/\/$/, "")}${value}`;
    return { href: href.replace(/\/{2,}/g, "/"), external: false };
  }

  if (DOMAIN_LIKE_RE.test(value)) {
    return {
      href: /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`,
      external: true,
    };
  }

  if (value.startsWith("docs/")) {
    return { href: toSiteHref(value, base), external: false };
  }

  return { href: toSiteHref(resolveWikiPagePath(value, mdDir), base), external: false };
}

function resolveEmbedTarget(target, pipe, mdDir, options = {}) {
  const { base = SITE_BASE, dev = false } = options;
  const label = pipe?.trim() || target.trim();
  const kind = classifyWikiTarget(target);

  if (kind === "page") {
    return {
      type: "link",
      kind: "embed",
      label,
      href: toSiteHref(resolveWikiPagePath(target, mdDir), base),
      external: false,
    };
  }

  const subDir = resolveAssetSubDir(target);
  const assetPath = resolveCoLocatedAsset(mdDir, subDir, target);
  return {
    type: "link",
    kind: "embed",
    label,
    href: buildDocsAssetUrl(assetPath, base, dev),
    external: true,
  };
}

function resolveWikiLinkTarget(target, pipe, mdDir, options = {}) {
  const { href, external } = resolveUrlTarget(target, mdDir, options.base);
  return {
    type: "link",
    kind: "wiki",
    label: "跳转",
    href,
    external,
  };
}

export function hasWikiCellSyntax(value) {
  const text = String(value ?? "");
  return /!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]/.test(text);
}

export function parseCellParts(value, mdDir = "", options = {}) {
  const text = String(value ?? "");
  if (!text.trim()) return [{ type: "text", text: "—" }];

  if (!hasWikiCellSyntax(text)) {
    return [{ type: "text", text }];
  }

  const parts = [];
  let lastIndex = 0;
  WIKI_TOKEN_RE.lastIndex = 0;

  for (let match = WIKI_TOKEN_RE.exec(text); match; match = WIKI_TOKEN_RE.exec(text)) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[0].startsWith("!")) {
      parts.push(resolveEmbedTarget(match[1], match[2], mdDir, options));
    } else {
      parts.push(resolveWikiLinkTarget(match[3], match[4], mdDir, options));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", text: text.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", text }];
}

export function mdDirFromTableUrls(urls) {
  const parts = String(urls || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  if (parts.length >= 2 && parts[parts.length - 2] === "excel") {
    parts.pop();
    parts.pop();
  } else if (parts.length >= 1) {
    parts.pop();
  }
  return parts.join("/");
}
