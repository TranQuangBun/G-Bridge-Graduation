import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fromPath } from "pdf2pic";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert first page of PDF to image and return as buffer
 * This is optimized for uploading to ImgBB
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<{imageBuffer: Buffer, format: string}>}
 */
export async function convertPdfFirstPageToImageBuffer(pdfPath) {
  try {
    // Configure pdf2pic options
    const options = {
      density: 200, // DPI for better quality
      saveFilename: "temp-resume",
      savePath: path.dirname(pdfPath),
      format: "jpg",
      width: 2000, // Max width
      height: 2000, // Max height
    };

    // Convert PDF first page to image
    const convert = fromPath(pdfPath, options);
    const result = await convert(1, { responseType: "buffer" }); // Convert page 1
    
    if (!result || !result.buffer) {
      throw new Error("Failed to convert PDF to image: No buffer returned");
    }

    // Clean up temporary image file if it was saved
    const tempImagePath = path.join(options.savePath, `${options.saveFilename}.1.${options.format}`);
    try {
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
    } catch (err) {
      // Ignore cleanup errors
    }

    return {
      imageBuffer: result.buffer,
      format: "jpeg",
    };
  } catch (error) {
    throw new Error(`Failed to convert PDF to image: ${error.message}`);
  }
}

