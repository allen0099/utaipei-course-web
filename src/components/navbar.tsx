import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button, Dropdown, Label } from "@heroui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { NavItem, siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { WipBadge } from "@/components/wip-badge.tsx";

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
}) => (
  <NavLink
    // `end` matters for "/" — without it NavLink treats the root as a prefix
    // match and 首頁 stays highlighted on every route.
    className={(state) => clsx(linkClass(state), className)}
    end={item.href === "/"}
    to={item.href}
    onClick={onNavigate}
  >
    {item.label}
    {item.wip && <WipBadge />}
  </NavLink>
);

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

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
              <span>{siteConfig.name}</span>
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
                      {group.label}
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    </Button>
                    <Dropdown.Popover>
                      <Dropdown.Menu aria-label={group.label}>
                        {group.items.map((item) => (
                          <Dropdown.Item
                            key={item.href}
                            href={item.href}
                            id={item.href}
                            textValue={item.label}
                          >
                            <Label>{item.label}</Label>
                            {item.wip && <WipBadge />}
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
            <ThemeSwitch />
          </div>

          {/* Mobile / tablet right — must mirror the `lg` breakpoint used by the
              desktop links above, otherwise there is no navigation at all
              between the two. */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeSwitch />
            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "關閉選單" : "開啟選單"}
              className="p-2 rounded-md text-foreground hover:bg-surface-secondary"
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
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
                {group.label}
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
