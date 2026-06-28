import axios from "axios";

function isWorkbookBuffer(buffer) {
  if (!buffer || buffer.byteLength < 4) return false;
  const header = new Uint8Array(buffer.slice(0, 4));
  return header[0] === 0x50 && header[1] === 0x4b;
}

/**
 * 从 docs 资源 URL 加载 xlsx 工作簿
 * @returns {Promise<{ workbook: import('xlsx').WorkBook, sheetNames: string[] }>}
 */
export async function loadXlsxWorkbook(excelUrl, relativePath = "") {
  const response = await axios.get(excelUrl, {
    responseType: "arraybuffer",
    validateStatus: () => true,
  });

  if (response.status === 404) {
    throw new Error(`文件未找到：${relativePath}（路径 ${excelUrl}）`);
  }
  if (response.status === 422) {
    throw new Error(`文件为空（0 字节）：${relativePath}，请用 Excel 重新保存后再试`);
  }
  if (response.status >= 400) {
    throw new Error(`加载失败：${relativePath}（HTTP ${response.status}）`);
  }

  const buffer = response.data;
  if (!buffer || buffer.byteLength === 0) {
    throw new Error(`文件为空（0 字节）：${relativePath}`);
  }

  if (!isWorkbookBuffer(buffer)) {
    const head = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 32)));
    if (/^\s*</.test(head)) {
      throw new Error(`资源请求异常（返回了 HTML 而非 xlsx）：${relativePath}`);
    }
    throw new Error(`文件损坏或格式无效：${relativePath}`);
  }

  const xlsx = await import("xlsx");
  const workbook = xlsx.read(buffer, { type: "array", cellStyles: true });
  const sheetNames = workbook.SheetNames || [];

  if (!sheetNames.length) {
    throw new Error(`工作簿中没有可用工作表：${relativePath}`);
  }

  return { workbook, sheetNames, xlsx, buffer };
}
