import { getIo, getSocketIdForUser } from '../services/socket.service.js';
import { startInterview } from '../services/geminiInterview.service.js';
import { getPDFContext, getDOCXContext } from '../utils/buildPrompt.js';
import { deleteFile } from '../services/file.service.js';

export const initiateInterview = async (req, res, next) => {
  const { jdContext } = req.body;
  const cvFile = req.file;
  const userId = req.user.userId; // Lấy từ middleware xác thực

  if (!jdContext || !cvFile) {
    // Dọn dẹp file đã tải lên nếu có
    if (cvFile) await deleteFile(cvFile.path);
    return res.status(400).json({ message: 'Cả CV (file) và JD (text) đều là bắt buộc.' });
  }

  try {
    // 1. Trích xuất văn bản từ CV
    let cvContext = "";
    if (cvFile.mimetype === "application/pdf") {
      cvContext = await getPDFContext(cvFile.path);
    } else if (cvFile.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      cvContext = await getDOCXContext(cvFile.path);
    } else {
      throw new Error("Định dạng file CV không được hỗ trợ. Vui lòng sử dụng PDF hoặc DOCX.");
    }

    // 2. Sử dụng interview_<userId> làm sessionId cho đơn giản
    const sessionId = "interview_" + userId;

    // 3. Lấy instance của Socket.IO và chủ động cho user vào phòng để tránh race condition
    const io = getIo();
    const userSocketId = getSocketIdForUser(userId);

    if (!userSocketId) {
        throw new Error("Không tìm thấy kết nối socket đang hoạt động cho người dùng. Vui lòng tải lại trang và thử lại.");
    }
    const socket = io.sockets.sockets.get(userSocketId);
    if (socket) {
        socket.join(sessionId);
    } else {
        throw new Error("Không thể tìm thấy instance socket. Vui lòng thử lại.");
    }

    // 4. Định nghĩa callback để stream audio
    const onAudioChunk = (audioChunk, mimeType) => {
      // Gửi chunk audio đến phòng của người dùng cụ thể
      io.to(sessionId).emit('ai_audio_chunk', { sessionId, audioChunk, mimeType });
    };

    // 5. Gọi service để bắt đầu quá trình phỏng vấn
    await startInterview(sessionId, cvContext, jdContext, onAudioChunk);

    // 6. Phản hồi lại HTTP request
    res.status(200).json({
      success: true,
      message: 'Phiên phỏng vấn đã được khởi tạo. Vui lòng lắng nghe trên kênh socket.',
      sessionId: sessionId
    });

  } catch (error) {
    console.error("Lỗi khi khởi tạo phỏng vấn:", error);
    res.status(500).json({ message: error.message || 'Lỗi máy chủ khi bắt đầu phỏng vấn.' });
  } finally {
    // 7. Dọn dẹp file CV đã tải lên
    if (cvFile) {
      await deleteFile(cvFile.path);
    }
  }
};
