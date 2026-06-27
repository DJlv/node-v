import { nextTick, watch } from "vue";
import { inBrowser, onContentUpdated } from "vitepress";

/** 折叠后可见行数 */
const DEFAULT_VISIBLE_LINES = 3;
/** 超过此行数才折叠 */
const DEFAULT_MIN_LINES = 4;

/**
 * 代码块默认折叠
 * @param {{ route: import('vitepress').Route; frontmatter: import('vue').Ref<Record<string, unknown>> }} vp
 * @param {boolean} [defaultAllFold=true]
 * @param {number} [visibleLines=3] 折叠后显示行数
 * @param {number} [minLines=4] 至少多少行才折叠
 */
export function useCodeBlockFold(
  vp,
  defaultAllFold = true,
  visibleLines = DEFAULT_VISIBLE_LINES,
  minLines = DEFAULT_MIN_LINES
) {
  const { route, frontmatter } = vp;

  const apply = () => {
    if (!inBrowser) return;
    nextTick(() => {
      requestAnimationFrame(() => {
        foldCodeBlocks(frontmatter.value, defaultAllFold, visibleLines, minLines);
      });
    });
  };

  onContentUpdated(apply);
  watch(() => route.path, apply);
}

function foldCodeBlocks(frontmatter, defaultAllFold, visibleLines, minLines) {
  let fm = defaultAllFold;
  if (frontmatter?.cbf !== undefined) {
    fm = frontmatter.cbf;
  }

  const blocks = document.querySelectorAll('.vp-doc div[class*="language-"]');
  blocks.forEach((el, index) => {
    if (el.classList.contains("fold")) {
      return;
    }

    const lineCount = getLineCount(el);
    const foldHeight = calcFoldHeight(el, visibleLines);

    if (lineCount < minLines) {
      return;
    }

    if (Array.isArray(fm)) {
      const nth = index + 1;
      const shouldFold = defaultAllFold
        ? !fm.includes(nth)
        : fm.includes(nth);
      if (shouldFold) {
        foldElement(el, foldHeight);
      }
      return;
    }

    if (defaultAllFold && fm) {
      foldElement(el, foldHeight);
    }
  });
}

function getLineCount(el) {
  const lineNumbers = el.querySelectorAll(".line-number");
  if (lineNumbers.length) {
    return lineNumbers.length;
  }

  const codeLines = el.querySelectorAll("code .line");
  if (codeLines.length) {
    return codeLines.length;
  }

  const code = el.querySelector("code");
  if (!code) {
    return 0;
  }

  return (code.textContent || "").split("\n").filter((line) => line.length > 0).length;
}

function calcFoldHeight(el, visibleLines) {
  const pre = el.querySelector("pre");
  if (!pre) {
    return visibleLines * 24 + 40;
  }

  const style = window.getComputedStyle(pre);
  const lineHeight = parseFloat(style.lineHeight) || 24;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingBottom = parseFloat(style.paddingBottom) || 0;

  return Math.ceil(paddingTop + paddingBottom + lineHeight * visibleLines);
}

function foldElement(el, height) {
  const display = window.getComputedStyle(el, null).getPropertyValue("display");
  const inDetails = el.parentElement?.classList.contains("details");

  if (display === "none" || inDetails) {
    observeTabBlock(el, height);
    return;
  }

  mountFold(el, height);
}

function observeTabBlock(el, height) {
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const target = mutation.target;
      if (
        mutation.attributeName === "class" &&
        target.classList.contains("active") &&
        getLineCount(el) >= DEFAULT_MIN_LINES
      ) {
        mountFold(el, height);
      }
    });
  }).observe(el, { attributeFilter: ["class"] });
}

function mountFold(el, height) {
  if (el.classList.contains("fold")) {
    return;
  }

  el.classList.add("fold");

  const pres = el.querySelectorAll("pre");
  pres.forEach((pre) => {
    pre.style.height = `${height}px`;
    pre.style.overflow = "hidden";
  });

  el.style.marginBottom = "48px";
  el.style.borderRadius = "8px 8px 0 0";

  const mask = document.createElement("div");
  mask.className = "codeblocks-mask";
  mask.style.backgroundImage =
    "linear-gradient(-180deg, rgba(0, 0, 0, 0) 0%, var(--vp-code-block-bg) 100%)";

  const foldBtn = document.createElement("div");
  foldBtn.className = "fold-btn";
  foldBtn.style.backgroundColor = "var(--vp-code-block-bg)";
  foldBtn.innerHTML = `<svg class="fold-btn-icon" viewBox="0 0 1024 1024" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M553.14 778.89l451.61-451.61c22.65-22.65 22.65-59.42 0-82.14-22.65-22.65-59.42-22.65-82.14 0L512 655.82 101.38 245.2c-22.65-22.65-59.42-22.65-82.14 0-22.65 22.65-22.65 59.42 0 82.14l451.69 451.69a58.08 58.08 0 0 0 82.14-.07z"/></svg>`;

  foldBtn.onclick = () => {
    const icon = el.querySelector(".fold-btn-icon");
    const maskEl = el.querySelector(".codeblocks-mask");
    pres.forEach((pre) => togglePre(pre, foldBtn, icon, maskEl, height));
  };

  el.appendChild(mask);
  el.appendChild(foldBtn);
}

function togglePre(pre, foldBtn, icon, maskEl, height) {
  if (pre.classList.contains("expand")) {
    const oldTop = foldBtn.getBoundingClientRect().top;
    pre.style.height = `${height}px`;
    pre.style.overflow = "hidden";
    pre.scrollTo(0, 0);
    pre.classList.remove("expand");
    if (maskEl) maskEl.style.height = "48px";
    if (icon) icon.classList.remove("turn");
    window.scrollTo(0, foldBtn.getBoundingClientRect().top + window.scrollY - oldTop);
    return;
  }

  pre.style.height = "auto";
  pre.style.overflow = "auto";
  pre.classList.add("expand");
  if (maskEl) maskEl.style.height = "0";
  if (icon) icon.classList.add("turn");
}
