import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { Spinner, Button, Dropdown, Label, Tabs } from "@heroui/react";
import { lazy, Suspense, useMemo, useState } from "react";

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import { CalendarEvent, CalendarItem } from "@/interfaces/globals.ts";
import { PageHeader } from "@/components/page-header.tsx";
import { FetchError } from "@/components/fetch-error.tsx";
import { AcademicCalendar } from "@/components/academic-calendar.tsx";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { generateAcademicCalendarICS } from "@/utils/academic-calendar-ics.ts";
import { downloadICS } from "@/utils/ics-generator.ts";

const PDFDocument = lazy(() => import("@/components/pdf.tsx"));

/** 選取中的分頁畫出白色藥丸底色，取代需要額外容器才能運作的 Tabs.Indicator。 */
const TAB_CLASS =
  "whitespace-nowrap data-[selected=true]:bg-white data-[selected=true]:shadow-sm dark:data-[selected=true]:bg-gray-700";

/**
 * calendar.json 的 title 是「本校 114 學年度下學期行事曆」，當選單觸發鈕的文字太長，
 * 22 個學期列出來也不好掃。改用結構化的 year / semester 欄位組出精簡標籤，
 * 不要去解析 title 字串。
 */
const semesterLabel = (item: CalendarItem) =>
  `${item.year} 學年度${item.semester === 1 ? "上" : "下"}學期`;

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
      <section className="flex w-full flex-col gap-6 py-6 md:py-8">
        {/* 標題固定不隨選取的學期變動，學期改由選單觸發鈕自己顯示：切換時標題不會跳動，
            也不必把同一份資訊寫兩遍。 */}
        <PageHeader
          actions={
            selectedCalendar && (
              <Dropdown>
                {/* Button is the RAC menu trigger directly; wrapping it in
                    Dropdown.Trigger would nest a <button> inside a <button>. */}
                <Button
                  aria-label={`切換學年度，目前為 ${semesterLabel(selectedCalendar)}`}
                  className="max-sm:w-full max-sm:justify-between"
                  variant="outline"
                >
                  {semesterLabel(selectedCalendar)}
                  <ChevronDownIcon className="size-4" />
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
                        textValue={semesterLabel(item)}
                      >
                        <Label>{semesterLabel(item)}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            )
          }
          description="學校公告的學期重要日程，可下載或訂閱到個人日曆。"
          title="校園行事曆"
        />

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
            {/* 分頁列與匯出動作併成同一列工具列，讓月曆本體早一點出現在第一屏。
                匯出按鈕只看 hasStructuredData、不看目前在哪個分頁：改成跟著分頁走就得把
                Tabs 變成受控元件，而換學期時是靠上面的 key 重新掛載來重設預設分頁的。 */}
            <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
              {/* ListContainer 提供分頁列的底色與圓角；少了它，分頁只會是兩段沒有樣式的文字。
                  HeroUI 的 Tabs.Indicator 需要 SharedElementTransition 祖先才能運作，
                  這裡沒有，所以改用 data-selected 自行畫出選取中的底色。 */}
              <Tabs.ListContainer className="w-fit">
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
                <div className="flex flex-col items-stretch gap-1 sm:items-end">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      // events 還沒載入完就按下去只會靜靜地沒反應，先擋住。
                      isDisabled={!events}
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
                  <p className="text-xs text-gray-500 sm:text-right">
                    下載可一次匯入日曆；訂閱網址則會隨學校更新自動同步。
                  </p>
                  {copyState === "failed" && subscribeUrl && (
                    <input
                      readOnly
                      aria-label="訂閱網址"
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs sm:max-w-sm dark:border-gray-600 dark:bg-gray-800/40"
                      value={subscribeUrl}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  )}
                </div>
              )}
            </div>

            {hasStructuredData && (
              <Tabs.Panel className="flex flex-col gap-4" id="events">
                {eventsError ? (
                  <FetchError
                    message="行事曆內容載入失敗，可改看 PDF 原件。"
                    onRetry={refetchEvents}
                  />
                ) : !events ? (
                  <Loading />
                ) : (
                  <AcademicCalendar events={events} />
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
