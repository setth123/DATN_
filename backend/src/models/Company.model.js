import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true
    },

    website: { type: String },
    email: { type: String },
    description: { type: String },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },

    TIN: { type: String, required: true },               // mã số thuế
    location: { type: String, required: true },
    logoURL: {type:String},

    companyType: { type: String, required: true },       // ví dụ: Product, Outsourcing, Startup
    mainOccupation: { type: String, required: true },    // lĩnh vực chính
    foundedYear: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
