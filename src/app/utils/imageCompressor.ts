/**
 * Compresses an image file using HTML5 Canvas.
 * * @param {File} file - The original image file from the input.
 * @param {number} quality - (0.0 to 1.0) The output quality. Default 0.7.
 * @param {number} maxWidth - Max width in pixels. Default 1024px.
 * @returns {Promise<Blob>} - Resolves with the compressed Blob.
 */
export const compressImage = async (file: File, quality = 0.7, maxWidth = 1024) => {
    return new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                // 1. Calculate new dimensions (maintain aspect ratio)
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // 2. Create an invisible canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                // 3. Draw the image onto the canvas
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // 4. Export as compressed JPEG Blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            console.log(`Compressed: ${(blob.size / 1024).toFixed(2)} KB`); // Debug log
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg', // Always convert to JPEG for size
                    quality
                );
            };

            img.onerror = (err) => reject(err);
        };

        reader.onerror = (err) => reject(err);
    });
};