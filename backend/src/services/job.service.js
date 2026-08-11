import Job from "../models/Job.model.js";
import Company from "../models/Company.model.js";

import { buildJobKeywordConditions, buildSortQuery } from "./jobQuery.service.js";

export const createOrUpdateJob = async (userId, data) => {
  const company = await Company.findOne({
    ownerId: userId,
    status: "APPROVED"
  });

  if (!company) {
    throw new Error("Approved company not found");
  }
  const existing = await Job.findOne({
    companyId: company._id,
    _id: data._id
  });
  if (existing) {
    return Job.findOneAndUpdate({
      companyId: company._id,
      _id: data._id
    }, data, {
      new: true
    });
  }
  return Job.create({
    companyId: company._id,
    applicationsNum: 0,
    ...data
  });
};
export const deleteJob=async(jobId,userId)=>{
  const job=await Job.findById(jobId);
  if(!job){
    throw new Error("Job not found");
  }
  await Job.findByIdAndDelete(jobId);
} 
export const getJobById = async (jobId) => {
  jobId = typeof jobId === "string" ? Job.schema.path("_id").cast(jobId) : jobId;
  return Job.findById(jobId).populate("companyId", "name logo");
};

export const getJobs = async (query) => {
  const {
    page = 1,
    limit = 12,
    sort= "newest"
  } = query;

  const mainFilterConditions = []; // Conditions for the Job collection

  // Handle keyword search (job fields OR company name)
  if (query.keyword) {
    const keywordOrConditions = buildJobKeywordConditions(query.keyword);

    // Find companies matching the keyword
    const matchingCompaniesByKeyword = await Company.find({ name: { $regex: query.keyword, $options: "i" } }).select('_id');
    if (matchingCompaniesByKeyword.length > 0) {
      keywordOrConditions.push({ companyId: { $in: matchingCompaniesByKeyword.map(c => c._id) } });
    }
    if (keywordOrConditions.length > 0) {
      mainFilterConditions.push({ $or: keywordOrConditions });
    }
  }

  // Handle skill search (from Gemini tool)
  if (query.skill && query.skill.name) {
    const skillConditions = {
      "requiredSkills.name": { $regex: query.skill.name, $options: "i" }
    };
    if (query.skill.level) {
      skillConditions["requiredSkills.level"] = query.skill.level;
    }
    mainFilterConditions.push(skillConditions);
  }

  // Handle location search
  if (query.locations) {
    const locationParts = query.locations.split(",").map(part => part.trim());
    const locationRegexConditions = locationParts.map(part => ({
      location: { $regex: part, $options: "i" }
    }));
    const matchingCompaniesByLocation = await Company.find({ $or: locationRegexConditions }).select('_id');

    if (matchingCompaniesByLocation.length === 0) {
      // If location filter is applied but no companies match, return empty results
      return {
        data: [],
        pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 }
      };
    }
    mainFilterConditions.push({ companyId: { $in: matchingCompaniesByLocation.map(c => c._id) } });
  }

  // Combine all main filter conditions with $and
  const filter = mainFilterConditions.length > 0 ? { $and: mainFilterConditions } : {};
  const sortQuery = buildSortQuery(sort);

  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("companyId", "name logoURL location")
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(filter)
  ]);

  return {
    data: jobs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};
export const getJobsByCompany = async (companyId) => {
    return Job.find({ companyId }).populate("companyId", "name logo location");
};