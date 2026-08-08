import * as jobService from "../services/job.service.js";
import * as applicationService from "../services/application.service.js"

export const createOrUpdateJob = async (req, res) => {
  try {
    const job = await jobService.createOrUpdateJob(req.user.userId, req.body);
    res.status(201).json({ data: job });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
export const deleteJob = async (req, res) => {
  try {
    await jobService.deleteJob(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
 

export const getJobById = async (req, res) => {
  const job = await jobService.getJobById(req.params.id);
  res.json({ data: job });
};
export const getJobsByCompany = async (req, res) => {
    try {
        const jobs = await jobService.getJobsByCompany(req.params.companyId);
        res.json(jobs);
    } catch (err) {
        res.status(400).json({ message: err.message });
    } 
};
export const getJobs = async (req, res) => {
  try {
    const result = await jobService.getJobs(req.query);
    res.json(result);
  } catch (err){
    res.status(400).json({ message: err.message });
  }
};

export const getApplicationsByJobId = async (req, res) => {
    try {
        const applications = await applicationService.getApplicationsByJobId(req.params.id);
        res.json(applications);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
