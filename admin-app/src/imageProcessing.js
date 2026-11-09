const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function canvasToWebP(canvas, quality = 0.88) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('The browser could not encode this image.'));
      resolve(blob);
    }, 'image/webp', quality);
  });
}

export async function processImageFile(originalFile, options = {}) {
  if (!SUPPORTED_IMAGE_TYPES.has(originalFile?.type)) {
    throw new Error('Choose a JPG, PNG or WebP image.');
  }
  if (originalFile.size > 10 * 1024 * 1024) {
    throw new Error('Each image must be 10 MB or smaller.');
  }

  const width = Math.max(1, Math.round(options.width || 1200));
  const height = Math.max(1, Math.round(options.height || 1600));
  const background = options.background || '#f6f1ed';
  let bitmap;

  try {
    bitmap = await createImageBitmap(originalFile, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This image could not be opened. Try exporting it as JPG, PNG or WebP.');
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Image processing is not supported by this browser.');

    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    // Contain: preserve the entire original image and its aspect ratio.
    const scale = Math.min(width / bitmap.width, height / bitmap.height);
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    context.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);

    const blob = await canvasToWebP(canvas, options.quality ?? 0.88);
    const baseName = originalFile.name.replace(/\.[^.]+$/, '') || 'zariah-image';
    const processedFile = new File([blob], baseName + '.webp', {
      type: 'image/webp',
      lastModified: Date.now()
    });

    return {
      originalFile,
      processedFile,
      width,
      height,
      originalWidth: bitmap.width,
      originalHeight: bitmap.height,
      sizeBefore: originalFile.size,
      sizeAfter: processedFile.size
    };
  } finally {
    bitmap.close?.();
  }
}
