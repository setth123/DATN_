import * as candidateService from "../services/candidate.service.js";
import { deleteFile } from "../services/file.service.js"; 

export const getMyProfile = async (req, res) => {
  try {
    const profile = await candidateService.getMyCandidateProfile(req.user.userId);
    res.json({ data: profile });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const createOrUpdateProfile = async (req, res) => {
  try {
    const profileData = { ...req.body };
    const userId = req.user.userId;

    // Fetch existing profile to manage resumes
    const existingProfile = await candidateService.getMyCandidateProfile(userId);
    let existingResumes = existingProfile?.resumes || [];

    // Handle deleted resumes
    if (req.body.deletedResumes) {
      const deletedResumes = JSON.parse(req.body.deletedResumes);
      for (const resume of deletedResumes) {
        await deleteFile(resume.fileUrl);
      }
      const deletedUrls = deletedResumes.map(r => r.fileUrl);
      existingResumes = existingResumes.filter(r => !deletedUrls.includes(r.fileUrl));
    }

    // Handle newly uploaded resumes
    if (req.files) {
      const newResumes = req.files.map((file) => ({
        fileUrl: file.path,
        fileName: file.originalname,
      }));
      existingResumes.push(...newResumes);
    }
    
    profileData.resumes = existingResumes;


    // Since the frontend sends these as JSON strings, we need to parse them
    if (profileData.skills) {
      profileData.skills = JSON.parse(profileData.skills);
    }
    if (profileData.experiences) {
      profileData.experiences = JSON.parse(profileData.experiences);
    }
    if (profileData.education) {
      profileData.education = JSON.parse(profileData.education);
    }

    const profile = await candidateService.createOrUpdateCandidateProfile(
      userId,
      profileData
    );

    res.status(201).json({
      message: "Candidate profile created or updated",
      data: profile,
    });
  } catch (err) {
    console.error("Error in createOrUpdateProfile:", err);
    res.status(400).json({ message: err.message || "An error occurred during profile update." });
  }
};

export const getCandidateById = async (req, res) => {
  try {
    const candidateId = req.params.id;
    const candidate = await candidateService.getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    res.json({ data: candidate });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
