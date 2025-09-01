// Helper function to convert HTML element to canvas
const htmlToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  // Import html2canvas dynamically to avoid SSR issues
  const html2canvas = await import('html2canvas').then(module => module.default);
  
  return html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 1, // Reduced scale to avoid memory issues
    useCORS: true,
    allowTaint: false,
    scrollX: 0,
    scrollY: 0,
    height: element.scrollHeight,
    width: element.scrollWidth,
    ignoreElements: (element) => {
      // Ignore certain problematic elements
      return element.classList.contains('ignore-capture') || 
             element.tagName === 'SCRIPT' ||
             element.tagName === 'STYLE';
    },
  });
};

// Download schedule as image
export const downloadScheduleImage = async (
  scheduleTitle: string = "課程表"
): Promise<void> => {
  try {
    // Find the schedule grid specifically
    const scheduleGrid = document.querySelector('[style*="grid-template-columns"]') as HTMLElement;
    if (!scheduleGrid) {
      throw new Error('Schedule grid not found');
    }

    // Convert to canvas
    const canvas = await htmlToCanvas(scheduleGrid);
    
    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 0.9);
    });

    if (!blob) {
      throw new Error('Failed to generate image blob');
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scheduleTitle.replace(/[^\w\s-]/g, "")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate schedule image:', error);
    
    // Fallback: Create a simple table representation
    try {
      await createFallbackImage(scheduleTitle);
    } catch (fallbackError) {
      console.error('Fallback image generation also failed:', fallbackError);
      alert('生成課表圖片失敗，請稍後再試。建議截圖保存課表。');
    }
  }
};

// Fallback method using canvas API
const createFallbackImage = async (scheduleTitle: string): Promise<void> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Set canvas size
  canvas.width = 800;
  canvas.height = 600;
  
  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(scheduleTitle, canvas.width / 2, 40);
  
  // Add note
  ctx.font = '16px sans-serif';
  ctx.fillText('請使用瀏覽器截圖功能保存完整課表', canvas.width / 2, 80);
  ctx.fillText('或直接截圖此頁面內容', canvas.width / 2, 110);
  
  // Convert to blob and download
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png', 0.9);
  });

  if (!blob) {
    throw new Error('Failed to generate fallback image blob');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${scheduleTitle.replace(/[^\w\s-]/g, "")}-notice.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};