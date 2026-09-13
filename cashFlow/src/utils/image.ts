/**
 * Compresses and resizes an image file in the browser before upload.
 * Prevents Vercel 4.5MB payload limit errors (HTTP 413) and accelerates AI analysis.
 */
export async function compressReceiptImage(file: File, maxDimension = 1600, quality = 0.85): Promise<File> {
  // If file is not an image or is SVG, return original
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      // Only resize if larger than maxDimension or larger than 1.5MB
      if (width <= maxDimension && height <= maxDimension && file.size < 1.5 * 1024 * 1024) {
        resolve(file);
        return;
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const safeName = file.name ? file.name.replace(/\.[^/.]+$/, '.jpg') : 'receipt.jpg';
          const compressedFile = new File([blob], safeName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original file
    };

    img.src = objectUrl;
  });
}
