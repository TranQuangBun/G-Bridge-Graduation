import FormData from "form-data";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "608d854aebb411657d9684305ae89fa6";
const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

export async function uploadMulterFileToImgbb(file, namePrefix = null, expiration = null) {
  if (!file) {
    throw new Error("No file provided");
  }

  if (!IMGBB_API_KEY) {
    throw new Error("IMGBB_API_KEY is not configured. Please set it in your .env file.");
  }

  try {
    const formData = new FormData();
    
    // Read file as stream for better memory efficiency
    const fileStream = fs.createReadStream(file.path);
    
    // Upload file directly as binary (more efficient than base64)
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", fileStream);
    
    // Optional parameters
    // Generate a name with prefix if provided
    if (namePrefix) {
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e9);
      const originalName = file.originalname || "image";
      const ext = originalName.split(".").pop() || "jpg";
      const name = `${namePrefix}-${timestamp}-${randomSuffix}.${ext}`;
      formData.append("name", name);
    }
    if (expiration) {
      formData.append("expiration", expiration.toString());
    }

    const response = await fetch(IMGBB_API_URL, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || data.error?.code || "Failed to upload image to imgbb");
    }

    // Delete local file after successful upload
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      // Ignore delete errors
    }

    return {
      url: data.data.url,
      deleteUrl: data.data.delete_url,
      thumbUrl: data.data.thumb?.url || data.data.url,
      mediumUrl: data.data.medium?.url || data.data.url,
      imageId: data.data.id,
      displayUrl: data.data.display_url || data.data.url,
    };
  } catch (error) {
    // Clean up local file on error
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      // Ignore delete errors
    }
    throw new Error(`Imgbb upload error: ${error.message}`);
  }
}

/**
 * Upload image from base64 string to imgbb
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} name - Optional custom name for the image
 * @param {number} expiration - Optional expiration time in seconds
 * @returns {Promise<{url: string, deleteUrl: string, thumbUrl: string, mediumUrl: string, imageId: string}>}
 */
export async function uploadBase64ToImgbb(base64Image, name = null, expiration = null) {
  if (!base64Image) {
    throw new Error("No base64 image provided");
  }

  if (!IMGBB_API_KEY) {
    throw new Error("IMGBB_API_KEY is not configured. Please set it in your .env file.");
  }

  try {
    const formData = new FormData();
    
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Data = base64Image.includes(",") 
      ? base64Image.split(",")[1] 
      : base64Image;
    
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", base64Data);
    
    if (name) {
      formData.append("name", name);
    }
    if (expiration) {
      formData.append("expiration", expiration.toString());
    }

    const response = await fetch(IMGBB_API_URL, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || data.error?.code || "Failed to upload image to imgbb");
    }

    return {
      url: data.data.url,
      deleteUrl: data.data.delete_url,
      thumbUrl: data.data.thumb?.url || data.data.url,
      mediumUrl: data.data.medium?.url || data.data.url,
      imageId: data.data.id,
      displayUrl: data.data.display_url || data.data.url,
    };
  } catch (error) {
    throw new Error(`Imgbb upload error: ${error.message}`);
  }
}

