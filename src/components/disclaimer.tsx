import { useEffect, useRef, useState } from "react";
import { Modal, Button } from "@heroui/react";

import { useLanguage } from "@/i18n/language.tsx";

function hasDisclaimerCookie() {
  const cookies = document.cookie.split(";");

  return cookies.some((cookie) =>
    cookie.trim().startsWith("disclaimer_accepted="),
  );
}

/**
 * 頁尾的「免責聲明」連結用這個事件請這裡把全文打開。兩者分屬 layout 的頭尾，
 * 為了一個布林值拉一個 context 不划算。
 */
export const OPEN_DISCLAIMER_EVENT = "utc:open-disclaimer";

/**
 * 橫幅目前佔掉畫面底部多少高度。同樣釘在底部的 SelectionBar 靠它往上讓 ——
 * 不讓的話橫幅會整個蓋住「前往我的課表」，而第一次來的人正是最需要那條列的人。
 */
export const DISCLAIMER_OFFSET_VAR = "--disclaimer-offset";

const CONTACT_EMAIL = "allen0099@sudo.host";
const LAST_UPDATED = "2025-08-24";

/** 英文版不逐字對譯：語序不同，強調的 <span> 落點也跟著不同。 */
const DisclaimerBodyEn = () => (
  <>
    <p className="mb-4 text-foreground">
      This website is an <span className="text-danger">unofficial</span> course
      lookup tool. All data comes from the university&apos;s public course
      selection system and is provided for personal reference only.
      <br />
      Data may be delayed or incorrect because of system updates or network
      conditions.{" "}
      <span className="text-danger">
        Always defer to the university&apos;s official announcements.
      </span>
      <br />
      By using this website you confirm that you have read and agree to the
      following:
    </p>

    <ul className="mb-4 text-foreground list-disc list-inside space-y-1">
      <li>
        This website is not affiliated with or authorized by the university and
        does not represent its position.
      </li>
      <li>
        Course information is for reference only, with{" "}
        <span className="text-danger">
          no guarantee of timeliness, completeness or accuracy
        </span>
        .
      </li>
      <li>
        For questions or rights-related concerns, please contact us; we will
        respond as soon as the issue is confirmed.
      </li>
      <li>
        This website does not collect, process or disclose any student&apos;s
        personal data.
      </li>
    </ul>

    <p className="mb-4 text-foreground">
      To improve your experience, this website may store cookies on your device.
      If you prefer not to accept them, you can block cookies in your
      browser&apos;s privacy settings, but some features may stop working
      properly.
    </p>

    <div className="text-xs text-muted mt-2 select-text">
      Contact:{" "}
      <a
        className="underline underline-offset-2"
        href={`mailto:${CONTACT_EMAIL}`}
      >
        {CONTACT_EMAIL}
      </a>
      <br />
      Last updated: {LAST_UPDATED}
    </div>
  </>
);

/** 聲明全文。橫幅的「完整聲明」與頁尾的連結開的是同一份。 */
const DisclaimerBodyZh = () => (
  <>
    <p className="mb-4 text-foreground">
      本網站為
      <span className="text-danger">非官方</span>
      課程查詢工具， 所有資料均由學校公開選課系統取得，僅供個人與同學參考之用。
      <br />
      資料可能因系統更新或網路狀況產生延遲或錯誤，
      <span className="text-danger">請以學校官方公告為準</span>。
      <br />
      使用本網站即表示您已閱讀並同意以下內容：
    </p>

    <ul className="mb-4 text-foreground list-disc list-inside space-y-1">
      <li>本網站與學校無任何隸屬或授權關係，不代表學校立場。</li>
      <li>
        課程資訊僅供參考，
        <span className="text-danger">不保證即時性、完整性或正確性</span>。
      </li>
      <li>如有疑義或權利相關問題，請與本站聯絡，經確認後將盡速處理。</li>
      <li>本站不蒐集、不處理、不揭露任何學生個人資料。</li>
    </ul>

    <p className="mb-4 text-foreground">
      為改善使用體驗，本網站可能會在您的裝置上存取
      Cookie。若您不願接受，您可於瀏覽器設定中調整隱私權等級以阻擋
      Cookie，但可能導致部分功能無法正常運作。
    </p>

    {/* The address used to be spelled "allen0099[at]sudo.host" and was not a
        link, so the bullet above telling people to get in touch asked them to
        retype it by hand. The [at] spelling stops neither modern scrapers nor
        anything else that reads the rendered DOM, so it only ever cost the
        reader. */}
    <div className="text-xs text-muted mt-2 select-text">
      聯絡信箱：
      <a
        className="underline underline-offset-2"
        href={`mailto:${CONTACT_EMAIL}`}
      >
        {CONTACT_EMAIL}
      </a>
      <br />
      最後更新：{LAST_UPDATED}
    </div>
  </>
);

