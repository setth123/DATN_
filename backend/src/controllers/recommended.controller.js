import express from "express";
import { authMiddleware } from "../middlewares/auth.middeware.js";
import { requireCandidate, requireRecruiter } from "../middlewares/role.middleware.js";
import * as recommendService from "../services/recommended.service.js"

export const recommendCandidates = async (req, res) => {
    try {
        const candidates = await recommendService.recommendCandidates(req.params.jobId);
        res.json(candidates);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

export const recommendJobs = async (req, res) => {
    try {
        const jobs = await recommendService.recommendJobs(req.user.userId);
        res.json(jobs);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
} 

export const recommendCandidateForJob= async (req, res) => {
    try {
        const candidates = await recommendService.recommendCandidatesForJob(req.user.userId, req.params.jobId);
        res.json(candidates);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
