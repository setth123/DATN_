import express from "express";
import * as companyController from "../controllers/company.controller.js";
import { authMiddleware } from "../middlewares/auth.middeware.js";
import { uploadLocal } from "../middlewares/upload.middleware.js";
import { requireRecruiter } from "../middlewares/role.middleware.js";

const router = express.Router();


router.get("/me",authMiddleware, companyController.getMyCompany);
router.get("/most-jobs",companyController.getMostJobCompany);
router.get("/:id", companyController.getCompanyById);
router.post(
  "/",
  authMiddleware,
  uploadLocal.single("logo"),
  companyController.createOrUpdateCompany
);
router.get(
  "/jobs/:jobId/applications",
  authMiddleware,
  requireRecruiter,
  companyController.getJobApplications
);
export default router;
