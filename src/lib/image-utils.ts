import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Maximum file size in bytes (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Validates if the image file is within the size limit
 * @param file The image file to validate
 * @returns An object with validation result and error message if any
 */
export const validateImageSize = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Image size exceeds 2MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    };
  }
  return { valid: true };
};

/**
 * Adds a watermark to an image and processes it
 * @param imageFile The original image file
 * @param watermarkPath Path to the watermark image
 * @returns A Promise that resolves to the processed image as a Blob
 */
export const processImage = async (
  imageFile: File,
  watermarkPath: string = '/assets/skluva_logo.png'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Create image elements for the main image and watermark
    const mainImage = new Image();
    const watermark = new Image();
    
    // Create a FileReader to read the image file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read image file'));
        return;
      }
      
      // Set the source of the main image
      mainImage.src = e.target.result as string;
      
      mainImage.onload = () => {
        // Load the watermark image
        watermark.src = watermarkPath;
        
        watermark.onload = () => {
          // Create a canvas to draw the images
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Set canvas dimensions to match the main image
          canvas.width = mainImage.width;
          canvas.height = mainImage.height;
          
          // Draw the main image
          ctx.drawImage(mainImage, 0, 0);
          
          // Calculate watermark dimensions (25% of the image width)
          const watermarkWidth = canvas.width * 0.25;
          const watermarkHeight = (watermark.height / watermark.width) * watermarkWidth;
          
          // Create a temporary canvas for the watermark
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          
          if (!tempCtx) {
            reject(new Error('Failed to get temporary canvas context'));
            return;
          }
          
          // Set dimensions for the temporary canvas
          tempCanvas.width = watermarkWidth;
          tempCanvas.height = watermarkHeight;
          
          // Draw the watermark on the temporary canvas
          tempCtx.drawImage(watermark, 0, 0, watermarkWidth, watermarkHeight);
          
          // Get the image data
          const imageData = tempCtx.getImageData(0, 0, watermarkWidth, watermarkHeight);
          const data = imageData.data;
          
          // Convert the watermark to white
          for (let i = 0; i < data.length; i += 4) {
            // If the pixel is not fully transparent
            if (data[i + 3] > 0) {
              // Set to white (255, 255, 255) but keep the original alpha
              data[i] = 255;     // Red
              data[i + 1] = 255; // Green
              data[i + 2] = 255; // Blue
            }
          }
          
          // Put the modified image data back
          tempCtx.putImageData(imageData, 0, 0);
          
          // Set watermark opacity (lower value for more transparency)
          ctx.globalAlpha = 0.2;
          
          // Draw the watermark in the bottom right corner with some padding
          const padding = canvas.width * 0.03; // 3% of the image width as padding
          ctx.drawImage(
            tempCanvas,
            canvas.width - watermarkWidth - padding,
            canvas.height - watermarkHeight - padding,
            watermarkWidth,
            watermarkHeight
          );
          
          // Reset global alpha
          ctx.globalAlpha = 1.0;
          
          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert canvas to blob'));
                return;
              }
              resolve(blob);
            },
            'image/jpeg',
            0.9 // Quality
          );
        };
        
        watermark.onerror = () => {
          reject(new Error('Failed to load watermark image'));
        };
      };
      
      mainImage.onerror = () => {
        reject(new Error('Failed to load main image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Uploads a processed image to Firebase Storage
 * @param userId The ID of the user uploading the image
 * @param imageBlob The processed image blob
 * @param fileName Original file name for reference
 * @param onProgress Callback for upload progress
 * @returns A Promise that resolves to the download URL
 */
export const uploadImageToFirebase = (
  userId: string,
  imageBlob: Blob,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storage = getStorage();
    
    // Create a unique file name
    const timestamp = new Date().getTime();
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${userId}_${timestamp}.${fileExtension}`;
    
    // Create a storage reference
    const storageRef = ref(storage, `ads/${userId}/${uniqueFileName}`);
    
    // Start the upload
    const uploadTask = uploadBytesResumable(storageRef, imageBlob);
    
    // Monitor the upload progress
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        // Upload completed successfully, get the download URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}; 