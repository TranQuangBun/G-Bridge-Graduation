import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo folder uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, "../../uploads/certifications");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique: cert-userId-timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const userId = req.user.sub || req.user.id;
    const filename = `cert-${userId}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter - chỉ chấp nhận ảnh và PDF
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = /image\/(jpeg|jpg|png|gif|webp)|application\/pdf/.test(
    file.mimetype
  );

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files and PDF are allowed!"));
  }
};

// Tạo multer instance
const uploadCertification = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: fileFilter,
});

export default uploadCertification;
