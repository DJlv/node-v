import CFB from "cfb";

const INDEXED_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
  "#800000", "#008000", "#000080", "#808000", "#800080", "#008080", "#C0C0C0", "#808080",
  "#9999FF", "#993366", "#FFFFCC", "#CCFFFF", "#660066", "#FF8080", "#0066CC", "#CCCCFF",
  "#000080", "#FF00FF", "#FFFF00", "#00FFFF", "#800080", "#800000", "#008080", "#0000FF",
  "#00CCFF", "#CCFFFF", "#CCFFCC", "#FFFF99", "#99CCFF", "#FF99CC", "#CC99FF", "#FFCC99",
  "#3366FF", "#33CCCC", "#99CC00", "#FFCC00", "#FF9900", "#FF6600", "#666699", "#969696",
  "#003366", "#339966", "#003300", "#333300", "#993300", "#993366", "#333399", "#333333",
];

function normalizeRgb(colorObj, workbook, { swapPairs = false } = {}) {
  if (!colorObj) return null;

  if (colorObj.rgb) {
    let rgb = String(colorObj.rgb).toUpperCase();
    if (rgb.length === 8) rgb = rgb.slice(2);
    if (rgb.length === 6) {
      if (swapPairs) rgb = `${rgb.slice(4, 6)}${rgb.slice(2, 4)}${rgb.slice(0, 2)}`;
      return `#${rgb.toLowerCase()}`;
    }
  }

  if (colorObj.indexed != null && INDEXED_COLORS[colorObj.indexed]) {
    return INDEXED_COLORS[colorObj.indexed];
  }

  if (colorObj.theme != null && workbook?.Themes?.themeElements?.clrScheme) {
    const scheme = workbook.Themes.themeElements.clrScheme;
    const themeNames = [
      "lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6",
      "hlink", "folHlink",
    ];
    const key = themeNames[colorObj.theme];
    const entry = key ? scheme[key] : null;
    if (entry?.rgb) {
      let rgb = String(entry.rgb);
      if (rgb.length === 8) rgb = rgb.slice(2);
      return `#${rgb.toLowerCase()}`;
    }
  }

  return null;
}

function getCellXf(workbook, styleIndex) {
  const styles = workbook?.Styles;
  if (!styles?.CellXf || styleIndex == null) return null;
  return styles.CellXf[styleIndex] ?? null;
}

function getFillRgb(workbook, styleIndex) {
  const xf = getCellXf(workbook, styleIndex);
  if (!xf) return null;
  const fill = workbook.Styles.Fills?.[xf.fillId];
  if (!fill || fill.patternType === "none") return null;
  return normalizeRgb(fill.fgColor, workbook) || normalizeRgb(fill.bgColor, workbook);
}

function getFontRgb(workbook, styleIndex) {
  const xf = getCellXf(workbook, styleIndex);
  if (!xf) return null;
  const font = workbook.Styles.Fonts?.[xf.fontId];
  return normalizeRgb(font?.color, workbook, { swapPairs: true });
}

function getBorderRgb(workbook, styleIndex, side = "left") {
  const xf = getCellXf(workbook, styleIndex);
  if (!xf) return null;
  const border = workbook.Styles.Borders?.[xf.borderId];
  const edge = border?.[side];
  return normalizeRgb(edge?.color, workbook, { swapPairs: true });
}

function readFillFromCellStyle(cell, workbook, styleIndex) {
  if (cell?.s?.patternType === "solid") {
    const direct = normalizeRgb(cell.s.fgColor, workbook) || normalizeRgb(cell.s.bgColor, workbook);
    if (direct) return direct;
  }
  if (styleIndex != null) return getFillRgb(workbook, styleIndex);
  return null;
}

function readFontFromCellStyle(cell, workbook, styleIndex) {
  if (cell?.s?.font?.color) {
    const direct = normalizeRgb(cell.s.font.color, workbook, { swapPairs: true });
    if (direct) return direct;
  }
  if (styleIndex != null) return getFontRgb(workbook, styleIndex);
  return null;
}

function parseCellStyleIndices(sheetXml) {
  const map = new Map();
  if (!sheetXml) return map;
  for (const match of sheetXml.matchAll(/<c r="([A-Z]+\d+)"[^>]*\ss="(\d+)"/g)) {
    map.set(match[1], Number(match[2]));
  }
  return map;
}

function resolveSheetXmlPath(workbook, sheetName) {
  const names = workbook.SheetNames || [];
  const index = names.indexOf(sheetName);
  if (index < 0) return "";
  const path = workbook.Directory?.sheets?.[index];
  return path ? (path.startsWith("/") ? path : `/${path}`) : `/xl/worksheets/sheet${index + 1}.xml`;
}

function readSheetStyleMap(buffer, workbook, sheetName) {
  if (!buffer || !workbook) return new Map();
  try {
    const container = CFB.read(buffer, { type: "buffer" });
    const sheetPath = resolveSheetXmlPath(workbook, sheetName);
    const entry = CFB.find(container, sheetPath);
    if (!entry?.content) return new Map();
    const xml =
      entry.content instanceof Uint8Array || ArrayBuffer.isView(entry.content)
        ? new TextDecoder().decode(entry.content)
        : String(entry.content);
    return parseCellStyleIndices(xml);
  } catch {
    return new Map();
  }
}

function cellAddress(rowIndex, colIndex, xlsx) {
  return xlsx.utils.encode_cell({ r: rowIndex, c: colIndex });
}

/**
 * 从 Excel 单元格样式读取填充色、边框色、文字色（不使用单元格文本中的 #hex）
 */
export function readNodeCellColors({
  sheet,
  workbook,
  styleMap,
  rowIndex,
  map,
  xlsx,
}) {
  const fillAddr = map.fill != null ? cellAddress(rowIndex, map.fill, xlsx) : "";
  const strokeAddr = map.stroke != null ? cellAddress(rowIndex, map.stroke, xlsx) : "";
  const labelAddr = map.label != null ? cellAddress(rowIndex, map.label, xlsx) : "";
  const textColorAddr = map.textColor != null ? cellAddress(rowIndex, map.textColor, xlsx) : "";

  const fillCell = fillAddr ? sheet[fillAddr] : null;
  const strokeCell = strokeAddr ? sheet[strokeAddr] : null;
  const labelCell = labelAddr ? sheet[labelAddr] : null;
  const textColorCell = textColorAddr ? sheet[textColorAddr] : null;

  const fillStyleIndex = styleMap.get(fillAddr);
  const strokeStyleIndex = styleMap.get(strokeAddr);
  const labelStyleIndex = styleMap.get(labelAddr);
  const textColorStyleIndex = styleMap.get(textColorAddr);

  let fill =
    readFillFromCellStyle(fillCell, workbook, fillStyleIndex) ||
    readFillFromCellStyle(labelCell, workbook, labelStyleIndex) ||
    "#ffffff";

  let stroke =
    getBorderRgb(workbook, strokeStyleIndex, "left") ||
    readFillFromCellStyle(strokeCell, workbook, strokeStyleIndex) ||
    getBorderRgb(workbook, fillStyleIndex, "left") ||
    "#333333";

  let textColor =
    readFontFromCellStyle(textColorCell, workbook, textColorStyleIndex) ||
    readFontFromCellStyle(labelCell, workbook, labelStyleIndex) ||
    "#213547";

  return { fill, stroke, textColor };
}

export { readSheetStyleMap };
