const mongoose = require("mongoose");

const mentorApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  languages: [{ type: String, required: true }],
  experienceYears: { type: Number, required: true },
  targetAudience: [{ type: String, required: true }], // e.g. 'College', 'Professional'
  domains: [{ type: String, required: true }], // e.g. 'Backend Developer', 'Frontend Developer'
  skills: [{ type: String, required: true }], // e.g. 'Java', 'React'
  
  linkedinUrl: { type: String },
  portfolioUrl: { type: String },
  proofOfWork: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model("MentorApplication", mentorApplicationSchema);
