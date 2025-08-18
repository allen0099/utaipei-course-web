import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
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
      <Link
        className="text-default-600 hover:text-primary"
        href={link}
        isExternal={true}
      >
        {children}
      </Link>
    </div>
  );
};

export const Footbar = () => {
  return (
    <>
      <footer className="w-full flex items-center justify-center">
        <div className="container mx-auto max-w-7xl px-12 pt-12">
          <div className="sm:flex gap-8">
            <div className="space-y-4 flex-1 text-left sm:text-right">
              <h3 className="text-lg font-bold">校方連結</h3>
              <div className="space-x-4">
                <h4 className="text-default-600">還沒有整理啦</h4>
              </div>
            </div>
            <Divider className="h-auto hidden sm:flex" orientation="vertical" />
            <Divider className="w-auto sm:hidden my-3" />
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
          <div className="border-t border-default-200 dark:border-default-700 mt-8 pt-8 text-center">
            <p className="text-sm text-default-600">
              北市大選課小幫手
              <br />用
              <HeartFilledIcon className="text-danger inline-block align-middle mx-1" />
              發電
              <br />
              <div className="w-full flex items-center justify-center py-3">
                <Link
                  isExternal
                  className="flex items-center gap-1 text-current"
                  href={siteConfig.links.hero_ui.docs}
                  title="heroui.com homepage"
                >
                  <span className="text-default-600">Powered by</span>
                  <p className="text-primary">HeroUI</p>
                </Link>
              </div>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};
