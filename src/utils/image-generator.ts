import { toBlob } from "html-to-image";

const WARM_BACKGROUND_COLOR = "#fef7ed"; // Warm orange-50 background
const PADDING = 40; // 40px padding on all sides

const htmlToCanvas = async (element: HTMLElement): Promise<Blob | null> => {
  // Wait for any pending layout changes
  await new Promise((resolve) => setTimeout(resolve, 100));

  return toBlob(element, {
    backgroundColor: WARM_BACKGROUND_COLOR, // Warm background color
    height: element.scrollHeight + PADDING * 2, // Add padding to height
    width: element.scrollWidth + PADDING * 2, // Add padding to width
    style: {
      // Add padding to the element
      padding: `${PADDING}px`,
      margin: "0",
    },
  });
};

// Generate schedule image blob for preview or download
export const generateScheduleImageBlob = async (
  _scheduleTitle: string = "課程表",
): Promise<Blob> => {
  // Try multiple selectors to find the schedule grid
  let scheduleGrid = document.getElementById(
    "weekly-schedule-grid",
  ) as HTMLElement;

  if (!scheduleGrid) {
    // Fallback: look for the grid container
    scheduleGrid = document.querySelector(
      '[style*="grid-template-columns"]',
    ) as HTMLElement;
  }

  if (!scheduleGrid) {
    // Another fallback: look for the schedule container within CardBody
    const cardBody = document.querySelector('[data-component="CardBody"]');

    if (cardBody) {
      scheduleGrid = cardBody.querySelector(
        'div[style*="grid-template-columns"]',
      ) as HTMLElement;
    }
  }

  if (!scheduleGrid) {
    // Final fallback: look for any grid container
    scheduleGrid = document.querySelector(
      '.grid, [class*="grid"]',
    ) as HTMLElement;
  }

  if (!scheduleGrid) {
    throw new Error("Schedule grid not found");
  }

  // Convert to canvas
  const blob = await htmlToCanvas(scheduleGrid);

  if (!blob) {
    throw new Error("Failed to generate image blob");
  }

  return blob;
};

// Download schedule as image (existing function, now uses generateScheduleImageBlob)
export const downloadScheduleImage = async (
  scheduleTitle: string = "課程表",
): Promise<void> => {
  try {
    const blob = await generateScheduleImageBlob(scheduleTitle);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${scheduleTitle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to generate schedule image:", error);

    // Fallback: Create a simple table representation
    try {
      await createFallbackImage(scheduleTitle);
    } catch (fallbackError) {
      // eslint-disable-next-line no-console
      console.error("Fallback image generation also failed:", fallbackError);
      alert("生成課表圖片失敗，請稍後再試。建議截圖保存課表。");
    }
  }
};

// Fallback method using canvas API
const createFallbackImage = async (scheduleTitle: string): Promise<void> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  // Set canvas size with padding
  canvas.width = 800 + PADDING * 2;
  canvas.height = 600 + PADDING * 2;

  // Fill background with warm color
  ctx.fillStyle = WARM_BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add title with padding offset
  ctx.fillStyle = "#000000";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(scheduleTitle, canvas.width / 2, 40 + PADDING);

  // Add note with padding offset
  ctx.font = "16px sans-serif";
  ctx.fillText(
    "請使用瀏覽器截圖功能保存完整課表",
    canvas.width / 2,
    80 + PADDING,
  );
  ctx.fillText("或直接截圖此頁面內容", canvas.width / 2, 110 + PADDING);

  // Convert to blob and download
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png", 0.9);
  });

  if (!blob) {
    throw new Error("Failed to generate fallback image blob");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${scheduleTitle}-notice.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
