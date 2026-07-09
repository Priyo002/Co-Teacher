const mongoose = require("mongoose");

const mentorApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  expertise: [{
    type: String,
    required: true
  }],
  experience: {
    type: String,
    required: true
  },
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
