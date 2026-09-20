const WARM_BACKGROUND_COLOR = "#fef7ed"; // Warm orange-50 background
const DARK_BACKGROUND_COLOR = "#1c1917"; // stone-900, matches the dark UI
const PADDING = 40; // 40px padding on all sides

// The grid is captured as it currently renders, so it carries whatever `dark:`
// classes are active. Picking the background from the same signal keeps the
// export from pairing dark cells with a cream page (and vice versa).
const isDarkMode = () => document.documentElement.classList.contains("dark");

// Wait for the browser to complete a full layout/paint cycle before measuring.
// A single rAF can still fire before layout has settled, so we wait for two.
const waitForLayout = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

/**
 * Render a schedule grid to a PNG blob.
 *
 * Takes the element itself. It used to look the grid up by a hard-coded id and,
 * failing that, fall through three increasingly vague selectors ending in "any
 * element whose class contains `grid`" — so a page with two schedules exported
 * whichever came first, and a markup change would have silently exported some
 * unrelated part of the page. The caller owns a ref to the exact node.
 *
 * Throws on failure. The previous fallback downloaded a PNG that only said
 * "please take a screenshot instead" and, if even that failed, called
 * `alert()`; the component now reports the failure inline instead.
 */
export const generateScheduleImageBlob = async (
  element: HTMLElement,
): Promise<Blob> => {
  // Lazily load html-to-image so it's only pulled into a chunk when a
  // schedule image is actually requested, not bundled into the main chunk.
  const { toBlob } = await import("html-to-image");

  await waitForLayout();

  const blob = await toBlob(element, {
    backgroundColor: isDarkMode()
      ? DARK_BACKGROUND_COLOR
      : WARM_BACKGROUND_COLOR,
    height: element.scrollHeight + PADDING * 2,
    width: element.scrollWidth + PADDING * 2,
    style: {
      padding: `${PADDING}px`,
      margin: "0",
    },
  });

  if (!blob) {
    throw new Error("Failed to generate image blob");
  }

  return blob;
};
