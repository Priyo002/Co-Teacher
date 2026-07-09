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
  profilePicture: { type: String, default: "" },
  
  phone: { type: String, maxlength: 20 },
  isPhoneVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  otpCache: {
    code: { type: String },
    expiresAt: { type: Date }
  },
  
  // --- Personalization Fields ---
  hasCompletedOnboarding: { type: Boolean, default: false },
  lastActiveAt: { type: Date, default: Date.now },
  lastRetentionEmailDate: { type: Date },
  educationLevel: { 
    type: String, 
    enum: ['High School', 'College', 'Professional', 'Hobbyist'] 
  },
  fieldOfStudy: { type: String, maxlength: 100 },
  learningStyle: [{ 
    type: String, 
    enum: ['Visual', 'Reading', 'Hands-on'] 
  }],
  learningGoal: { type: String, maxlength: 255 },
  
  // --- Wallet / Credits ---
  credits: { type: Number, default: 500 },
  lowCreditEmailSent: { type: Boolean, default: false },

  // --- Leaderboard / Gamification ---
  totalTestsTaken: { type: Number, default: 0 },
  globalScore: { type: Number, default: 0 },

  bookmarkedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson"
  }],
  
  cachedCourseSuggestions: [{
    title: String,
    description: String,
    difficulty: String
  }],
  lastSuggestionsGeneratedAt: { type: Date },

  // --- Mentor Specific Fields ---
  isMentor: { type: Boolean, default: false },
  mentorProfile: {
    bio: { type: String, maxlength: 1000 },
    rateCredits: { type: Number },
    rateINR: { type: Number },
    expertise: [{ type: String }],
    meetingLink: { type: String }, // e.g., Google Meet default link
    upiId: { type: String },
    bankDetails: { type: String },
    availability: [{
      dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, 1 = Monday
      slots: [{
        startTime: { type: String }, // e.g., "09:00"
        endTime: { type: String } // e.g., "17:00"
      }]
    }],
    dateOverrides: [{
      date: { type: String }, // "YYYY-MM-DD"
      slots: [{
        startTime: { type: String },
        endTime: { type: String }
      }]
    }]
  }
}, { timestamps: true });

userSchema.index({ auth0Id: 1 }, { unique: true, sparse: true });
userSchema.index({ globalScore: -1 });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
