// Helper function to convert HTML element to canvas
const htmlToCanvas = async (
  element: HTMLElement,
): Promise<HTMLCanvasElement> => {
  // Import html2canvas dynamically to avoid SSR issues
  const html2canvas = await import("html2canvas").then(
    (module) => module.default,
  );

  // Wait for any pending layout changes
  await new Promise((resolve) => setTimeout(resolve, 100));

  return html2canvas(element, {
    backgroundColor: "#ffffff", // White background for better compatibility
    scale: 2, // Higher scale for better quality
    useCORS: true,
    allowTaint: false,
    scrollX: 0,
    scrollY: 0,
    height: element.scrollHeight,
    width: element.scrollWidth,
    logging: false, // Disable logging for production
    foreignObjectRendering: true, // Better CSS handling
    ignoreElements: (element) => {
      // Ignore certain problematic elements
      return (
        element.classList.contains("ignore-capture") ||
        element.tagName === "SCRIPT" ||
        element.tagName === "STYLE" ||
        element.classList.contains("tooltip") ||
        element.classList.contains("dropdown") ||
        element.getAttribute("role") === "tooltip" ||
        element.hasAttribute("data-tooltip")
      );
    },
    onclone: (clonedDoc) => {
      // Ensure all CSS is properly loaded in the cloned document
      const clonedElement =
        clonedDoc.getElementById("weekly-schedule-grid") ||
        clonedDoc.querySelector('[style*="grid-template-columns"]');

      if (clonedElement && clonedElement instanceof HTMLElement) {
        // Force grid layout styles to be visible
        clonedElement.style.display = "grid";
        clonedElement.style.gap = "0";
        clonedElement.style.border = "1px solid #d1d5db";
        clonedElement.style.borderRadius = "8px";
        clonedElement.style.overflow = "hidden";
        clonedElement.style.backgroundColor = "#ffffff";

        // Ensure all child elements are visible
        const allChildren = clonedElement.querySelectorAll("*");

        allChildren.forEach((child) => {
          if (child instanceof HTMLElement) {
            child.style.visibility = "visible";
            child.style.opacity = "1";

            // Ensure borders are visible
            if (child.classList.contains("border")) {
              child.style.borderColor = "#d1d5db";
              child.style.borderWidth = "1px";
            }

            // Force background colors for course cards
            if (child.className.includes("bg-")) {
              const bgClasses = child.className.match(/bg-[\w-]+/g);

              if (bgClasses && bgClasses.length > 0) {
                // Ensure the background is visible
                child.style.opacity = "1";
                child.style.visibility = "visible";
              }
            }
          }
        });

        // Force re-render by triggering a style change
        clonedElement.style.transform = "translateZ(0)";
      }
    },
  });
};

// Download schedule as image
export const downloadScheduleImage = async (
  scheduleTitle: string = "課程表",
): Promise<void> => {
  try {
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
    const canvas = await htmlToCanvas(scheduleGrid);

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png", 0.9);
    });

    if (!blob) {
      throw new Error("Failed to generate image blob");
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${scheduleTitle.replace(/[^\w\s-]/g, "")}.png`;
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

  // Set canvas size
  canvas.width = 800;
  canvas.height = 600;

  // Fill background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add title
  ctx.fillStyle = "#000000";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(scheduleTitle, canvas.width / 2, 40);

  // Add note
  ctx.font = "16px sans-serif";
  ctx.fillText("請使用瀏覽器截圖功能保存完整課表", canvas.width / 2, 80);
  ctx.fillText("或直接截圖此頁面內容", canvas.width / 2, 110);

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
  link.download = `${scheduleTitle.replace(/[^\w\s-]/g, "")}-notice.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
