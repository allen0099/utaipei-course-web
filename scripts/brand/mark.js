/**
 * 品牌標記（貓臉）的向量原稿——favicon、app icon 與 OG 圖上的吉祥物都由這裡產生。
 *
 * 造型只有「兩隻耳朵＋一顆頭＋兩顆眼睛＋鼻子」，刻意畫到不能再少：分頁上的
 * favicon 只有 16px，整隻貓（身體、圍巾、花色）縮到那個尺寸就是一團橘色雜訊。
 * 白貓臉壓在品牌橘的方塊上，在淺色與深色分頁列都還看得出輪廓。
 *
 * 所有座標都畫在 0–100 的方格裡，實際輸出時再用 viewBox 縮放到需要的尺寸。
 */

/** globals.css 的品牌橘 oklch(0.646 0.2223 41.12) 換算成 sRGB。 */
export const BRAND = "#ea580c";
export const BRAND_DARK = "#c2410c";
export const INK = "#1c1917";
export const MUTED = "#57534e";

/** 圓角方塊的圓角半徑（0–100 座標系）。iOS／Android 的圖示都偏這個比例。 */
const SQUIRCLE_RADIUS = 23;

/**
 * 貓臉本體。`fg` 是臉的顏色，`bg` 是挖空處（眼睛、鼻子）要露出的底色——這兩處
 * 不用透明色，因為 apple-touch-icon 不能有透明像素。
 *
 * @param {{ fg?: string, bg?: string }} [colors]
 */
export function catFace({ fg = "#ffffff", bg = BRAND } = {}) {
  return [
    // 耳朵：三角形用同色描邊 + round 接角把尖端磨圓，免得 16px 下變成鋸齒。
    // 內側頂點壓在頭頂（y≈34.5）上，兩耳之間才不會凹出一個深 V——那個缺口一深，
    // 整個剪影就從貓變成蝙蝠。
    `<g fill="${fg}" stroke="${fg}" stroke-width="5" stroke-linejoin="round">`,
    `<path d="M29.5 47 L26 23 L44 35 Z" />`,
    `<path d="M70.5 47 L74 23 L56 35 Z" />`,
    `</g>`,
    // 頭：耳朵壓在底下，聯集起來就是一個完整的剪影。
    `<ellipse cx="50" cy="58" rx="28" ry="23.5" fill="${fg}" />`,
    // 眼睛與鼻子是挖空的，縮到 16px 時剩下三個色點，反而是臉部辨識的關鍵。
    `<ellipse cx="39.8" cy="56" rx="4.4" ry="5.7" fill="${bg}" />`,
    `<ellipse cx="60.2" cy="56" rx="4.4" ry="5.7" fill="${bg}" />`,
    `<path d="M46.9 66 L53.1 66 L50 70.2 Z" fill="${bg}" stroke="${bg}" stroke-width="1.8" stroke-linejoin="round" />`,
  ].join("");
}

/**
 * 圓角方塊版標記的內容（不含 <svg> 外框），畫在 0–100 的方格裡。
 * OG 圖要把它擺進版面裡當吉祥物，所以獨立出來讓呼叫端自己包 transform。
 */
export function squircleArtwork() {
  return `<rect width="100" height="100" rx="${SQUIRCLE_RADIUS}" fill="${BRAND}" />${catFace()}`;
}

/**
 * 標準圖示：品牌橘圓角方塊 ＋ 白貓臉。favicon、icon-192／512 用這個版本。
 *
 * `size` 傳 null 時不輸出 width／height，只留 viewBox——favicon.svg 要這樣才能
 * 讓瀏覽器縮到任何尺寸。
 *
 * @param {{ size?: number | null }} [opts]
 */
export function markSquircle({ size = 100 } = {}) {
  const box = size === null ? "" : ` width="${size}" height="${size}"`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg"${box} viewBox="0 0 100 100">`,
    squircleArtwork(),
    `</svg>`,
  ].join("");
}

/**
 * 滿版圖示：不留圓角，讓平台自己去切。`inset` 是內容相對整張圖的縮放比例。
 *
 * maskable 圖示的安全區是置中、直徑 80% 的圓，超出去的部分隨時可能被裁掉，
 * 所以貓臉要縮到 0.8 以內；apple-touch-icon 只會被切掉一點圓角，可以放大一些。
 *
 * @param {{ size?: number, inset?: number }} [opts]
 */
export function markFullBleed({ size = 512, inset = 0.8 } = {}) {
  const offset = 50 * (1 - inset);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">`,
    `<rect width="100" height="100" fill="${BRAND}" />`,
    `<g transform="translate(${offset} ${offset}) scale(${inset})">${catFace()}</g>`,
    `</svg>`,
  ].join("");
}
