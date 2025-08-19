import type { JSX } from "react";

import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useEffect, useState } from "react";
import { Link } from "@heroui/link";

import DefaultLayout from "@/layouts/default";
import { AnnounceHrefItem, AnnouncementItem } from "@/interfaces/globals.ts";
import { CourseFunctions } from "@/components/course-functions.tsx";
import { siteConfig } from "@/config/site.ts";

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
          <Link
            key={idx}
            isExternal
            showAnchorIcon
            className="text-blue-600 underline hover:text-blue-800"
            href={part.link}
          >
            {part.text}
          </Link>
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
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/announcement.json`)
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        {loading ? (
          <Spinner />
        ) : (
          <Card
            isFooterBlurred
            className="border-none w-full max-w-2xl bg-yellow-50"
            radius="lg"
          >
            <CardHeader className="flex justify-center text-center w-full">
              <p className="text-2xl font-bold w-full">校園公告</p>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2">
                {announcements.map((item, idx) => (
                  <li key={idx} className={getIndentClass(item.level)}>
                    <span className="text-default-700 whitespace-pre-line">
                      {renderTextWithLinks(item.text, item.href)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
            <CardFooter>
              <Link
                isExternal
                showAnchorIcon
                href={siteConfig.links.utaipei.sky}
              >
                詳細公告請見校務資訊系統
              </Link>
            </CardFooter>
          </Card>
        )}
      </section>
      <CourseFunctions />
    </DefaultLayout>
  );
}
