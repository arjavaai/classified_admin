import { getAuth } from 'firebase/auth';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  originalSize?: number;
  processedSize?: number;
  compressionRatio?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Upload image using server-side processing API
 * Handles WebP conversion, watermarking, and Firebase upload on the server
 */
export async function uploadImageToServer(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    console.log('Starting upload for file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      userId: userId
    });

    // Get Firebase auth token
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();

    // Create FormData with a sanitized filename
    const formData = new FormData();
    
    // Create a new File object with a sanitized name to avoid path issues
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 100); // Limit filename length
    
    console.log('Sanitized filename:', sanitizedName, 'from original:', file.name);
    
    const sanitizedFile = new File([file], sanitizedName, { type: file.type });
    
    formData.append('image', sanitizedFile);
    formData.append('userId', userId);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded * 100) / e.total);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        try {
          console.log('Upload response status:', xhr.status);
          console.log('Upload response text:', xhr.responseText);
          
          const response = JSON.parse(xhr.responseText);
          
          if (xhr.status === 200 && response.success && response.url) {
            // Trust server response when upload is successful
            // Server-side upload to Firebase Storage was confirmed successful
            console.log('Image upload successful, URL:', response.url);
            
            resolve({
              success: true,
              url: response.url,
              fileName: response.fileName,
              originalSize: response.originalSize,
              processedSize: response.processedSize,
              compressionRatio: response.compressionRatio,
              dimensions: response.dimensions
            });
          } else {
            console.error('Upload failed:', response);
            resolve({
              success: false,
              error: response.error || response.details || `Upload failed (${xhr.status})`
            });
          }
        } catch (parseError) {
          console.error('Failed to parse upload response:', parseError);
          console.error('Raw response:', xhr.responseText);
          resolve({
            success: false,
            error: 'Invalid server response'
          });
        }
      });

      xhr.addEventListener('error', (event) => {
        console.error('Network error during upload:', event);
        resolve({
          success: false,
          error: 'Network error during upload. Please check your connection and try again.'
        });
      });

      xhr.addEventListener('timeout', () => {
        console.error('Upload timeout after 90 seconds');
        resolve({
          success: false,
          error: 'Upload timeout - the file may be too large or your connection is slow. Please try again.'
        });
      });

      xhr.open('POST', '/api/upload-image');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 90000; // 90 second timeout for processing
      xhr.send(formData);
    });

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  // Check if file exists and has basic properties
  if (!file || !file.name || !file.type) {
    return {
      valid: false,
      error: 'Invalid file. Please select a valid image file.'
    };
  }

  // Normalize file type (some browsers may report different MIME types)
  let fileType = file.type.toLowerCase();
  
  // Handle cases where MIME type might be missing or incorrect
  if (!fileType && file.name) {
    const extension = file.name.toLowerCase().split('.').pop();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        fileType = 'image/jpeg';
        break;
      case 'png':
        fileType = 'image/png';
        break;
      case 'webp':
        fileType = 'image/webp';
        break;
      case 'heic':
        fileType = 'image/heic';
        break;
      case 'heif':
        fileType = 'image/heif';
        break;
      default:
        return {
          valid: false,
          error: 'Unsupported file extension. Please use JPEG, PNG, WebP, or HEIC images.'
        };
    }
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and HEIC files are allowed.'
    };
  }

  if (file.size > MAX_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size too large (${sizeMB}MB). Maximum size is 10MB.`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File appears to be empty. Please select a valid image file.'
    };
  }

  return { valid: true };
}

/**
 * Check if device supports camera capture
 */
export function supportsCameraCapture(): boolean {
  return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
}

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Enhanced file input trigger with mobile camera support
 */
export function triggerImageCapture(
  inputRef: React.RefObject<HTMLInputElement | null>,
  preferCamera: boolean = false
): void {
  if (inputRef.current) {
    // Set capture attribute for mobile camera
    if (preferCamera && isMobileDevice()) {
      inputRef.current.setAttribute('capture', 'environment');
    } else {
      inputRef.current.removeAttribute('capture');
    }
    inputRef.current.click();
  }
}