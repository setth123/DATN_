import express from "express";
import * as jobController from "../controllers/job.controller.js";
import { authMiddleware } from "../middlewares/auth.middeware.js";
import { requireRecruiter } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/company/:companyId", jobController.getJobsByCompany); // Specific route for company jobs
router.get("/search", jobController.getJobs); // Specific route for general job search
router.get("/:id", jobController.getJobById);
router.get("/", jobController.getJobs); // General route for all jobs (e.g., for browsing or other filters)
router.post("/", authMiddleware, requireRecruiter, jobController.createOrUpdateJob);
router.delete("/:id", authMiddleware, requireRecruiter, jobController.deleteJob);

export default router;
