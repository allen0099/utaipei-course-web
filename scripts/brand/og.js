/**
 * 每頁 OG 分享圖（1200×630）的共用版型。文案不在這裡寫死——頁名與說明一律從
 * src/config/page-meta.js 讀，改了 meta 重跑一次就好，圖與頁面不會各說各話。
 */

import { BRAND, INK, MUTED, squircleArtwork } from "./mark.js";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * 繁體中文字型。Noto Sans TC 在 Windows 上是可變字型，resvg 取不到粗體實例
 * （font-weight 700 會被畫成 regular），所以把有獨立粗體檔的微軟正黑體排前面。
 */
const FONT_STACK = "Microsoft JhengHei, Noto Sans TC, PingFang TC, sans-serif";

/* 版面座標。卡片內縮 26px 露出外框的品牌橘，縮成推文縮圖時那圈橘色就是識別。 */
const CARD_INSET = 26;
const TEXT_X = 98;
const TEXT_RIGHT = 802; // 文字欄右界，再過去是右側的吉祥物
const FOOTER_RIGHT = OG_WIDTH - CARD_INSET - 72;
const TEXT_WIDTH = TEXT_RIGHT - TEXT_X;

const TITLE_SIZE = 80;
const TITLE_MIN_SIZE = 52;
const TITLE_BASELINE = 268;
const DESC_SIZE = 30;
const DESC_LINE_HEIGHT = 46;
const DESC_FIRST_BASELINE = 340;
const DESC_MAX_LINES = 3;

/** 這些標點不留在行首，寧可讓上一行多凸出一點。 */
const NO_LINE_START = "。，、；：！？）」』〕】．，,.!?:;)]}";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 沒有字型度量可用，所以用「中日韓字元佔一個字寬、西文約 0.55」估算。估得保守
 * 一點會多斷一行，不會爆版。
 */
function charWidth(ch, size) {
  if (ch === " ") return size * 0.28;

  return ch.codePointAt(0) < 0x2e80 ? size * 0.55 : size;
}

function measure(text, size) {
  let width = 0;

  for (const ch of text) width += charWidth(ch, size);

  return width;
}

/** 一個 token 是單一中文字，或一整串連續西文（`.ics`、`2026` 不該被拆開）。 */
function tokenize(text) {
  const tokens = [];
  let ascii = "";

  for (const ch of text) {
    if (ch !== " " && ch.codePointAt(0) < 0x2e80) {
      ascii += ch;
      continue;
    }

    if (ascii) {
      tokens.push(ascii);
      ascii = "";
    }
    tokens.push(ch);
  }
  if (ascii) tokens.push(ascii);

  return tokens;
}

function wrap(text, size, maxWidth, maxLines) {
  const lines = [];
  let line = "";

  for (const token of tokenize(text)) {
    const candidate = line + token;

    if (line && measure(candidate, size) > maxWidth) {
      if (token.length === 1 && NO_LINE_START.includes(token)) {
        line = candidate;
        continue;
      }
      lines.push(line);
      line = token === " " ? "" : token;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`;
  }

  return lines;
}

function text({ x, y, size, weight = 400, fill, anchor = "start", opacity }) {
  return (content) =>
    `<text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${size}" font-weight="${weight}" fill="${fill}"${
      anchor === "start" ? "" : ` text-anchor="${anchor}"`
    }${opacity ? ` opacity="${opacity}"` : ""}>${escapeXml(content)}</text>`;
}

/**
 * @param {{ title: string, description: string, eyebrow: string, domain: string }} content
 * @returns {string} SVG 原始碼
 */
export function ogImage({ title, description, eyebrow, domain }) {
  // 首頁的標題是完整品牌名（8 個字），剛好貼齊文字欄寬度；比它更長的頁名就縮字級。
  let titleSize = TITLE_SIZE;

  while (
    titleSize > TITLE_MIN_SIZE &&
    measure(title, titleSize) > TEXT_WIDTH
  ) {
    titleSize -= 2;
  }

  const eyebrowSize = 28;
  const eyebrowWidth = measure(eyebrow, eyebrowSize) + 44;
  const descLines = wrap(description, DESC_SIZE, TEXT_WIDTH, DESC_MAX_LINES);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">`,
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${BRAND}" />`,
    `<rect x="${CARD_INSET}" y="${CARD_INSET}" width="${OG_WIDTH - CARD_INSET * 2}" height="${OG_HEIGHT - CARD_INSET * 2}" rx="28" fill="#ffffff" />`,

    // 眉標：橘底藥丸，讓沒讀到內文的人也先看到品牌。
    `<rect x="${TEXT_X}" y="96" width="${eyebrowWidth}" height="52" rx="26" fill="#fff7ed" />`,
    text({ x: TEXT_X + 22, y: 131, size: eyebrowSize, weight: 600, fill: BRAND })(
      eyebrow,
    ),

    text({
      x: TEXT_X,
      y: TITLE_BASELINE,
      size: titleSize,
      weight: 700,
      fill: INK,
    })(title),

    ...descLines.map((line, index) =>
      text({
        x: TEXT_X,
        y: DESC_FIRST_BASELINE + index * DESC_LINE_HEIGHT,
        size: DESC_SIZE,
        fill: MUTED,
      })(line),
    ),

    // 吉祥物：跟 favicon 同一個標記，放大到 260px 擺在右側，對齊卡片的垂直中線。
    `<g transform="translate(842 178) scale(2.6)">${squircleArtwork()}</g>`,

    `<line x1="${TEXT_X}" y1="516" x2="${FOOTER_RIGHT}" y2="516" stroke="#fed7aa" stroke-width="2" />`,
    text({
      x: FOOTER_RIGHT,
      y: 556,
      size: 26,
      weight: 600,
      fill: BRAND,
      anchor: "end",
    })(domain),
    `</svg>`,
  ].join("");
}
