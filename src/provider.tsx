import type { NavigateOptions } from "react-router-dom";

import { CalendarDate, TaiwanCalendar } from "@internationalized/date";
import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import { I18nProvider } from "@react-aria/i18n";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

const createCalendar = (identifier: string) => {
  switch (identifier) {
    case "roc":
      return new TaiwanCalendar();
    default:
      throw new Error(`Unsupported calendar ${identifier}`);
  }
};

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const locale = "zh-TW";

  return (
    <HeroUIProvider
      createCalendar={createCalendar}
      defaultDates={{
        minDate: new CalendarDate(2015, 1, 1),
        maxDate: new CalendarDate(2099, 12, 31),
      }}
      locale={locale}
      navigate={navigate}
      useHref={useHref}
    >
      <I18nProvider locale={`${locale}-u-ca-roc`}>{children}</I18nProvider>
    </HeroUIProvider>
  );
}
