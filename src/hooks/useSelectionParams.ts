import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Key } from "@react-types/shared";

const PARAM_YMS = "yms";

/**
 * 串聯選擇器（學年期 → 系級 → 教師…）的狀態，並同步到網址的 query string。
 *
 * 教師／班級／地點課表原本全是 useState：重新整理就回到空白頁，也沒辦法把
 * 「某位老師這學期的課表」貼給同學。網址只在掛載時讀一次，之後以使用者的操作
 * 為準並寫回網址（replace，不塞滿上一頁紀錄）。
 *
 * `keys` 是學年期以下的各層，依上下游順序。換學年期會清空全部下游 —— 唯一的
 * 例外是 YmsSelector 掛載後第一次回報、而且回報的正是網址上那個學年期：那是在
 * 還原連結，清掉下游等於把連結要開的東西丟掉。
 */
export const useSelectionParams = <K extends string>(keys: readonly K[]) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [initialYms] = useState(() => searchParams.get(PARAM_YMS) ?? "");
  const [yms, setYms] = useState(initialYms);
  const [values, setValues] = useState<Record<K, string>>(
    () =>
      Object.fromEntries(
        keys.map((key) => [key, searchParams.get(key) ?? ""]),
      ) as Record<K, string>,
  );
  const isFirstYmsReport = useRef(true);

  useEffect(() => {
    const params = new URLSearchParams();

    if (yms) params.set(PARAM_YMS, yms);
    keys.forEach((key) => {
      if (values[key]) params.set(key, values[key]);
    });

    setSearchParams(params, { replace: true });
    // setSearchParams 的 identity 會變但行為不變；`keys` 是呼叫端的常數。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yms, values]);

  const onYmsChange = useCallback(
    (id: Key | null) => {
      const next = id?.toString() || "";
      const isRestoring = isFirstYmsReport.current && next === initialYms;

      isFirstYmsReport.current = false;
      setYms(next);

      if (!isRestoring) {
        setValues(
          Object.fromEntries(keys.map((key) => [key, ""])) as Record<K, string>,
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialYms],
  );

  /** 設定某一層，並清空它下游的每一層。 */
  const select = useCallback(
    (key: K, id: Key | null) => {
      setValues((current) => {
        const next: Record<K, string> = {
          ...current,
          [key]: id?.toString() || "",
        };

        keys.slice(keys.indexOf(key) + 1).forEach((downstream) => {
          next[downstream] = "";
        });

        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { yms, initialYms, values, onYmsChange, select };
};
