import { Separator } from "@heroui/react";
import React from "react";

import { GithubIcon, HeartFilledIcon } from "@/components/icons.tsx";
import { siteConfig } from "@/config/site.ts";
import { cardTitle } from "@/components/primitives.ts";
import { OPEN_DISCLAIMER_EVENT } from "@/components/disclaimer.tsx";
import { useLanguage } from "@/i18n/language.tsx";

const FooterLink = ({
  link,
  children,
}: {
  link: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="space-x-4">
      <a
        className="text-muted hover:text-accent dark:hover:text-accent transition-colors inline-flex items-center"
        href={link}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    </div>
  );
};

export const Footbar = () => {
  const { language, t } = useLanguage();

  return (
    <>
      <footer className="w-full flex items-center justify-center bg-background-secondary">
        {/* px-12 on phones ate 48px each side on top of the page container's
            own padding, and there was no bottom padding at all. */}
        <div className="container mx-auto max-w-7xl px-6 py-10 sm:px-12 sm:pt-12">
          <div className="sm:flex gap-8">
            <div className="space-y-4 flex-1 text-left sm:text-right">
              <h3 className={cardTitle()}>
                {t("校方連結", "University links")}
              </h3>
              <FooterLink link={siteConfig.links.utaipei.official}>
                {t("校園官網", "University website")}
              </FooterLink>
              <FooterLink link={siteConfig.links.utaipei.sky}>
                {t("校務資訊系統", "Student information system")}
              </FooterLink>
            </div>
            <Separator
              className="h-auto hidden sm:flex"
              orientation="vertical"
            />
            <Separator className="w-auto sm:hidden my-3" />
            <div className="space-y-4 flex-1">
              <h3 className={cardTitle()}>
                {t("關於專案", "About this project")}
              </h3>
              <FooterLink link={siteConfig.links.github.web}>
                <GithubIcon className="mr-2" />
                {t("網頁原始碼", "Website source code")}
              </FooterLink>
              <FooterLink link={siteConfig.links.github.crawler}>
                <GithubIcon className="mr-2" />
                {t("資料原始碼", "Crawler source code")}
              </FooterLink>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted">
              {t("北市大選課小幫手", "UTaipei Course Helper")}
              <br />
              {language === "en" ? (
                <>
                  Made with
                  <HeartFilledIcon className="text-danger inline-block align-middle mx-1" />
                </>
              ) : (
                <>
                  用
                  <HeartFilledIcon className="text-danger inline-block align-middle mx-1" />
                  發電
                </>
              )}
              <br />
            </p>
            {/* 按過「我已了解」之後橫幅就不再出現，這裡是重讀全文的唯一入口。 */}
            <button
              className="mt-2 text-sm text-muted underline underline-offset-2 hover:text-accent"
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event(OPEN_DISCLAIMER_EVENT))
              }
            >
              {t("免責聲明", "Disclaimer")}
            </button>
            <div className="w-full flex items-center justify-center py-3">
              <a
                className="flex items-center gap-1 text-muted"
                href={siteConfig.links.hero_ui.docs}
                rel="noopener noreferrer"
                target="_blank"
                title="heroui.com homepage"
              >
                <span>Powered by</span>
                <span className="text-accent">HeroUI</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
