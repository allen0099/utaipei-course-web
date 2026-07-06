import type { JSX } from "react";

import { Card, Link, Spinner } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { AnnounceHrefItem, AnnouncementItem } from "@/interfaces/globals.ts";
import { CourseFunctions } from "@/components/course-functions.tsx";
import { FetchError } from "@/components/fetch-error.tsx";
import { siteConfig } from "@/config/site.ts";
import { title } from "@/components/primitives.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";

const reDate = /((?:\d{3}\s年)?\s\d{1,2}\s[/\-月]\s\d{1,2}\s日?)(?!\d)/g;

// 計算縮排 class
const getIndentClass = (level: number) => {
  // level=1 無縮排，level=2 pl-4, level=3 pl-8 ...
  return `pl-${(level - 1) * 4}`;
};

// 將 text 中出現 href.text 的部分轉為 Link，並在 Link 前後自動補空白（若無則補）
const renderTextWithLinks = (text: string, hrefs?: AnnounceHrefItem[]) => {
  if (!hrefs || hrefs.length === 0) return highlightDate(text); // 無連結時直接高亮日期
  // 依照 hrefs.text 長度排序，避免短字串先被分割
  const sortedHrefs = [...hrefs].sort((a, b) => b.text.length - a.text.length);
  let parts: (string | AnnounceHrefItem)[] = [text];

  sortedHrefs.forEach((href) => {
    const nextParts: (string | AnnounceHrefItem)[] = [];

    parts.forEach((part) => {
      if (typeof part === "string") {
        const split = part.split(href.text);

        for (let i = 0; i < split.length; i++) {
          if (split[i]) nextParts.push(split[i]);
          if (i < split.length - 1) nextParts.push(href);
        }
      } else {
        nextParts.push(part);
      }
    });
    parts = nextParts;
  });
  // 處理 Link 前後自動補空白
  const isPunctuation = (ch: string) =>
    /[\s.,;:!?\u0000-)\]"'、。！？：；，）】》]/.test(ch);

  return parts.map((part, idx) => {
    if (typeof part === "string") {
      // 對每個 string 部分進行日期高亮
      return <span key={idx}>{highlightDate(part)}</span>;
    } else {
      // 取得前後的字串
      const prev =
        idx > 0 && typeof parts[idx - 1] === "string"
          ? (parts[idx - 1] as string)
          : "";
      const next =
        idx < parts.length - 1 && typeof parts[idx + 1] === "string"
          ? (parts[idx + 1] as string)
          : "";
      // 判斷是否需要在 Link 前後補空白
      const needSpaceBefore = prev && !prev.match(/[\s]$/);
      const needSpaceAfter =
        next && !next.match(/^[\s]/) && !(next && isPunctuation(next[0]));

      return (
        <>
          {needSpaceBefore && " "}
          <a
            key={idx}
            className="text-accent underline hover:text-accent-hover inline-flex items-center gap-0.5"
            href={part.link}
            rel="noopener noreferrer"
            target="_blank"
          >
            {part.text}
            <svg
              aria-hidden="true"
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M14 5H20M20 5V11M20 5L11 14M10 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          {needSpaceAfter && " "}
        </>
      );
    }
  });
};

// 新增：高亮日期的函數
const highlightDate = (text: string) => {
  if (!text) return text;
  const re = reDate;
  const result: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  // 使用正則全局匹配
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    result.push(
      <span key={match.index} className="text-red-600 font-bold">
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  // 重置正則 lastIndex，避免多次調用出錯
  re.lastIndex = 0;

  return result.length > 0 ? result : text;
};

export default function IndexPage() {
  const {
    data: announcements = [],
    loading,
    error,
    refetch,
  } = useFetchJson<AnnouncementItem[]>(
    `${siteConfig.links.github.api}/announcement.json`,
  );

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <section className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-10 pb-4 md:pb-8">
          <img
            alt=""
            className="w-32 h-32 md:w-40 md:h-40 object-contain shrink-0"
            src="/CatMeow.png"
          />
          <div className="flex flex-col items-center md:items-start gap-3 text-center md:text-left">
            <h1 className={title()}>{siteConfig.name}</h1>
            <p className="text-muted text-lg max-w-md">
              {siteConfig.description}
            </p>
            <div className="flex gap-3 mt-2">
              <Link
                className="button button--primary button--md"
                href="/search"
              >
                開始查課程
              </Link>
              <Link
                className="button button--secondary button--md"
                href="/calendar"
              >
                校園行事曆
              </Link>
            </div>
          </div>
        </section>
        <CourseFunctions />
        {loading ? (
          <div className="flex items-center gap-2 mt-8">
            <Spinner />
            <span>正在載入校園公告...</span>
          </div>
        ) : error ? (
          <FetchError
            className="mt-8"
            message="校園公告載入失敗，請稍後再試。"
            onRetry={refetch}
          />
        ) : (
          <Card className="border border-warning/30 border-l-4 border-l-warning w-full max-w-2xl bg-surface">
            <Card.Header className="flex justify-center text-center w-full">
              <p className="text-2xl font-bold w-full">校園公告</p>
            </Card.Header>
            <Card.Content>
              <ul className="space-y-2">
                {announcements.map((item, idx) => (
                  <li key={idx} className={getIndentClass(item.level)}>
                    <span className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {renderTextWithLinks(item.text, item.href)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card.Content>
            <Card.Footer>
              <a
                className="inline-flex items-center gap-1 text-accent hover:text-accent-hover"
                href={siteConfig.links.utaipei.sky}
                rel="noopener noreferrer"
                target="_blank"
              >
                詳細公告請見校務資訊系統
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M14 5H20M20 5V11M20 5L11 14M10 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </Card.Footer>
          </Card>
        )}
      </section>
    </DefaultLayout>
  );
}
