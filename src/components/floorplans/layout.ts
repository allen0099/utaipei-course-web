/**
 * 一個校區平面圖的全部幾何。CampusMap 只負責把它畫出來，所以新增或修改校區
 * 只需要動 layout 檔。
 *
 * 建築的名稱與代碼不在這裡 —— 它們來自 config/buildings.ts，用 `id` 對上。
 */
export interface BuildingShape {
  /** config/buildings.ts 的 BuildingCode.id */
  id: string;
  /**
   * 同一棟建築在代碼表裡有好幾筆時的其他 id。天母的「行政科資大樓」是一棟樓，
   * 代碼表卻分成行政大樓 (T) 與科資大樓 (D) 兩筆；兩筆都要能標到這一塊。
   */
  aliases?: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  /** 圓角；操場這類跑道形狀用得到。預設是小圓角。 */
  rx?: number;
  /** 窄長的建築橫排放不下，標籤改成直排。 */
  verticalLabel?: boolean;
  /** 取代代碼表名稱的顯示文字（例如合併後的「行政科資大樓」）。 */
  labelOverride?: string;
  /** labelOverride 的英文版；英文介面沒有它就退回代碼表的 nameEn。 */
  labelOverrideEn?: string;
}

/** 不可選取的場地：球場、草坪、停車場。只是幫人對位置用的地標。 */
export interface FeatureShape {
  label: string;
  /** 英文介面用的標籤；沒給就沿用 label（例如停車場的「P」）。 */
  labelEn?: string;
  tone: "grass" | "court" | "track" | "parking";
  shape:
    | { type: "rect"; x: number; y: number; width: number; height: number }
    | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number };
  /** 有內圈的場地（跑道裡的草地）往內縮多少。 */
  inset?: number;
  verticalLabel?: boolean;
}

export interface RoadShape {
  name: string;
  /** 英文介面用的路名。 */
  nameEn?: string;
  /** 路的中心線，畫成一條粗線。 */
  path: string;
  width: number;
  /** 路名的位置與角度。 */
  label: { x: number; y: number; rotate?: number };
}

export interface CampusLayout {
  /** 給螢幕閱讀器的名稱，例如「博愛校區平面圖」。 */
  label: string;
  labelEn?: string;
  viewBox: { width: number; height: number };
  /** 校地輪廓（path 的 d）。 */
  ground: string;
  roads: RoadShape[];
  features: FeatureShape[];
  buildings: BuildingShape[];
  north: { x: number; y: number };
  /** 字級隨 viewBox 的尺度而定，所以跟著 layout 走。 */
  text: { code: number; name: number; road: number; feature: number };
}
