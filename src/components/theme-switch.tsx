import { FC, useState, useEffect } from "react";
import { VisuallyHidden } from "@react-aria/visually-hidden";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const newDark = !isDark;

    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!isMounted) return <div className="w-6 h-6" />;

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`px-px transition-opacity hover:opacity-80 cursor-pointer text-muted ${className ?? ""}`}
      type="button"
      onClick={toggle}
    >
      <VisuallyHidden>
        <input readOnly checked={isDark} type="checkbox" />
      </VisuallyHidden>
      {isDark ? <MoonFilledIcon size={22} /> : <SunFilledIcon size={22} />}
    </button>
  );
};
