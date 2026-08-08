import multer from "multer";
import path from "path";
import fs from "fs"; // Import fs module

// Define the destination directory for uploads
const uploadDir = "file_uploads/"; // Thư mục lưu trữ file

// Ensure the upload directory exists. If not, create it.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi file sẽ được lưu trữ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Thư mục lưu trữ file
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    ); // Tên file sau khi lưu
  },
});

// Filter các loại file được phép upload (ví dụ: chỉ cho phép upload file PDF, JPG, PNG)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true); // Chấp nhận file
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX and image files are allowed."
      ),
      false
    ); // Từ chối file
  }
};

// Cấu hình Multer
const uploadLocal = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Giới hạn kích thước file là 5MB
  },
});

export { uploadLocal };
