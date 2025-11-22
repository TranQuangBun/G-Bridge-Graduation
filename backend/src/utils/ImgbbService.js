import FormData from "form-data";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { convertPdfFirstPageToImageBuffer } from "./PdfToImageConverter.js";

dotenv.config();

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "608d854aebb411657d9684305ae89fa6";
console.log("ImgBB API Key loaded:", IMGBB_API_KEY ? IMGBB_API_KEY.substring(0, 10) + "..." : "NOT SET");
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
    
    // Check if file is PDF
    const isPdf = file.mimetype === "application/pdf" || 
                 file.originalname?.toLowerCase().endsWith(".pdf");
    
    let tempImagePath = null;
    let format = "jpeg";
    
    if (isPdf) {
      // Convert PDF to image (first page) then upload as image
      try {
        const conversionResult = await convertPdfFirstPageToImageBuffer(file.path);
        format = conversionResult.format;
        
        // Create a temporary file-like object for the image
        const imageExt = format === "png" ? ".png" : ".jpg";
        tempImagePath = file.path.replace(path.extname(file.path), imageExt);
        fs.writeFileSync(tempImagePath, conversionResult.imageBuffer);
        
        // Upload image as stream
        const imageStream = fs.createReadStream(tempImagePath);
        formData.append("key", IMGBB_API_KEY);
        formData.append("image", imageStream);
      } catch (convertError) {
        // If conversion fails, try uploading PDF as base64 (fallback)
        console.warn("PDF to image conversion failed, trying base64 upload:", convertError.message);
        const fileBuffer = fs.readFileSync(file.path);
        const base64File = fileBuffer.toString("base64");
        formData.append("key", IMGBB_API_KEY);
        formData.append("image", base64File);
      }
    } else {
      // For images, use stream
      const fileStream = fs.createReadStream(file.path);
      formData.append("key", IMGBB_API_KEY);
      formData.append("image", fileStream);
    }
    
    // Optional parameters
    // Generate a name with prefix if provided
    if (namePrefix) {
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e9);
      const originalName = file.originalname || (isPdf ? "file.pdf" : "image");
      const ext = originalName.split(".").pop() || (isPdf ? "pdf" : "jpg");
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
      // Don't delete file if upload failed - it will be used for local fallback
      throw new Error(data.error?.message || data.error?.code || "Failed to upload image to imgbb");
    }

    // Delete local file after successful upload ONLY
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      // Also delete temp image file if it exists
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
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
    // Don't delete file on error - it will be used for local fallback
    // Only clean up temp image file if it exists
    try {
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
    } catch (err) {
      // Ignore cleanup errors
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

