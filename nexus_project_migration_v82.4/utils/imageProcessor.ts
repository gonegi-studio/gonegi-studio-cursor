/**
 * Resizes a base64 encoded image to exactly cover a target resolution (16:9).
 * Includes a Physical Border Stripper (7% Aggressive Safe Crop) to remove potential black bars.
 */
export function forceResizeToHD(base64Str: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas Context Error'));

      const targetRatio = width / height;
      const sourceRatio = img.width / img.height;

      let sx, sy, sWidth, sHeight;

      if (sourceRatio > targetRatio) {
        // 원본이 타겟(16:9)보다 더 넓음: 좌우를 자름
        sHeight = img.height;
        sWidth = sHeight * targetRatio;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        // 원본이 타겟(16:9)보다 더 좁음: 위아래를 자름
        sWidth = img.width;
        sHeight = sWidth / targetRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }
      
      // --- PHYSICAL BORDER STRIPPER (7% Aggressive Safe Crop) ---
      // AI 생성 이미지의 가장자리에 생길 수 있는 불완전한 픽셀이나 검은 선을 제거하기 위해 7% 안쪽으로 크롭합니다.
      const marginFactor = 0.07; 
      const cropW = sWidth * marginFactor;
      const cropH = sHeight * marginFactor;
      
      ctx.drawImage(
        img, 
        sx + cropW, 
        sy + cropH, 
        sWidth - (cropW * 2), 
        sHeight - (cropH * 2), 
        0, 0, width, height
      );
      
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = (error) => reject(new Error(`Image Processing Failed: ${error}`));
    img.src = base64Str;
  });
}

/**
 * Creates a high-quality thumbnail for "Elite Member" reference sheets.
 * Target: 1024px wide, JPEG format.
 */
export function createEliteThumbnail(base64Str: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const targetWidth = 1024;
      const targetHeight = Math.round(targetWidth * (img.height / img.width));
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Context Error'));

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = base64Str;
  });
}

/**
 * Optimizes images for the Character Book to prevent memory bloat.
 * Resizes large images to a maximum dimension of 1920px.
 */
export function optimizeForCharacterBook(base64Str: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1920;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Context Error'));

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = base64Str;
  });
}

/**
 * Alternative resizing with blur background (Artwall style)
 */
export function resizeImageWithArtwall(base64Str: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Context Error'));

      ctx.filter = 'blur(20px) brightness(0.6)';
      ctx.drawImage(img, 0, 0, width, height);
      ctx.filter = 'none';

      const ratio = Math.min(width / img.width, height / img.height);
      const nw = img.width * ratio;
      const nh = img.height * ratio;
      ctx.drawImage(img, (width - nw) / 2, (height - nh) / 2, nw, nh);
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = base64Str;
  });
}
