import * as applicationService from "../services/application.service.js";

export const applyJob = async (req, res) => {
  try {
    const { jobId, cvSnapshotUrl: cvSnapshotUrlFromBody } = req.body;
    const cvSnapshotUrl = req.file ? req.file.path : cvSnapshotUrlFromBody;

    if (!cvSnapshotUrl) {
      return res.status(400).json({ message: "A CV is required." });
    }

    const application = await applicationService.applyJob(
      req.user.userId,
      jobId,
      cvSnapshotUrl
    );

    res.status(201).json({
      message: "Applied successfully",
      data: application,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const cancelApply = async (req, res) => {
  try {
    await applicationService.cancelApply(
      req.user.userId,
      req.params.jobId
    );

    res.json({ message: "Application cancelled" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const result = await applicationService.getMyApplications(
      req.user.userId,
      req.query
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
