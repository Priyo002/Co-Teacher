const mongoose = require("mongoose");

const mentorSlotSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  bookedDuration: {
    type: Number,
    default: 0 // Track how many minutes are booked (0, 30, or 60)
  }
}, { timestamps: true });

module.exports = mongoose.model("MentorSlot", mentorSlotSchema);
