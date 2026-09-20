/**
 * 博愛校區平面圖的幾何資料。
 *
 * 座標系是 1276 × 1049（沿用舊圖的 viewBox，所以相對位置與原本那張手繪圖一致），
 * 上方為北。每棟建築是一個對齊到 5 的矩形 —— 這張圖的用途是「G 開頭的教室在
 * 校園的哪一塊」，不是建築測繪，輪廓畫得再細也不會讓人更快找到教室，只會讓檔案
 * 變成 98KB 的手繪路徑。
 *
 * `id` 對應 config/buildings.ts 的 BuildingCode.id；名稱與代碼只存在那邊，這裡
 * 只管位置，兩份資料才不會各寫一次而漂移。
 */
export interface BuildingShape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 窄長的建築（音樂館）橫排放不下，標籤改成直排。 */
  verticalLabel?: boolean;
}

export const BOAI_VIEWBOX = { width: 1276, height: 1049 };

/** 校地範圍，外圈是人行道與馬路。 */
export const BOAI_GROUND = { x: 138, y: 12, width: 1004, height: 910 };

export const BOAI_FIELD = { cx: 626, cy: 378, rx: 242, ry: 141 };

export const BOAI_BUILDINGS: BuildingShape[] = [
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
];

export interface RoadLabel {
  name: string;
  x: number;
  y: number;
  /** 直向的路名沿著路的方向排。 */
  vertical?: boolean;
}

export const BOAI_ROADS: RoadLabel[] = [
  { name: "重慶南路一段", x: 72, y: 467, vertical: true },
  { name: "公園路", x: 1204, y: 467, vertical: true },
  { name: "愛國西路", x: 638, y: 982 },
];
