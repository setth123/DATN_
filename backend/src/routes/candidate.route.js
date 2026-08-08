import express from "express";
import * as candidateController from "../controllers/candidate.controller.js";
import { authMiddleware } from "../middlewares/auth.middeware.js";
import { uploadLocal } from "../middlewares/upload.middleware.js";

const router = express.Router();


router.get("/me",authMiddleware, candidateController.getMyProfile);
router.get("/:id", candidateController.getCandidateById);
router.post("/",authMiddleware, uploadLocal.array("resumes"), candidateController.createOrUpdateProfile);


export default router;
