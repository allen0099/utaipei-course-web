import { FC, useEffect, useState } from "react";
import { ComputerDesktopIcon } from "@heroicons/react/24/solid";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";
import {
  applyTheme,
  onSystemThemeChange,
  readThemePreference,
  saveThemePreference,
  ThemePreference,
} from "@/utils/theme.ts";
import { useT } from "@/i18n/language.tsx";

export interface ThemeSwitchProps {
  className?: string;
}

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABEL: Record<ThemePreference, string> = {
  system: "跟隨系統",
  light: "淺色模式",
  dark: "深色模式",
};

const LABEL_EN: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

/**
 * 三態切換：跟隨系統 → 淺色 → 深色。
 *
 * 原本只有淺／深兩態，而且一按就把選擇寫死進 localStorage —— 從此系統在傍晚
 * 自動切深色時，這個站是唯一不跟的。現在「跟隨系統」是一個可以回得去的選項。
 */
export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [preference, setPreference] =
    useState<ThemePreference>(readThemePreference);
  const t = useT();

  // 跟隨系統時，系統一變就重新套用。index.html 的開機腳本只管第一次繪製。
  useEffect(() => {
    if (preference !== "system") return;

    return onSystemThemeChange(() => applyTheme("system"));
  }, [preference]);

  const cycle = () => {
    const next = NEXT[preference];

    setPreference(next);
    saveThemePreference(next);
    applyTheme(next);
  };

  return (
    <button
      aria-label={t(
        `主題：${LABEL[preference]}，按一下切換為${LABEL[NEXT[preference]]}`,
        `Theme: ${LABEL_EN[preference]}. Click to switch to ${LABEL_EN[NEXT[preference]]}`,
      )}
      className={`grid size-11 place-items-center transition-opacity hover:opacity-80 cursor-pointer text-muted ${className ?? ""}`}
      title={t(`主題：${LABEL[preference]}`, `Theme: ${LABEL_EN[preference]}`)}
      type="button"
      onClick={cycle}
    >
      {preference === "system" ? (
        <ComputerDesktopIcon className="size-[22px]" />
      ) : preference === "dark" ? (
        <MoonFilledIcon size={22} />
      ) : (
        <SunFilledIcon size={22} />
      )}
    </button>
  );
};
