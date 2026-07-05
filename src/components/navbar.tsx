import { useState } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <a
              className="flex items-center gap-1 text-inherit no-underline font-bold"
              href="/"
            >
              <img
                alt=""
                className="w-8 h-8 object-contain"
                src="/CatMeow.png"
              />
              <span>{siteConfig.name}</span>
            </a>
            {/* Desktop nav links */}
            <div className="hidden lg:flex gap-4 ml-2">
              {siteConfig.navItems.map((item) => (
                <a
                  key={item.href}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors"
                  href={item.href}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Desktop right */}
          <div className="hidden sm:flex items-center gap-2">
            <ThemeSwitch />
          </div>

          {/* Mobile right */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeSwitch />
            <button
              aria-label="Toggle menu"
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <svg
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-4 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item) => (
            <a
              key={item.href}
              className="text-base py-1 text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors"
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};
