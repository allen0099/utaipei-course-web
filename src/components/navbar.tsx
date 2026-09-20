import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Button, Dropdown, Label } from "@heroui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

import { NavItem, siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { OPEN_PALETTE_EVENT } from "@/components/command-palette.tsx";
import { useLanguage, useT } from "@/i18n/language.tsx";

/** 按鈕上寫的是「會切過去的那個語言」，而且用那個語言寫：看不懂目前介面的人
 * 才認得出這顆是給他的。 */
const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();
  const next = language === "en" ? "zh" : "en";

  return (
    <button
      aria-label={next === "en" ? "Switch to English" : "切換為中文"}
      className="rounded-md px-2 py-1.5 text-sm font-medium text-muted hover:bg-surface-secondary hover:text-foreground"
      lang={next === "en" ? "en" : "zh-TW"}
      type="button"
      onClick={() => setLanguage(next)}
    >
      {next === "en" ? "EN" : "中文"}
    </button>
  );
};

const SearchButton = ({ showShortcut }: { showShortcut?: boolean }) => {
  const t = useT();

  return (
    <button
      aria-label={t("全站搜尋", "Search the site")}
      className="flex items-center gap-2 rounded-md p-2 text-sm text-muted hover:bg-surface-secondary hover:text-foreground"
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
    >
      <MagnifyingGlassIcon className="size-5" />
      {showShortcut && (
        <kbd className="rounded border border-border px-1.5 py-0.5 text-xs">
          Ctrl K
        </kbd>
      )}
    </button>
  );
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "flex items-center gap-1 rounded-md text-sm transition-colors",
    isActive
      ? "font-medium text-accent"
      : "text-foreground hover:text-accent dark:hover:text-accent",
  );

const NavItemLink = ({
  item,
  className,
  onNavigate,
}: {
  item: NavItem;
  className?: string;
  onNavigate?: () => void;
}) => {
  const t = useT();

  return (
    <NavLink
      // `end` matters for "/" — without it NavLink treats the root as a prefix
      // match and 首頁 stays highlighted on every route.
      className={(state) => clsx(linkClass(state), className)}
      end={item.href === "/"}
      to={item.href}
      onClick={onNavigate}
    >
      {t(item.label, item.labelEn)}
    </NavLink>
  );
};

export const Navbar = () => {
  const { pathname } = useLocation();
  const t = useT();
  // 記「在哪一頁打開的」而不是一個布林值：換了頁這個值就對不上，選單自然是關
  // 的。選單裡的連結點了會自己收，但瀏覽器上一頁、Ctrl+K 跳頁不會經過它們 ——
  // 用推導的就不需要另外寫一個 effect 去同步。
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const menuOpen = menuOpenAt === pathname;
  const setMenuOpen = (open: boolean) => setMenuOpenAt(open ? pathname : null);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpenAt(null);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <NavLink
              className="flex items-center gap-1 text-inherit no-underline font-bold"
              to="/"
            >
              <img
                alt=""
                className="w-8 h-8 object-contain"
                src="/CatMeow.png"
              />
              <span>{t(siteConfig.name, "UTaipei Course Helper")}</span>
            </NavLink>
            {/* Desktop nav: 首頁 plus one dropdown per group, so every route is
                reachable without the bar overflowing. */}
            <div className="hidden lg:flex items-center gap-4 ml-2">
              <NavItemLink item={siteConfig.homeItem} />
              {siteConfig.navGroups.map((group) => {
                const isActive = group.items.some(
                  (item) => item.href === pathname,
                );

                return (
                  <Dropdown key={group.label}>
                    {/* HeroUI's Button *is* the RAC menu trigger; a native
                        <button> here receives no trigger props and the menu
                        never opens. Wrapping it in Dropdown.Trigger would
                        instead nest a <button> inside a <button>. */}
                    <Button
                      className={clsx(
                        "gap-1 px-2 text-sm",
                        isActive && "font-medium text-accent",
                      )}
                      variant="ghost"
                    >
                      {t(group.label, group.labelEn)}
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    </Button>
                    <Dropdown.Popover>
                      <Dropdown.Menu aria-label={t(group.label, group.labelEn)}>
                        {group.items.map((item) => (
                          <Dropdown.Item
                            key={item.href}
                            href={item.href}
                            id={item.href}
                            textValue={t(item.label, item.labelEn)}
                          >
                            <Label>{t(item.label, item.labelEn)}</Label>
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                );
              })}
            </div>
          </div>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-2">
            <SearchButton showShortcut />
            <LanguageSwitch />
            <ThemeSwitch />
          </div>

          {/* Mobile / tablet right — must mirror the `lg` breakpoint used by the
              desktop links above, otherwise there is no navigation at all
              between the two. */}
          <div className="flex lg:hidden items-center gap-2">
            <SearchButton />
            <LanguageSwitch />
            <ThemeSwitch />
            <button
              aria-expanded={menuOpen}
              aria-label={
                menuOpen
                  ? t("關閉選單", "Close menu")
                  : t("開啟選單", "Open menu")
              }
              className="p-2 rounded-md text-foreground hover:bg-surface-secondary"
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — same grouping as desktop, rendered as sections. */}
      {menuOpen && (
        <div className="lg:hidden px-4 pb-4 flex flex-col gap-4">
          <NavItemLink
            className="py-1 text-base"
            item={siteConfig.homeItem}
            onNavigate={() => setMenuOpen(false)}
          />
          {siteConfig.navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-muted">
                {t(group.label, group.labelEn)}
              </p>
              {group.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  className="py-1 pl-3 text-base"
                  item={item}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};
