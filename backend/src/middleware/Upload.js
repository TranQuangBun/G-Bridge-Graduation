import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createUploadMiddleware(options = {}) {
  const {
    directory = "general",
    filePrefix = "file",
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    allowedExtensions = ["jpeg", "jpg", "png", "gif", "webp"],
  } = options;

  const uploadsDir = path.join(__dirname, "../../uploads", directory);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const userId = req.user?.sub || req.user?.id || "anonymous";
      const filename = `${filePrefix}-${userId}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const extname = allowedExtensions.includes(ext);
    const mimetype = allowedMimeTypes.some((type) => {
      if (type.includes("*")) {
        return file.mimetype.startsWith(type.replace("*", ""));
      }
      return file.mimetype === type;
    });

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          `Only ${allowedExtensions.join(", ")} files are allowed!`
        )
      );
    }
  };

  return multer({
    storage: storage,
    limits: {
      fileSize: maxSize,
    },
    fileFilter: fileFilter,
  });
}

export const uploadAvatar = createUploadMiddleware({
  directory: "avatars",
  filePrefix: "user",
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  allowedExtensions: ["jpeg", "jpg", "png", "gif", "webp"],
});

export const uploadCertification = createUploadMiddleware({
  directory: "certifications",
  filePrefix: "cert",
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ],
  allowedExtensions: ["jpeg", "jpg", "png", "gif", "webp", "pdf"],
});

export const uploadResume = createUploadMiddleware({
  directory: "resumes",
  filePrefix: "resume",
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  allowedExtensions: ["pdf", "doc", "docx"],
});

export const uploadJobDocument = createUploadMiddleware({
  directory: "job-documents",
  filePrefix: "job",
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  allowedExtensions: ["jpeg", "jpg", "png", "pdf", "doc", "docx"],
});

export default uploadAvatar;

