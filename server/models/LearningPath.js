const mongoose = require("mongoose");

const learningPathSchema = new mongoose.Schema(
  {
    goal: { type: String, required: true, trim: true, maxlength: 2000 },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courses: [
      {
        title: { type: String, required: true, maxlength: 200 },
        description: { type: String, required: true, maxlength: 600 },
        prerequisites: [{ type: String }],
        estimatedHours: { type: Number, required: true },
        difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          default: null
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("LearningPath", learningPathSchema);
