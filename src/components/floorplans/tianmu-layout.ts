import { CampusLayout } from "@/components/floorplans/layout.ts";

/**
 * 天母校區。依學校官網的校區位置圖重繪（原圖的一半尺度，1000 × 760），上方為北。
 *
 * 校地不是矩形：西側沿著忠誠路二段是一條弧線，南側的士東路往東北斜上去，所以
 * 輪廓是一條 path。跟博愛一樣，建築只畫成對齊過的矩形。
 *
 * 幾個對照關係：
 * - 圖上的「行政科資大樓」是一棟樓，代碼表分成行政大樓 (T) 與科資大樓 (D) 兩筆，
 *   用 aliases 讓兩筆都標到同一塊。
 * - 「綜合運動館」就是詩欣館 (E)，2012 年啟用時以校友陳詩欣命名。
 * - 「田徑場」是代碼表的操場 (Y)，所以它是可選取的建築而不是裝飾用的場地。
 * - 代碼表裡的「其它」「校外場地」「室外其他術科場地」沒有固定位置，不畫。
 */
export const TIANMU_LAYOUT: CampusLayout = {
  label: "天母校區平面圖",
  labelEn: "Tianmu Campus map",
  viewBox: { width: 1000, height: 760 },
  ground:
    "M478 182 L772 208 L748 582 L600 605 L160 652 C175 560 230 410 300 330 C360 260 420 215 478 182 Z",
  roads: [
    {
      name: "忠誠路二段",
      nameEn: "Zhongcheng Rd. Sec. 2",
      path: "M118 700 C135 570 195 400 268 312 C335 236 410 186 500 120",
      width: 46,
      label: { x: 232, y: 372, rotate: -58 },
    },
    {
      name: "忠誠路二段 207 巷",
      nameEn: "Ln. 207, Zhongcheng Rd. Sec. 2",
      path: "M452 156 L830 190",
      width: 34,
      label: { x: 640, y: 173, rotate: 5 },
    },
    {
      name: "東山路",
      nameEn: "Dongshan Rd.",
      path: "M838 120 L806 640",
      width: 44,
      label: { x: 822, y: 400, rotate: 93 },
    },
    {
      name: "士東路",
      nameEn: "Shidong Rd.",
      path: "M60 690 L600 636 L900 590",
      width: 46,
      label: { x: 420, y: 654, rotate: -6 },
    },
  ],
  features: [
    {
      label: "多功能草坪",
      labelEn: "Lawn",
      tone: "grass",
      verticalLabel: true,
      shape: { type: "rect", x: 438, y: 312, width: 88, height: 146 },
    },
    {
      label: "棒球場",
      labelEn: "Baseball field",
      tone: "grass",
      shape: { type: "ellipse", cx: 318, cy: 548, rx: 88, ry: 80 },
    },
    {
      label: "籃球場",
      labelEn: "Basketball",
      tone: "court",
      verticalLabel: true,
      shape: { type: "rect", x: 426, y: 496, width: 60, height: 76 },
    },
    {
      label: "網球場",
      labelEn: "Tennis",
      tone: "court",
      shape: { type: "rect", x: 498, y: 530, width: 130, height: 54 },
    },
    {
      label: "P",
      tone: "parking",
      shape: { type: "rect", x: 590, y: 204, width: 26, height: 38 },
    },
    {
      label: "P",
      tone: "parking",
      shape: { type: "rect", x: 704, y: 372, width: 38, height: 30 },
    },
  ],
  buildings: [
    { id: "Gymnasium", x: 450, y: 194, width: 130, height: 84, rx: 40 },
    { id: "Hong-Tan-Building", x: 620, y: 204, width: 84, height: 62 },
    {
      id: "Tianmu-Administration-Building",
      aliases: ["Science-Info-Building"],
      labelOverride: "行政科資大樓",
      labelOverrideEn: "Administration / Science & Information Building",
      x: 714,
      y: 212,
      width: 46,
      height: 156,
      verticalLabel: true,
    },
    {
      id: "Track-Field",
      x: 540,
      y: 312,
      width: 92,
      height: 180,
      rx: 46,
      verticalLabel: true,
    },
    {
      id: "Shih-Hsin-Hall",
      x: 696,
      y: 430,
      width: 46,
      height: 140,
      verticalLabel: true,
    },
  ],
  north: { x: 930, y: 60 },
  text: { code: 26, name: 13, road: 17, feature: 13 },
};
