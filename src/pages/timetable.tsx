import { lazy, Suspense, useState } from "react";
import clsx from "clsx";

import DefaultLayout from "@/layouts/default.tsx";
import { PageHeader } from "@/components/page-header.tsx";
import { siteConfig } from "@/config/site.ts";
import { LoadingState } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import { DEFAULT_CAMPUS_MAPPINGS } from "@/components/weekly-schedule.tsx";
import { useT } from "@/i18n/language.tsx";
import { campusName, periodLabel } from "@/i18n/terms.ts";

const PDFDocument = lazy(() => import("@/components/pdf.tsx"));

const toMinutes = (time: string): number => {
  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
};

/**
 * 校園節次表。
 *
 * 這一頁原本只有一份 PDF：手機上要雙指放大才看得到字，不能搜尋、不能複製，
 * 螢幕閱讀器讀不到。而兩個校區的節次時間早就以資料的形式存在前端了
 * （週課表與 ICS 匯出用的 DEFAULT_CAMPUS_MAPPINGS），這裡直接把那份資料畫成
 * 表格 —— 同一個來源，課表上看到的時間跟這張表永遠一致。
 *
 * PDF 還留著，收在下面：它是學校的原件，而表格是我們轉寫的。
 */
export const TimetablePage = () => {
  const t = useT();
  // 掛載當下的時間，取一次就好：render 必須是純的，而這一頁不會開著放一整天。
  const [nowMinutes] = useState(() => {
    const now = new Date();

    return now.getHours() * 60 + now.getMinutes();
  });
  const [showPdf, setShowPdf] = useState(false);

  const periods = DEFAULT_CAMPUS_MAPPINGS[0].periods.map(
    (period) => period.period,
  );

  return (
    <DefaultLayout>
      <PageSection className="gap-6">
        <PageHeader
          className="max-w-5xl"
          description={t(
            "各節次的上下課時間對照。",
            "Start and end times of every class period.",
          )}
          title={t("校園節次表", "Class Periods")}
        />

        <div className="w-full max-w-5xl overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">
              {t(
                "各校區每一節的上下課時間",
                "Start and end time of each period, by campus",
              )}
            </caption>
            <thead>
              <tr className="border-b border-border bg-background-secondary text-left text-xs font-medium tracking-wide text-muted">
                {DEFAULT_CAMPUS_MAPPINGS.map((mapping) => (
                  <th
                    key={mapping.campus}
                    className="px-4 py-2.5 font-medium"
                    colSpan={2}
                    scope="colgroup"
                  >
                    {campusName(mapping.name, t)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((periodNumber, rowIndex) => (
                <tr
                  key={periodNumber}
                  className="border-b border-border/60 last:border-b-0"
                >
                  {DEFAULT_CAMPUS_MAPPINGS.map((mapping) => {
                    const period = mapping.periods[rowIndex];
                    const isNow =
                      nowMinutes >= toMinutes(period.startTime) &&
                      nowMinutes <= toMinutes(period.endTime);

                    return [
                      <th
                        key={`${mapping.campus}-label`}
                        className={clsx(
                          "whitespace-nowrap px-4 py-2.5 text-left font-medium",
                          isNow && "bg-accent/10",
                        )}
                        scope="row"
                      >
                        {periodLabel(period.label, t)}
                        {isNow && (
                          <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-normal text-white">
                            {t("現在", "Now")}
                          </span>
                        )}
                      </th>,
                      <td
                        key={`${mapping.campus}-time`}
                        className={clsx(
                          "whitespace-nowrap px-4 py-2.5 tabular-nums",
                          isNow && "bg-accent/10",
                        )}
                      >
                        {period.startTime}–{period.endTime}
                      </td>,
                    ];
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PDF 要多載一個 1.2MB 的 pdf.js worker，所以等使用者真的要看才載。 */}
        <details
          className="w-full max-w-5xl rounded-lg border border-border"
          onToggle={(event) => {
            if (event.currentTarget.open) setShowPdf(true);
          }}
        >
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">
            {t("查看學校的 PDF 原件", "View the university's original PDF")}
          </summary>
          <div className="px-4 pb-4">
            {showPdf && (
              <Suspense fallback={<LoadingState label="PDF" />}>
                <PDFDocument
                  link={`${siteConfig.links.github.api}/timetable.pdf`}
                />
              </Suspense>
            )}
          </div>
        </details>
      </PageSection>
    </DefaultLayout>
  );
};

export default TimetablePage;
