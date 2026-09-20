import { useState } from "react";

import { siteConfig } from "@/config/site.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { useT } from "@/i18n/language.tsx";

interface CoursesMeta {
  coursesUpdatedAt?: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 「課程資料更新於 9/14（6 天前）」。
 *
 * 爬蟲是週排程，畫面上的資料最多會舊七天，而加退選期間一週內什麼都可能變。
 * 免責聲明只說「可能延遲」，這裡把實際延遲了多久講出來。
 *
 * meta.json 由爬蟲的 fetchCourses 寫出，與 web 各自部署：檔案還不存在（舊學年期
 * 永遠不會有）就整行不顯示，不當成錯誤。
 */
export const DataFreshness = ({
  yms,
  className,
}: {
  yms: string;
  className?: string;
}) => {
  const t = useT();
  const [year, semester] = yms.split("#");
  // 掛載當下的時間，取一次就好：render 必須是純的，而「幾天前」不需要每次重繪
  // 都重算。
  const [now] = useState(() => Date.now());
  const { data } = useFetchJson<CoursesMeta>(
    yms ? `${siteConfig.links.github.api}/${year}/${semester}/meta.json` : null,
    { cache: true },
  );

  const updatedAt = data?.coursesUpdatedAt
    ? new Date(data.coursesUpdatedAt)
    : null;

  if (!updatedAt || Number.isNaN(updatedAt.getTime())) return null;

  const days = Math.floor((now - updatedAt.getTime()) / MS_PER_DAY);
  const relative =
    days <= 0
      ? t("今天", "today")
      : t(`${days} 天前`, days === 1 ? "1 day ago" : `${days} days ago`);

  return (
    <p className={className}>
      {t("課程資料更新於", "Course data updated")}{" "}
      <time dateTime={updatedAt.toISOString()}>
        {updatedAt.getMonth() + 1}/{updatedAt.getDate()}
      </time>
      {t(`（${relative}）`, ` (${relative})`)}
    </p>
  );
};

export default DataFreshness;
