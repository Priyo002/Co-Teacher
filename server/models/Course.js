const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 600 },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    language: { type: String, default: "English" },
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
    isPublic: { type: Boolean, default: false },
    shareId: { type: String, maxlength: 64 },
    finalTest: {
      generatedAt: { type: Date },
      questions: [
        {
          question: { type: String, required: true },
          options: [{ type: String, required: true }],
          correctAnswer: { type: Number, required: true },
          explanation: { type: String, required: true }
        }
      ]
    }
  },
  { timestamps: true }
);

courseSchema.index({ shareId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Course", courseSchema);
