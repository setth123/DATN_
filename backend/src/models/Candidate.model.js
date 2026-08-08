import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    fullName:{type: String,required:true},
    phone: {type: String,required:true},
    title: {type: String,required:true},
    bio: {type: String,required:true  },

    skills: [
      {
        name: String,
        level: {
          type: String,
          enum: ["Cơ bản", "Trung bình", "Khá", "Thành thạo", "Chuyên gia"]
        }
      }
    ],

    experiences: [
      {
        company: String,
        position: String,
        startDate: Date,
        endDate: Date,
        description: String
      }
    ],

    education: [
      {
        school: String,
        degree: String,
        startYear: Number,
        endYear: Number
      }
    ],

    resumes: [
      {
        fileUrl: String,
        fileName: String,
        extractedText: String,
      },
    ],
    isOpenToWork: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);
