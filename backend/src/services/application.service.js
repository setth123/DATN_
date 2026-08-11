import Application from "../models/Application.model.js";
import Candidate from "../models/Candidate.model.js";
import Job from "../models/Job.model.js";
import Company from "../models/Company.model.js";
import { createNotification } from "./notification.service.js";
import { getIo } from "./socket.service.js"; // Import getIo for socket emission

export const applyJob = async (userId, jobId, cvSnapshotUrl) => {
  const candidate = await Candidate.findOne({ userId });
  if (!candidate) throw new Error("Candidate profile not found");

  const existing = await Application.findOne({
    jobId,
    candidateId: candidate._id
  });
  if (existing) {
    throw new Error("Already applied to this job");
  }
  const job = await Job.findById(jobId).populate('companyId');
  if (!job) {
    throw new Error("Job not found");
  }
  const company = job.companyId;
  if(company.ownerId.toString() === userId) {
    throw new Error("Cannot apply to your own job");
  }
  const application = await Application.create({
    jobId,
    candidateId: candidate._id,
    cvSnapshotUrl
  });

  await Job.findByIdAndUpdate(jobId, {
    $inc: { applicationsNum: 1 }
  });

  // Create notification for the company
  const newNotification = await createNotification({
    to: company.ownerId,
    from: candidate._id,
    fromModel: 'Candidate',
    type: 'NEW_APPLICATION',
    displayName: candidate.fullName, // New field: candidate's full name
    jobTitle: job.title, // New field: job title
  });
  const io = getIo();
  if(io){
    io.to(company.ownerId.toString()).emit('new_notification', newNotification);
  }
  return application;
};

export const cancelApply = async (userId, jobId) => {
  const candidate = await Candidate.findOne({ userId });
  if (!candidate) throw new Error("Candidate profile not found");

  const deleted = await Application.findOneAndDelete({
    jobId,
    candidateId: candidate._id
  });

  if (!deleted) {
    throw new Error("Application not found");
  }

  await Job.findByIdAndUpdate(jobId, {
    $inc: { applicationsNum: -1 }
  });

  return true;
};

export const getMyApplications = async (userId, query) => {
  const candidate = await Candidate.findOne({ userId });
  if (!candidate) throw new Error("Candidate profile not found");

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find({ candidateId: candidate._id })
      .populate({
        path: "jobId",
        select: "title level companyId",
        populate: {
          path: "companyId",
          select: "name logo"
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments({ candidateId: candidate._id })
  ]);

  return {
    data: applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getApplicationsByJobId = async (jobId) => {
    const applications = await Application.find({ jobId }).populate({
        path: "candidateId",
        select: "fullname cv",
    });
    return applications;
}
