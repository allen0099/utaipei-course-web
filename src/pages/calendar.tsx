import {
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { Spinner, Button, Dropdown, Label, Tabs } from "@heroui/react";
import { lazy, Suspense, useMemo, useState } from "react";

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import { CalendarEvent, CalendarItem } from "@/interfaces/globals.ts";
import { title } from "@/components/primitives.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { AcademicCalendar } from "@/components/academic-calendar.tsx";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { generateAcademicCalendarICS } from "@/utils/academic-calendar-ics.ts";
import { downloadICS } from "@/utils/ics-generator.ts";

const PDFDocument = lazy(() => import("@/components/pdf.tsx"));

/** 選取中的分頁畫出白色藥丸底色，取代需要額外容器才能運作的 Tabs.Indicator。 */
const TAB_CLASS =
  "whitespace-nowrap data-[selected=true]:bg-white data-[selected=true]:shadow-sm dark:data-[selected=true]:bg-gray-700";

const Loading = () => (
  <div className="flex items-center gap-2">
    <Spinner />
    <span>載入中...</span>
  </div>
);

export const CalendarPage = () => {
  const {
    data: rawCalendarList,
    error,
    refetch,
  } = useFetchJson<CalendarItem[]>(
    `${siteConfig.links.github.api}/calendar.json`,
  );

  const calendarList = useMemo(() => {
    if (!rawCalendarList) return [];

    const processedData = rawCalendarList.map((item) => ({
      ...item,
      link: `${siteConfig.links.github.api}/calendar/${item.year}/${item.title}.pdf`,
    }));

    return [...processedData].reverse();
  }, [rawCalendarList]);

  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  // Default to the newest calendar until the user picks a different year;
  // derived directly from render instead of synced via an effect.
  const selectedCalendar =
    (selectedTitle
      ? calendarList.find((item) => item.title === selectedTitle)
      : undefined) ||
    calendarList[0] ||
    null;

  // 只有 crawler 明確標記 parsed: true 才顯示結構化檢視。
  // parsed 為 false 是 105 學年度那種抽不出文字的 PDF；為 undefined 則代表
  // 尚未重新爬取（web 與 crawler 是各自部署的），此時維持原本的 PDF 檢視即可，
  // 等資料上線後會自動切換，不必在意兩邊的部署先後。
  const hasStructuredData = selectedCalendar?.parsed === true;
  // 只有「明確解析失敗」才需要向使用者說明；尚未重爬（undefined）維持舊有樣子即可，
  // 不要誤告訴使用者這份 PDF 讀不出來。
  const isUnparsable = selectedCalendar?.parsed === false;
  const eventsUrl =
    selectedCalendar && hasStructuredData
      ? `${siteConfig.links.github.api}/calendar/${selectedCalendar.year}/${selectedCalendar.semester}.json`
      : null;
  const subscribeUrl =
    selectedCalendar && hasStructuredData
      ? `${siteConfig.links.github.api}/calendar/${selectedCalendar.year}/${selectedCalendar.semester}.ics`
      : null;

  const {
    data: events,
    error: eventsError,
    refetch: refetchEvents,
  } = useFetchJson<CalendarEvent[]>(eventsUrl, { cache: true });

  const handleYearChange = (key: unknown) => {
    const selected = calendarList.find((item) => item.title === key);

    if (selected) {
      setSelectedTitle(selected.title);
      setCopyState("idle");
    }
  };

  const handleDownload = () => {
    if (!events || !selectedCalendar) return;

    downloadICS(
      generateAcademicCalendarICS(events, selectedCalendar.title),
      `${selectedCalendar.title}.ics`,
    );
  };

  const handleCopySubscribeUrl = async () => {
    if (!subscribeUrl) return;

    // 剪貼簿可能因權限或非安全來源而被擋下，此時改成直接把網址秀出來讓使用者自行複製，
    // 不要讓按鈕按下去卻毫無反應。
    try {
      await navigator.clipboard.writeText(subscribeUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="flex max-sm:flex-col max-lg:w-full items-center">
          <h1 className={title()}>{selectedCalendar?.title || "校園行事曆"}</h1>
          <Dropdown>
            {/* Button is the RAC menu trigger directly; wrapping it in
                Dropdown.Trigger would nest a <button> inside a <button>. */}
            <Button className="ml-8" variant="ghost">
              切換學年度
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="選擇學年度"
                className="max-h-60 overflow-y-auto"
                onAction={handleYearChange}
              >
                {calendarList.map((item) => (
                  <Dropdown.Item
                    key={item.title}
                    id={item.title}
                    textValue={item.title}
                  >
                    <Label>{item.title}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        {error ? (
          <FetchError
            message="行事曆載入失敗，請稍後再試。"
            onRetry={refetch}
          />
        ) : !selectedCalendar ? (
          <Loading />
        ) : (
          <Tabs
            key={selectedCalendar.title}
            className="w-full"
            defaultSelectedKey={hasStructuredData ? "events" : "pdf"}
          >
            {/* ListContainer 提供分頁列的底色與圓角；少了它，分頁只會是兩段沒有樣式的文字。
                HeroUI 的 Tabs.Indicator 需要 SharedElementTransition 祖先才能運作，
                這裡沒有，所以改用 data-selected 自行畫出選取中的底色。 */}
            <Tabs.ListContainer className="mx-auto w-fit">
              <Tabs.List aria-label="行事曆檢視方式">
                {hasStructuredData && (
                  <Tabs.Tab className={TAB_CLASS} id="events">
                    行事曆
                  </Tabs.Tab>
                )}
                <Tabs.Tab className={TAB_CLASS} id="pdf">
                  PDF 原件
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {hasStructuredData && (
              <Tabs.Panel
                className="flex flex-col items-center gap-4"
                id="events"
              >
                {eventsError ? (
                  <FetchError
                    message="行事曆內容載入失敗，可改看 PDF 原件。"
                    onRetry={refetchEvents}
                  />
                ) : !events ? (
                  <Loading />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={handleDownload}
                      >
                        <ArrowDownTrayIcon className="size-4" />
                        下載 .ics
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={handleCopySubscribeUrl}
                      >
                        <ClipboardDocumentIcon className="size-4" />
                        {copyState === "copied"
                          ? "已複製訂閱網址"
                          : "複製訂閱網址"}
                      </Button>
                    </div>
                    {copyState === "failed" && subscribeUrl && (
                      <input
                        readOnly
                        aria-label="訂閱網址"
                        className="w-full max-w-xl rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-center text-xs dark:border-gray-600 dark:bg-gray-800/40"
                        value={subscribeUrl}
                        onFocus={(e) => e.currentTarget.select()}
                      />
                    )}
                    <p className="text-center text-sm text-gray-500">
                      下載可一次匯入日曆；訂閱網址則會隨學校更新自動同步。
                    </p>
                    <AcademicCalendar events={events} />
                  </>
                )}
              </Tabs.Panel>
            )}

            <Tabs.Panel className="flex flex-col items-center gap-4" id="pdf">
              {isUnparsable && (
                <p className="text-center text-sm text-gray-500">
                  這份行事曆的 PDF 無法擷取文字，僅提供原件檢視。
                </p>
              )}
              <p className="text-gray-500">點擊下方任一頁即可放大檢視</p>
              <Suspense fallback={<Loading />}>
                <PDFDocument link={selectedCalendar.link} />
              </Suspense>
            </Tabs.Panel>
          </Tabs>
        )}
      </section>
    </DefaultLayout>
  );
};

export default CalendarPage;