const DisclaimerBody = () => {
  const { language } = useLanguage();

  return language === "en" ? <DisclaimerBodyEn /> : <DisclaimerBodyZh />;
};

/**
 * 免責聲明：首次造訪時的底部橫幅，全文收在可關閉的視窗裡。
 *
 * 原本是一個關不掉的全螢幕視窗，擋在每一頁前面直到按下同意。代價是：從搜尋
 * 引擎或同學貼的連結進來的人，看到的第一個畫面不是他要找的課表而是一面文字
 * 牆；而內容其實是告知性質（非官方、僅供參考、請以學校公告為準），不需要用
 * 擋住整個網站來換一個點擊。橫幅一樣在第一眼就看得到、一樣要按過才會消失，
 * 只是不再挾持頁面。
 */
export const DisclaimerModal = () => {
  // Initialize synchronously from the cookie so we don't need a mount effect
  // just to flip this to true/false on first render.
  const [pending, setPending] = useState(() => !hasDisclaimerCookie());
  const [detailOpen, setDetailOpen] = useState(false);
  const { language, t } = useLanguage();

  const bannerRef = useRef<HTMLDivElement>(null);

  // 高度用量的：文字在手機上會折成三四行，寫死一個數字一定有一邊不對。
  useEffect(() => {
    const banner = bannerRef.current;
    const root = document.documentElement;

    if (!pending || !banner) return;

    const publish = () =>
      root.style.setProperty(
        DISCLAIMER_OFFSET_VAR,
        `${banner.getBoundingClientRect().height}px`,
      );
    const observer = new ResizeObserver(publish);

    publish();
    observer.observe(banner);

    return () => {
      observer.disconnect();
      root.style.removeProperty(DISCLAIMER_OFFSET_VAR);
    };
  }, [pending]);

  useEffect(() => {
    const open = () => setDetailOpen(true);

    window.addEventListener(OPEN_DISCLAIMER_EVENT, open);

    return () => window.removeEventListener(OPEN_DISCLAIMER_EVENT, open);
  }, []);

  const handleAccept = () => {
    document.cookie = `disclaimer_accepted=true; path=/; max-age=${60 * 60 * 24 * 365}`;
    setPending(false);
    setDetailOpen(false);
  };

  return (
    <>
      {pending && (
        <div
          ref={bannerRef}
          aria-label={t("免責聲明", "Disclaimer")}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface shadow-lg"
          role="region"
          // 避開 iPhone 底部的 home indicator。
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="container mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 md:flex-row md:items-center md:justify-between">
            {language === "en" ? (
              <p className="text-sm">
                This is an{" "}
                <span className="font-semibold text-danger">unofficial</span>{" "}
                course lookup tool. Data may be delayed or wrong —{" "}
                <span className="font-semibold">
                  always defer to the university&apos;s official announcements
                </span>
                . By continuing you acknowledge this.
              </p>
            ) : (
              <p className="text-sm">
                本站為<span className="font-semibold text-danger">非官方</span>
                課程查詢工具，資料可能延遲或有誤，
                <span className="font-semibold">請以學校官方公告為準</span>
                。繼續使用即表示您已了解。
              </p>
            )}
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => setDetailOpen(true)}
              >
                {t("完整聲明", "Full disclaimer")}
              </Button>
              <Button size="sm" variant="primary" onPress={handleAccept}>
                {t("我已了解", "Got it")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal>
        <Modal.Backdrop isOpen={detailOpen} onOpenChange={setDetailOpen}>
          {/* scroll="inside" keeps the header and the buttons pinned and
              scrolls only the text; at 375x667 the text alone is ~600px. */}
          <Modal.Container className="max-w-3xl" scroll="inside">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="text-danger">
                  {t("免責聲明", "Disclaimer")}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <DisclaimerBody />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setDetailOpen(false)}>
                  {t("關閉", "Close")}
                </Button>
                {pending && (
                  <Button variant="primary" onPress={handleAccept}>
                    {t("我已了解", "Got it")}
                  </Button>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
};

export default DisclaimerModal;
