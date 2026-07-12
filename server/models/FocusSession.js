const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false
  },
  lessonId: {
    type: String, // String to match Module/Lesson structure if needed
    required: false
  },
  courseTitle: {
    type: String,
    required: false
  },
  lessonTitle: {
    type: String,
    required: false
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in seconds
    required: true,
    default: 0
  },
  averageScore: {
    type: Number, // 0 to 100
    required: true,
    default: 0
  },
  nudgeCount: {
    type: Number,
    required: true,
    default: 0
  },
  dataPoints: [{
    timestamp: { type: Date, required: true },
    timeOffset: { type: Number, required: true }, // seconds since start
    score: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('FocusSession', focusSessionSchema);
