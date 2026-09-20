import { ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";
import { useHref, useNavigate } from "react-router";

import { useLanguage } from "@/i18n/language.tsx";

export function Provider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    // 中文介面用民國曆（學校的行事曆與學年度都是民國紀年）；英文介面用西曆，
    // 「Year 115」對不熟民國紀年的人沒有意義。
    <I18nProvider locale={language === "en" ? "en-US" : "zh-TW-u-ca-roc"}>
      {/*
        Without this, every HeroUI `<Link href>` renders a bare anchor and each
        in-app navigation is a full page load: the bundle is re-downloaded, the
        selected-courses context re-hydrates from localStorage and the
        disclaimer cookie is re-evaluated. Handing react-router's navigate to
        RouterProvider makes them client-side transitions instead.
      */}
      <RouterProvider navigate={navigate} useHref={useHref}>
        {children}
      </RouterProvider>
    </I18nProvider>
  );
}
