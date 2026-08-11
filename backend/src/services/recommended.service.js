import Candidate from "../models/Candidate.model.js";
import Job from "../models/Job.model.js";
import Company from "../models/Company.model.js";
import Application from "../models/Application.model.js";
import { matchCandidateToJob } from "./matching.service.js";    

export const recommendJobs = async (userId) => {
  console.log("UserId:", userId);
  const candidate = await Candidate.findOne({userId:userId});
  const jobs = await Job.find();
  
  // Lấy danh sách các jobId mà ứng viên đã ứng tuyển
  const applications = await Application.find({ candidateId: candidate._id }).select('jobId');
  const appliedJobIds = applications.map(app => app.jobId.toString());

  // Lấy kỹ năng từ các công việc đã ứng tuyển
  const appliedJobs = await Job.find({ _id: { $in: appliedJobIds } }).select('requiredSkills');
  let skillsFromAppliedJobs = [];
  appliedJobs.forEach(job => {
    skillsFromAppliedJobs = skillsFromAppliedJobs.concat(job.requiredSkills);
  });

  // Kết hợp kỹ năng từ profile và kỹ năng từ các công việc đã ứng tuyển, loại bỏ trùng lặp
  const combinedSkills = [...candidate.skills, ...skillsFromAppliedJobs];
  const uniqueSkillsMap = new Map();
  combinedSkills.forEach(skill => {
    if (skill && skill.name) { // Assuming skill object has a 'name' property
      uniqueSkillsMap.set(skill.name.toLowerCase(), skill);
    }
  });
  const augmentedCandidateSkills = Array.from(uniqueSkillsMap.values());
  const previousTitle=appliedJobs.map(job=>job.title);
  // Lọc bỏ các công việc mà ứng viên đã ứng tuyển khỏi danh sách đề xuất
  var filteredJobs = jobs.filter(job => !appliedJobIds.includes(job._id.toString()));
  filteredJobs=await Promise.all(filteredJobs.map(async (job) => {
    const company = await Company.findById(job.companyId).select('name logoURL location');
    return { ...job._doc, companyInfo: company };
  }));

  return filteredJobs
  .map(job => {
    const match = matchCandidateToJob(job, candidate, augmentedCandidateSkills,previousTitle);
    return {
      job,
      matchScore: match.percentage,
      matchDetail: match.detail
    };
  })
  .sort((a, b) => b.matchScore - a.matchScore)
  .slice(0, 12);
};

export const recommendCandidatesForJob = async (userId, jobId) => {
  // 1. Check company
  const company = await Company.findOne({
    ownerId: userId,
    status: "APPROVED"
  });

  if (!company) {
    throw new Error("Company not found or not approved");
  }

  // 2. Check job ownership
  const job = await Job.findOne({
    _id: jobId,
    companyId: company._id
  });

  if (!job) {
    throw new Error("Job not found or access denied");
  }
  // 3. Load candidates
  const candidates = await Candidate.find().where("isOpenToWork").equals(true);
  // 4. Matching
  const results = candidates
    .map(candidate => {
      const match = matchCandidateToJob(job, candidate);
      return {
        candidate: {
          _id: candidate._id,
          fullName: candidate.fullName,
          title: candidate.title,
          skills: candidate.skills,
          cv: candidate.cv,
          isOpenToWork: candidate.isOpenToWork
        },
        matchScore: match.percentage,
        matchDetail: match.detail
      };
    })
    .filter(item => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0,10);
  return {
    job: {
      _id: job._id,
      title: job.title
    },
    candidates: results
  };
};
