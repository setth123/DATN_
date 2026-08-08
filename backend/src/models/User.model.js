import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    
    password: {
      type: String,
      default: null
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },

    providerId: {
      type: String,
      default: null
    },

    roles: {
      candidate: {
        type: Boolean,
        default: true
      },
      recruiter: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
