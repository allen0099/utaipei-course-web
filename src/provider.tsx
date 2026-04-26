import { ReactNode } from "react";
import { I18nProvider } from "react-aria-components";

export function Provider({ children }: { children: ReactNode }) {
  return <I18nProvider locale="zh-TW-u-ca-roc">{children}</I18nProvider>;
}
