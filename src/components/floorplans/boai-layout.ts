import { CampusLayout } from "@/components/floorplans/layout.ts";

/**
 * 博愛校區。
 *
 * 座標系是 1276 × 1049（沿用舊圖的 viewBox，所以相對位置與原本那張手繪圖一致），
 * 上方為北。每棟建築是一個對齊到 5 的矩形 —— 這張圖的用途是「G 開頭的教室在
 * 校園的哪一塊」，不是建築測繪，輪廓畫得再細也不會讓人更快找到教室。
 */
export const BOAI_LAYOUT: CampusLayout = {
  label: "博愛校區平面圖",
  viewBox: { width: 1276, height: 1049 },
  ground:
    "M154 12 h972 a16 16 0 0 1 16 16 v878 a16 16 0 0 1 -16 16 h-972 a16 16 0 0 1 -16 -16 v-878 a16 16 0 0 1 16 -16 Z",
  roads: [
    {
      name: "重慶南路一段",
      path: "M72 20 V1030",
      width: 108,
      label: { x: 72, y: 467, rotate: -90 },
    },
    {
      name: "公園路",
      path: "M1204 20 V1030",
      width: 108,
      label: { x: 1204, y: 467, rotate: -90 },
    },
    {
      name: "愛國西路",
      path: "M20 982 H1256",
      width: 100,
      label: { x: 638, y: 982 },
    },
  ],
  features: [
    {
      label: "操場",
      tone: "track",
      inset: 34,
      shape: { type: "ellipse", cx: 626, cy: 378, rx: 242, ry: 141 },
    },
  ],
  buildings: [
    { id: "Qinpu-Building", x: 180, y: 65, width: 510, height: 155 },
    { id: "Dormitory", x: 730, y: 50, width: 400, height: 180 },
    { id: "Science-Building", x: 160, y: 290, width: 190, height: 175 },
    { id: "Art-Building", x: 880, y: 250, width: 175, height: 280 },
    {
      id: "Music-Building",
      x: 1062,
      y: 250,
      width: 70,
      height: 280,
      verticalLabel: true,
    },
    { id: "Administration-Building", x: 350, y: 555, width: 435, height: 110 },
    { id: "Gongcheng-Building", x: 800, y: 575, width: 315, height: 150 },
    { id: "Zhongzheng-Hall", x: 735, y: 745, width: 325, height: 165 },
    { id: "Library", x: 145, y: 660, width: 190, height: 190 },
  ],
  north: { x: 1204, y: 70 },
  text: { code: 60, name: 28, road: 30, feature: 32 },
};
