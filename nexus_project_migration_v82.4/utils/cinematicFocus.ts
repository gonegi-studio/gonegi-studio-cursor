/**
 * Applies a cinematic focus effect (vignette) to a base64 encoded image.
 * This darkens the corners of the image to draw focus to the center.
 *
 * @param base64Str The base64 string of the image.
 * @param options An object with options for the effect.
 * @param options.strength The strength of the vignette effect (0 to 1).
 * @returns A promise that resolves with the base64 string of the processed image.
 */
export function applyFocusCinematic(
  base64Str: string,
  options: { strength: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Create vignette effect
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height / 3, // Inner circle
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5  // Outer circle
      );

      const strength = Math.max(0, Math.min(1, options.strength || 0.5));
      
      gradient.addColorStop(0, `rgba(0,0,0,0)`);
      gradient.addColorStop(1, `rgba(0,0,0,${strength})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mimeType = base64Str.substring(5, base64Str.indexOf(';'));
      resolve(canvas.toDataURL(mimeType, 1.0));
    };
    img.onerror = (error) => {
      reject(new Error(`Could not load image for cinematic focus: ${error}`));
    };
    img.src = base64Str;
  });
}
