import { Link } from "@heroui/react";

import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { useWishlist } from "@/contexts/wishlist-context.tsx";
import { DISCLAIMER_OFFSET_VAR } from "@/components/disclaimer.tsx";

/**
 * 「已選 N 門課程」的常駐列。
 *
 * 這個計數本來放在 PageHeader 的操作區，也就是整頁最上面 —— 但勾選是發生在
 * 結果列表裡的，56 筆結果在手機上就有 25 個螢幕高。使用者在第 18 個螢幕勾課
 * 時，看不到任何回饋，也沒有辦法直接前往課表。
 *
 * 固定在底部而不是頂部：手機上拇指構得到，而且不跟 navbar 打架。
 */
export const SelectionBar = () => {
  const { selectedCourses } = useSelectedCourses();
  const { wishlist } = useWishlist();

  if (selectedCourses.length === 0 && wishlist.length === 0) return null;

  return (
    <>
      {/* 佔位用：列本身是 fixed，沒有這塊的話會蓋住列表最後一筆。跟著列一起
          出現／消失，所以沒選課時不會平白多出一段空白。 */}
      <div
        aria-hidden
        style={{ height: `calc(5rem + var(${DISCLAIMER_OFFSET_VAR}, 0px))` }}
      />
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-40 flex justify-center p-4"
        style={{
          // 免責橫幅還在的時候疊在它上面，而不是被它蓋住。
          bottom: `var(${DISCLAIMER_OFFSET_VAR}, 0px)`,
          // 避開 iPhone 底部的 home indicator。
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5 shadow-lg">
          <span className="text-sm font-medium">
            已選 {selectedCourses.length} 門課程
            {wishlist.length > 0 && `・收藏 ${wishlist.length} 門`}
          </span>
          <Link className="text-sm whitespace-nowrap" href="/my-schedule">
            前往我的課表 →
          </Link>
        </div>
      </div>
    </>
  );
};

export default SelectionBar;
