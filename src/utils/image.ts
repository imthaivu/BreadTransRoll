/**
 * Compress and resize image to reduce storage size
 * @param file - Original image file
 * @param maxWidth - Maximum width (default: 400)
 * @param maxHeight - Maximum height (default: 400)
 * @param quality - JPEG quality 0-1 (default: 0.85)
 * @returns Compressed File object
 */
export async function compressAndResizeImage(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("File phải là ảnh"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          // Create canvas
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Không thể tạo canvas context"));
            return;
          }

          // Draw image on canvas (this removes metadata)
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Không thể nén ảnh"));
                return;
              }

              // Create new File object with original name but compressed data
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: "image/jpeg", // Always use JPEG for better compression
                  lastModified: Date.now(),
                }
              );

              resolve(compressedFile);
            },
            "image/jpeg", // Always convert to JPEG for better compression
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Không thể load ảnh"));
      };

      // Load image from file data
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      reject(new Error("Không thể đọc file"));
    };

    // Read file as data URL
    reader.readAsDataURL(file);
  });
}

