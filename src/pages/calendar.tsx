import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { Button, Dropdown, Label, Tabs } from "@heroui/react";
import { lazy, Suspense, useMemo, useState } from "react";

import DefaultLayout from "@/layouts/default";
import { useYms } from "@/hooks/useYms.ts";
import { siteConfig } from "@/config/site.ts";
import { CalendarEvent, CalendarItem } from "@/interfaces/globals.ts";
import { PageHeader } from "@/components/page-header.tsx";
import { FetchError } from "@/components/fetch-error.tsx";
import { AcademicCalendar } from "@/components/academic-calendar.tsx";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { generateAcademicCalendarICS } from "@/utils/academic-calendar-ics.ts";
import { downloadICS } from "@/utils/ics-generator.ts";
import { LoadingState } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import CopyButton from "@/components/copy-button.tsx";
import { useT } from "@/i18n/language.tsx";
import { semesterName } from "@/i18n/terms.ts";

const PDFDocument = lazy(() => import("@/components/pdf.tsx"));

/** 選取中的分頁畫出白色藥丸底色，取代需要額外容器才能運作的 Tabs.Indicator。 */
const TAB_CLASS =
  "whitespace-nowrap data-[selected=true]:bg-white data-[selected=true]:shadow-sm dark:data-[selected=true]:bg-surface-tertiary";

/** calendar.json 的 year / semester → yms.json 的代碼，如 115 + 1 → "115#1"。 */
const ymsCodeOf = (item: CalendarItem) => `${item.year}#${item.semester}`;

