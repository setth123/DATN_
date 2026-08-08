import express from "express";
import * as applicationController from "../controllers/application.controller.js";
import { authMiddleware } from "../middlewares/auth.middeware.js";
import { requireCandidate } from "../middlewares/role.middleware.js";
import { uploadLocal } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireCandidate,
  uploadLocal.single("cv"),
  applicationController.applyJob
);

router.delete(
  "/:jobId",
  authMiddleware,
  requireCandidate,
  applicationController.cancelApply
);

router.get(
  "/my",
  authMiddleware,
  requireCandidate,
  applicationController.getMyApplications
);


export default router;
