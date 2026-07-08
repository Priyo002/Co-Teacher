const User = require("../models/User");
const Lesson = require("../models/Lesson");
const CreditHistory = require("../models/CreditHistory");
const cloudinary = require("../config/cloudinary");
const Certificate = require("../models/Certificate");
const { sendEmail } = require("../services/emailService");
const twilio = require('twilio');

// Initialize Twilio client (only if env vars are present)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

async function toggleBookmark(req, res) {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    // Verify the lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if it's already bookmarked
    const isBookmarked = user.bookmarkedLessons.includes(lessonId);

    if (isBookmarked) {
      // Remove it
      user.bookmarkedLessons = user.bookmarkedLessons.filter(id => id.toString() !== lessonId);
    } else {
      // Add it
      user.bookmarkedLessons.push(lessonId);
    }

    await user.save();

    return res.json({ 
      isBookmarked: !isBookmarked,
      message: isBookmarked ? "Lesson removed from bookmarks" : "Lesson bookmarked successfully" 
    });
  } catch (error) {
    console.error("Toggle Bookmark Error:", error);
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
}

async function getBookmarks(req, res) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "bookmarkedLessons",
      select: "title description language isEnriched module", // Select fields we need
      populate: {
        path: "module",
        select: "title course",
        populate: {
          path: "course",
          select: "title description"
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter out any orphaned bookmarks (e.g. if a lesson was deleted)
    const validBookmarks = user.bookmarkedLessons.filter(lesson => lesson !== null);
    
    // If we cleaned up orphans, save the user
    if (validBookmarks.length !== user.bookmarkedLessons.length) {
      user.bookmarkedLessons = validBookmarks.map(l => l._id);
      await user.save();
    }

    return res.json({ bookmarks: validBookmarks });
  } catch (error) {
    console.error("Get Bookmarks Error:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
}

async function checkBookmark(req, res) {
  try {
    const { lessonId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isBookmarked = user.bookmarkedLessons.includes(lessonId);
    return res.json({ isBookmarked });
  } catch (error) {
    console.error("Check Bookmark Error:", error);
    res.status(500).json({ error: "Failed to check bookmark status" });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, phone, educationLevel, fieldOfStudy, learningStyle, learningGoal } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name) user.name = name;
    
    // If phone changes, reset verification
    if (phone && user.phone !== phone) {
      user.phone = phone;
      user.isPhoneVerified = false;
    }

    if (educationLevel) user.educationLevel = educationLevel;
    if (fieldOfStudy) user.fieldOfStudy = fieldOfStudy;
    if (learningStyle) user.learningStyle = learningStyle;
    if (learningGoal) user.learningGoal = learningGoal;
    const isFirstTimeOnboarding = !user.hasCompletedOnboarding;
    user.hasCompletedOnboarding = true;

    await user.save();
    
    // Send Welcome Email
    if (isFirstTimeOnboarding && user.email) {
      sendEmail({
        to: user.email,
        subject: "Welcome to Co-Teacher! 🚀",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #4F46E5;">Welcome to Co-Teacher, ${user.name || 'Student'}!</h1>
            <p>Your profile is fully set up and you are ready to start learning.</p>
            <p>We've saved your learning preferences (<strong>${user.educationLevel}</strong>) so the AI can generate courses perfectly suited for you.</p>
            <p>Log in and generate your first course today!</p>
            <br/>
            <p>Happy Learning,<br/>The Co-Teacher Team</p>
          </div>
        `
      });
    }

    return res.json(user);
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const uploadRes = await cloudinary.uploader.upload(dataURI, {
      folder: 'co_teacher_profiles',
      resource_type: "image"
    });

    await User.findByIdAndUpdate(req.user._id, { 
      profilePicture: uploadRes.secure_url 
    });

    res.json({ success: true, profilePicture: uploadRes.secure_url });
  } catch (error) {
    console.error("Failed to upload profile picture:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
}

async function sendOtp(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.phone) {
      return res.status(400).json({ error: "Please save your phone number first." });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({ error: "Phone number is already verified." });
    }

    if (!twilioClient || !verifyServiceSid) {
      return res.status(500).json({ error: "Twilio credentials are not configured properly on the server." });
    }
    
    // Clean up the phone number string (remove spaces)
    const cleanPhone = user.phone.replace(/\s+/g, '');

    // Call Twilio Verify API to send SMS
    await twilioClient.verify.v2.services(verifyServiceSid)
      .verifications
      .create({ to: cleanPhone, channel: 'sms' });

    return res.json({ message: "OTP sent successfully via Twilio SMS." });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ error: "Failed to send OTP via Twilio. Ensure your number is correct and Twilio is configured." });
  }
}

async function verifyOtp(req, res) {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: "OTP is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isPhoneVerified) {
      return res.status(400).json({ error: "Phone number is already verified." });
    }

    if (!twilioClient || !verifyServiceSid) {
      return res.status(500).json({ error: "Twilio credentials are not configured properly on the server." });
    }

    const cleanPhone = user.phone.replace(/\s+/g, '');

    // Call Twilio Check API
    const verificationCheck = await twilioClient.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to: cleanPhone, code: otp });

    if (verificationCheck.status !== "approved") {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    // Success! Verify and grant credits
    user.isPhoneVerified = true;
    user.credits += 100;
    
    // Clear old mock cache if any
    user.otpCache = undefined;
    
    await user.save();

    console.log(`User ${user._id} verified phone. Granting 100 credits.`);
    await CreditHistory.create({
      user: user._id,
      amount: 100,
      reason: "Phone Verification Bonus"
    });

    // Send Welcome Message
    if (twilioPhoneNumber) {
      try {
        await twilioClient.messages.create({
          body: `Welcome to Co-Teacher, ${user.name || 'Student'}! Your phone is verified and 100 bonus credits have been added to your account. Happy learning! 🚀`,
          from: twilioPhoneNumber,
          to: cleanPhone
        });
      } catch (smsError) {
        console.error("Failed to send welcome SMS:", smsError);
        // We don't fail the verification if the welcome message fails
      }
    }

    return res.json({ 
      message: "Phone verified successfully! You received 100 credits.", 
      user 
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ error: "Failed to verify OTP with Twilio." });
  }
}

async function getCreditHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await CreditHistory.countDocuments({ user: req.user._id });
    const history = await CreditHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    return res.json({ 
      history, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (error) {
    console.error("Failed to fetch credit history:", error);
    return res.status(500).json({ error: "Failed to fetch credit history" });
  }
}

async function getCertificates(req, res) {
  try {
    const certificates = await Certificate.find({ user: req.user._id }).sort({ issuedAt: -1 }).populate('course');
    return res.json({ certificates });
  } catch (error) {
    console.error("Failed to fetch certificates:", error);
    return res.status(500).json({ error: "Failed to fetch certificates" });
  }
}

module.exports = {
  toggleBookmark,
  getBookmarks,
  checkBookmark,
  getProfile,
  updateProfile,
  sendOtp,
  verifyOtp,
  getCreditHistory,
  getCertificates,
  uploadProfilePicture
};
