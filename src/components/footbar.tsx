import { Separator } from "@heroui/react";
import React from "react";

import { GithubIcon, HeartFilledIcon } from "@/components/icons.tsx";
import { siteConfig } from "@/config/site.ts";

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
        className="text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent transition-colors inline-flex items-center"
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
  return (
    <>
      <footer className="w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto max-w-7xl px-12 pt-12">
          <div className="sm:flex gap-8">
            <div className="space-y-4 flex-1 text-left sm:text-right">
              <h3 className="text-lg font-bold">校方連結</h3>
              <FooterLink link={siteConfig.links.utaipei.official}>
                校園官網
              </FooterLink>
              <FooterLink link={siteConfig.links.utaipei.sky}>
                校務資訊系統
              </FooterLink>
            </div>
            <Separator
              className="h-auto hidden sm:flex"
              orientation="vertical"
            />
            <Separator className="w-auto sm:hidden my-3" />
            <div className="space-y-4 flex-1">
              <h3 className="text-lg font-bold">關於專案</h3>
              <FooterLink link={siteConfig.links.github.web}>
                <GithubIcon className="mr-2" />
                網頁原始碼
              </FooterLink>
              <FooterLink link={siteConfig.links.github.crawler}>
                <GithubIcon className="mr-2" />
                資料原始碼
              </FooterLink>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              北市大選課小幫手
              <br />用
              <HeartFilledIcon className="text-danger inline-block align-middle mx-1" />
              發電
              <br />
            </p>
            <div className="w-full flex items-center justify-center py-3">
              <a
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400"
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
