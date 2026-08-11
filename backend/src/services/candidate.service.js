import fs from "fs/promises";
import path from "path";
import Candidate from "../models/Candidate.model.js";
import User from "../models/User.model.js";

export const getMyCandidateProfile = async (userId) => {
  const candidate = await Candidate.findOne({ userId });
  const email = await User.findById(userId).select("email");
  if (candidate) {
    const candidateObj = candidate.toObject();
    candidateObj.email = email.email;
    return candidateObj;
  }
};

export const getCandidateById = async (candidateId) => {
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new Error("Candidate not found");
  }
  const email = await User.findById(candidate.userId).select("email");
  const candidateObj = candidate.toObject();
  candidateObj.email = email.email;
  return candidateObj;
};

export const createOrUpdateCandidateProfile = async (userId, data) => {
  const existing = await Candidate.findOne({ userId });
  if (existing) {
    return Candidate.findOneAndUpdate({ userId }, data, { new: true });
  }

  return Candidate.create({
    userId,
    ...data,
  });
};



