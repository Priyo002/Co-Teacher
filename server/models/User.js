const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email is invalid"],
  },
  password: { type: String, maxlength: 128 },
  auth0Id: { type: String, maxlength: 255 },
  bookmarkedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson"
  }],
}, { timestamps: true });

userSchema.index({ auth0Id: 1 }, { unique: true, sparse: true });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