export const CalendarPage = () => {
  const t = useT();
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
  const [showSubscribeUrl, setShowSubscribeUrl] = useState<boolean>(false);

  // Default to the 學年期 the school is currently enrolling for -- not to the
  // newest calendar on file. The school publishes next semester's calendar
  // well in advance, so calendarList[0] opened this page on a semester months
  // away (in 115 上學期 it landed on 115 下學期, i.e. spring of the next year)
  // while /search, which reads yms.json, correctly showed the current one.
  // The two pages disagreed about what "now" is.
  //
  // Falling back to calendarList[0] still matters: yms.json may not have
  // loaded, and the current semester's calendar may not be published yet.
  const { defaultCode, displayNameOf } = useYms();

  /**
   * calendar.json 的 title 是「本校 114 學年度下學期行事曆」，當選單觸發鈕的
   * 文字太長，22 個學期列出來也不好掃，所以不解析 title 字串。
   *
   * 名稱一律取自 yms.json，跟課程查詢等其他頁面同一套講法。這頁本來自己組
   * 「115 學年度上學期」，而 yms.json 講的是「115 學年度第 1 學期」——同一個
   * 學期兩種叫法。yms.json 沒有的學期（例如很舊的年份）才退回自組的短標籤。
   */
  const semesterLabel = (item: CalendarItem) => {
    const code = ymsCodeOf(item);
    const name = displayNameOf(code);

    return name === code
      ? t(
          `${item.year} 學年度${item.semester === 1 ? "上" : "下"}學期`,
          `AY ${item.year}, Semester ${item.semester}`,
        )
      : semesterName(name, t);
  };

  const currentCalendar = useMemo(() => {
    if (!defaultCode) return null;

    return calendarList.find((item) => ymsCodeOf(item) === defaultCode) || null;
  }, [calendarList, defaultCode]);

  const selectedCalendar =
    (selectedTitle
      ? calendarList.find((item) => item.title === selectedTitle)
      : undefined) ||
    currentCalendar ||
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
      setShowSubscribeUrl(false);
    }
  };

  const handleDownload = () => {
    if (!events || !selectedCalendar) return;

    downloadICS(
      generateAcademicCalendarICS(events, selectedCalendar.title),
      `${selectedCalendar.title}.ics`,
    );
  };

  const showSub = () => {
    setShowSubscribeUrl(true);
  };

  return (
    <DefaultLayout>
      <PageSection align="stretch" className="gap-6">
        {/* 標題固定不隨選取的學期變動，學期改由選單觸發鈕自己顯示：切換時標題不會跳動，
            也不必把同一份資訊寫兩遍。 */}
        <PageHeader
          actions={
            selectedCalendar && (
              <Dropdown>
                {/* Button is the RAC menu trigger directly; wrapping it in
                    Dropdown.Trigger would nest a <button> inside a <button>. */}
                <Button
                  aria-label={t(
                    `切換學年度，目前為 ${semesterLabel(selectedCalendar)}`,
                    `Change semester, currently ${semesterLabel(selectedCalendar)}`,
                  )}
                  className="max-sm:w-full max-sm:justify-between"
                  variant="outline"
                >
                  {semesterLabel(selectedCalendar)}
                  <ChevronDownIcon className="size-4" />
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    aria-label={t("選擇學年度", "Select semester")}
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
          description={t(
            "學校公告的學期重要日程，可下載或訂閱到個人日曆。",
            "Key dates published by the university. Download them or subscribe from your own calendar app.",
          )}
          title={t("校園行事曆", "Academic Calendar")}
        />

        {error ? (
          <FetchError
            message={t(
              "行事曆載入失敗，請稍後再試。",
              "Failed to load the calendar. Please try again later.",
            )}
            onRetry={refetch}
          />
        ) : !selectedCalendar ? (
          <LoadingState />
        ) : (
          <Tabs
            key={selectedCalendar.title}
            className="w-full"
            defaultSelectedKey={hasStructuredData ? "events" : "pdf"}
          >
            {/* 分頁列與匯出動作併成同一列工具列，讓月曆本體早一點出現在第一屏。
                匯出按鈕只看 hasStructuredData、不看目前在哪個分頁：改成跟著分頁走就得把
                Tabs 變成受控元件，而換學期時是靠上面的 key 重新掛載來重設預設分頁的。 */}
            <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
              {/* ListContainer 提供分頁列的底色與圓角；少了它，分頁只會是兩段沒有樣式的文字。
                  HeroUI 的 Tabs.Indicator 需要 SharedElementTransition 祖先才能運作，
                  這裡沒有，所以改用 data-selected 自行畫出選取中的底色。 */}
              <Tabs.ListContainer className="w-fit">
                <Tabs.List aria-label={t("行事曆檢視方式", "Calendar view")}>
                  {hasStructuredData && (
                    <Tabs.Tab className={TAB_CLASS} id="events">
                      {t("行事曆", "Calendar")}
                    </Tabs.Tab>
                  )}
                  <Tabs.Tab className={TAB_CLASS} id="pdf">
                    {t("PDF 原件", "Original PDF")}
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
                      {t("下載 .ics", "Download .ics")}
                    </Button>
                    <CopyButton
                      copiedText={t(
                        "已複製訂閱網址",
                        "Subscription URL copied",
                      )}
                      idleIcon={<ClipboardDocumentIcon className="size-4" />}
                      idleText={t("複製訂閱網址", "Copy subscription URL")}
                      size="sm"
                      variant="ghost"
                      writeText={subscribeUrl}
                      onError={showSub}
                    />
                  </div>
                  <p className="text-xs text-muted sm:text-right">
                    {t(
                      "下載可一次匯入日曆；訂閱網址則會隨學校更新自動同步。",
                      "Downloading imports the events once; the subscription URL keeps syncing as the university updates them.",
                    )}
                  </p>
                  {showSubscribeUrl && subscribeUrl && (
                    <input
                      readOnly
                      aria-label={t("訂閱網址", "Subscription URL")}
                      className="w-full rounded-md border border-border bg-background-secondary px-3 py-1.5 text-xs sm:max-w-sm"
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
                    message={t(
                      "行事曆內容載入失敗，可改看 PDF 原件。",
                      "Failed to load the calendar events. You can view the original PDF instead.",
                    )}
                    onRetry={refetchEvents}
                  />
                ) : !events ? (
                  <LoadingState />
                ) : (
                  <AcademicCalendar events={events} />
                )}
              </Tabs.Panel>
            )}

            <Tabs.Panel className="flex flex-col items-center gap-4" id="pdf">
              {isUnparsable && (
                <p className="text-center text-sm text-muted">
                  {t(
                    "這份行事曆的 PDF 無法擷取文字，僅提供原件檢視。",
                    "Text cannot be extracted from this calendar's PDF, so only the original is available.",
                  )}
                </p>
              )}
              <p className="text-muted">
                {t(
                  "點擊下方任一頁即可放大檢視",
                  "Click any page below to enlarge it",
                )}
              </p>
              <Suspense fallback={<LoadingState />}>
                <PDFDocument link={selectedCalendar.link} />
              </Suspense>
            </Tabs.Panel>
          </Tabs>
        )}
      </PageSection>
    </DefaultLayout>
  );
};

export default CalendarPage;
