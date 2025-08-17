import { Link } from "@heroui/link";
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
    <div className="flex space-x-4">
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
        <div className="container mx-auto max-w-7xl px-12 md:px-0 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold md:text-left text-center">
                校方連結
              </h3>
              <div className="flex space-x-4">
                <h4 className="text-default-600">還沒有整理啦</h4>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold md:text-left text-center">
                關於專案
              </h3>
              <FooterLink link="https://github.com/allen0099/utaipei-course-web">
                <GithubIcon className="mr-2" />
                網頁原始碼
              </FooterLink>
              <FooterLink link={siteConfig.links.github_crawler}>
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
                  href="https://heroui.com"
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
