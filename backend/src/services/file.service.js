import fs from 'fs/promises'; // Sử dụng fs.promises cho các thao tác bất đồng bộ
import path from 'path';

// Định nghĩa đường dẫn thư mục lưu file (giống như trong upload.middleware.js)
const tempUploadDir = path.join(process.cwd(), 'file_uploads');

/**
 * Xóa một file vật lý khỏi hệ thống.
 * @param {string} filePath - Đường dẫn tương đối hoặc tuyệt đối của file cần xóa.
 * @returns {Promise<boolean>} - True nếu xóa thành công, false nếu file không tồn tại.
 * @throws {Error} - Ném lỗi nếu có vấn đề trong quá trình xóa (ngoại trừ file không tồn tại).
 */
export const deleteFile = async (filePath) => {
  if (!filePath) {
    throw new Error("Không có đường dẫn file được cung cấp để xóa.");
  }
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') { // File not found
      console.warn(`File không tồn tại tại ${filePath}, bỏ qua việc xóa.`);
      return false;
    }
    throw new Error(`Lỗi khi xóa file tại ${filePath}: ${error.message}`);
  }
};