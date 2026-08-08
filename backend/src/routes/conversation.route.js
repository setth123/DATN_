import express from "express";
import * as conversationController from "../controllers/conversation.controller.js";
import { authMiddleware } from "../middlewares/auth.middeware.js";

const router=express.Router();

router.post("/",authMiddleware,conversationController.getOrCreateConversation);
router.post("/ai",authMiddleware,conversationController.createOrGetAIConversation);
export default router;