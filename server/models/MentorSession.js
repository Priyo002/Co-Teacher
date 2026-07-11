const mongoose = require("mongoose");

const mentorSessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MentorSlot"
  },
  context: {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }
  },
  startTime: {
    type: Date,
    required: true
  },
  durationMins: {
    type: Number,
    enum: [30, 60],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending' // Typically 'confirmed' once payment is successful
  },
  payment: {
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['CREDITS', 'INR'], required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    transactionId: { type: String } // To store Razorpay payment ID or internal credit transaction ref
  },
  meetingLink: { type: String }, // Inherited from mentor or generated uniquely
  googleEventId: { type: String } // Stores the ID of the Google Calendar event
}, { timestamps: true });

module.exports = mongoose.model("MentorSession", mentorSessionSchema);
