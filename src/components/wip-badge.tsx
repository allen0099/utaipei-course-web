/**
 * Small "under construction" marker for navigation entries and cards that
 * point at a feature which isn't implemented yet — so an empty page reads as
 * "not built" rather than "broken".
 */
export const WipBadge = ({ className }: { className?: string }) => (
  <span
    className={`shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning ${className ?? ""}`}
  >
    開發中
  </span>
);

export default WipBadge;
