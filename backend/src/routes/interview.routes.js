import express from 'express';
import { initiateInterview } from '../controllers/interview.controller.js';
import { authMiddleware } from '../middlewares/auth.middeware.js';
import {uploadLocal} from '../middlewares/upload.middleware.js';

const router = express.Router();

// @route   POST /api/interview/initiate
// @desc    Khởi tạo một phiên phỏng vấn bằng cách tải lên CV và cung cấp JD
// @access  Private
router.post(
  '/initiate',
  authMiddleware, // Đảm bảo người dùng đã đăng nhập
  uploadLocal.single('cv'), // Middleware xử lý tải lên một file với tên field là 'cv'
  initiateInterview
);

export default router;
