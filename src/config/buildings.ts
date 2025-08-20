export interface BuildingCode {
  code: string;
  name: string;
  number?: string;
}

export const boaiBuildings: BuildingCode[] = [
  { code: "C", name: "勤樸樓" },
  { code: "R", name: "學生宿舍" },
  { code: "A", name: "藝術館" },
  { code: "M", name: "音樂館" },
  { code: "S", name: "科學館" },
  { code: "C", name: "行政大樓", number: "10" },
  { code: "B", name: "中正堂" },
  { code: "G", name: "公誠樓" },
  { code: "L", name: "圖書館" },
];

export const tianmuBuildings: BuildingCode[] = [
  { code: "D", name: "科資大樓", number: "12" },
  { code: "E", name: "詩欣館", number: "13" },
  { code: "B", name: "鴻坦樓", number: "11" },
  { code: "A", name: "體育館", number: "14" },
  { code: "T", name: "行政大樓" },
  { code: "Y", name: "操場" },
  { code: "X", name: "其它" },
  { code: "-", name: "校外場地", number: "15" },
  { code: "-", name: "室外其他術科場地", number: "8" },
];
