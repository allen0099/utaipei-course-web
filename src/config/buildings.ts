export interface BuildingCode {
  id: string;
  code: string;
  name: string;
  number?: string;
}

/**
 * `code` 是教室代碼的第一個字母（「G313」的 G），課程列表的教室欄靠它連到
 * 地圖，所以它必須跟課程資料裡實際出現的字母一致，而不是別的編碼系統。
 *
 * 兩棟行政大樓原本寫的是 P（博愛）與 T（天母），但 115-1 的課程資料裡博愛沒有
 * 任何 P 開頭的教室、天母沒有任何 T 開頭的；實際出現的是「博愛 T505」（51 門課，
 * 師培中心公告也寫「行政大樓 T505」）與「天母 C507 階梯教室」（187 門課）。
 */
export const boaiBuildings: BuildingCode[] = [
  { id: "Qinpu-Building", code: "C", name: "勤樸樓" },
  { id: "Dormitory", code: "R", name: "學生宿舍" },
  { id: "Art-Building", code: "A", name: "藝術館" },
  { id: "Music-Building", code: "M", name: "音樂館" },
  { id: "Science-Building", code: "S", name: "科學館" },
  { id: "Administration-Building", code: "T", name: "行政大樓", number: "10" },
  { id: "Zhongzheng-Hall", code: "B", name: "中正堂" },
  { id: "Gongcheng-Building", code: "G", name: "公誠樓" },
  { id: "Library", code: "L", name: "圖書館" },
];

export const tianmuBuildings: BuildingCode[] = [
  { id: "Science-Info-Building", code: "D", name: "科資大樓", number: "12" },
  { id: "Shih-Hsin-Hall", code: "E", name: "詩欣館", number: "13" },
  { id: "Hong-Tan-Building", code: "B", name: "鴻坦樓", number: "11" },
  { id: "Gymnasium", code: "A", name: "體育館", number: "14" },
  { id: "Tianmu-Administration-Building", code: "C", name: "行政大樓" },
  { id: "Track-Field", code: "Y", name: "操場" },
  { id: "Other", code: "X", name: "其它" },
  { id: "Off-Campus", code: "-", name: "校外場地", number: "15" },
  { id: "Outdoor-Venue", code: "-", name: "室外其他術科場地", number: "8" },
];
