import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PartialCourse } from "@/interfaces/globals.ts";
import { getCourseKey, SelectedCourseMap } from "@/utils/course-key.ts";
import { useYms } from "@/hooks/useYms.ts";

const STORAGE_KEY = "my-wishlist-courses";
const YMS_STORAGE_KEY = "my-wishlist-yms";

const loadMap = (): SelectedCourseMap => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");

    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed as SelectedCourseMap).filter(
        ([, course]) => course?.code,
      ),
    );
  } catch {
    return {};
  }
};

const loadYms = (): string | null => {
  try {
    return localStorage.getItem(YMS_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

interface WishlistContextValue {
  wishlist: PartialCourse[];
  /** 收藏清單所屬的學年期；清單是空的就是 null。 */
  wishlistYms: string | null;
  isWished: (course: { code: string }) => boolean;
  /** 學年期對不上時回傳 false，什麼都不做。 */
  toggleWish: (course: PartialCourse, yms: string) => boolean;
  removeWish: (course: { code: string }) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * 收藏清單：「先存起來、還沒決定要不要修」的課。
 *
 * 跟我的課表是兩層而不是同一層的兩種狀態 —— 課表回答「我這學期要上什麼」，
 * 衝堂、學分、匯出、分享全都以它為準；收藏只是候選名單，進不進課表都不影響
 * 那些數字。所以它有自己的 context 與 localStorage key，課表那一份「只有一個
 * 學年期」的不變式完全不用動。
 *
 * 收藏清單自己也遵守同一條規則（只收目前學年期的課、整份清單一個學年期），
 * 理由一樣：上學期收藏的課代碼到了這學期指的是另一門課。scheduleYms 那套
 * 「由內容推導、清空即歸零」的做法也照搬，兩個值才不會各走各的。
 */
export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [map, setMap] = useState<SelectedCourseMap>(loadMap);
  const [storedYms, setStoredYms] = useState<string | null>(loadYms);

  const wishlistYms = Object.keys(map).length === 0 ? null : storedYms;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // 存不了就只在這次造訪生效。
    }
  }, [map]);

  useEffect(() => {
    try {
      if (wishlistYms) {
        localStorage.setItem(YMS_STORAGE_KEY, wishlistYms);
      } else {
        localStorage.removeItem(YMS_STORAGE_KEY);
      }
    } catch {
      // 同上。
    }
  }, [wishlistYms]);

  const isWished = useCallback(
    (course: { code: string }) =>
      Object.prototype.hasOwnProperty.call(map, getCourseKey(course)),
    [map],
  );

  const removeWish = useCallback((course: { code: string }) => {
    const key = getCourseKey(course);

    setMap((prev) => {
      if (!(key in prev)) return prev;

      const next = { ...prev };

      delete next[key];

      return next;
    });
  }, []);

  const toggleWish = useCallback(
    (course: PartialCourse, yms: string) => {
      if (isWished(course)) {
        removeWish(course);

        return true;
      }

      if (!yms || (wishlistYms !== null && wishlistYms !== yms)) return false;

      setStoredYms(yms);
      setMap((prev) => ({ ...prev, [getCourseKey(course)]: course }));

      return true;
    },
    [isWished, removeWish, wishlistYms],
  );

  const clearWishlist = useCallback(() => {
    setMap({});
    setStoredYms(null);
  }, []);

  const wishlist = useMemo(() => Object.values(map), [map]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      wishlist,
      wishlistYms,
      isWished,
      toggleWish,
      removeWish,
      clearWishlist,
    }),
    [wishlist, wishlistYms, isWished, toggleWish, removeWish, clearWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextValue => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }

  return context;
};

/**
 * 這個學年期的課現在能不能收藏。與 useCourseAddGate 同一套 fail-closed：
 * 不知道目前學年期是哪一個（defaultCode === null）就是不能收。
 */
export const useWishGate = (yms: string): boolean => {
  const { wishlistYms } = useWishlist();
  const { defaultCode, loading } = useYms();

  return (
    !loading &&
    defaultCode !== null &&
    yms === defaultCode &&
    (wishlistYms === null || wishlistYms === yms)
  );
};
