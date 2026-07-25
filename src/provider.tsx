import { ReactNode } from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";
import { useHref, useNavigate } from "react-router-dom";

export function Provider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <I18nProvider locale="zh-TW-u-ca-roc">
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
