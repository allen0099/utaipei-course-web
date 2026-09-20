import { boaiBuildings, tianmuBuildings } from "@/config/buildings.ts";

const CAMPUSES = [
  { prefix: "博愛", key: "bo-ai", buildings: boaiBuildings },
  { prefix: "天母", key: "tian-mu", buildings: tianmuBuildings },
];

/**
 * 「博愛 G313」→ /map?campus=bo-ai&b=G。
 *
 * 教室字串的格式是「校區 + 空白 + 大樓代碼字母 + 房號」。只有當那個字母真的在
 * config/buildings.ts 的代碼表裡才給連結 —— 對不上的（場地名稱、教室未定、代碼表
 * 還沒收的大樓）回傳 null，寧可沒有連結，也不要連到一張什麼都沒標的地圖。
 */
export const mapLinkForClassroom = (
  classroom: string | undefined,
): string | null => {
  const match = classroom?.match(/^(博愛|天母)\s*([A-Za-z])/);

  if (!match) return null;

  const campus = CAMPUSES.find((item) => item.prefix === match[1]);
  const code = match[2].toUpperCase();

  if (!campus?.buildings.some((building) => building.code === code)) {
    return null;
  }

  return `/map?${new URLSearchParams({ campus: campus.key, b: code }).toString()}`;
};
