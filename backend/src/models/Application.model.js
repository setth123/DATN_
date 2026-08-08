import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true
    },

    cvSnapshotUrl: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Mỗi ứng viên chỉ apply 1 lần / job
applicationSchema.index(
  { jobId: 1, candidateId: 1 },
  { unique: true }
);

export default mongoose.model("Application", applicationSchema);
