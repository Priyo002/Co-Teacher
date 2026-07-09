const User = require('../models/User');
const MentorApplication = require('../models/MentorApplication');
const MentorSlot = require('../models/MentorSlot');
const MentorSession = require('../models/MentorSession');

// --- ADMIN / APPLICATION ---

exports.applyToMentor = async (req, res) => {
  try {
    const { expertise, experience, linkedinUrl, portfolioUrl, proofOfWork } = req.body;
    if (!expertise || !experience) {
      return res.status(400).json({ error: "Expertise and experience are required" });
    }

    const existingApp = await MentorApplication.findOne({ user: req.user._id, status: 'pending' });
    if (existingApp) {
      return res.status(400).json({ error: "You already have a pending application" });
    }

    const application = new MentorApplication({
      user: req.user._id,
      expertise,
      experience,
      linkedinUrl,
      portfolioUrl,
      proofOfWork
    });
    
    await application.save();
    res.status(201).json({ message: "Application submitted successfully", application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to apply" });
  }
};

exports.approveMentor = async (req, res) => {
  try {
    // Basic admin check (Assuming req.user.isAdmin exists, fallback to simple check)
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { applicationId, status } = req.body; // status: 'approved' | 'rejected'
    const app = await MentorApplication.findById(applicationId);
    
    if (!app) return res.status(404).json({ error: "Application not found" });

    app.status = status;
    await app.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(app.user, {
        isMentor: true,
        $set: {
          'mentorProfile.expertise': app.expertise,
          'mentorProfile.bio': `Experienced in ${app.expertise.join(', ')}. ${app.experience}`
        }
      });
    }

    res.json({ message: `Application ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve mentor" });
  }
};

exports.getApplications = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const apps = await MentorApplication.find().populate('user', 'name email profilePicture').sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const users = await User.find().select('-auth0Id -__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// --- MENTOR DISCOVERY & PROFILE ---

exports.getMentors = async (req, res) => {
  try {
    const mentors = await User.find({ isMentor: true })
      .select('name profilePicture mentorProfile');
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
};

exports.updateMentorProfile = async (req, res) => {
  try {
    if (!req.user.isMentor) return res.status(403).json({ error: "You are not a mentor" });

    const { bio, rateCredits, rateINR, meetingLink, upiId, bankDetails, availability, dateOverrides } = req.body;
    
    const updateData = {};
    if (bio !== undefined) updateData['mentorProfile.bio'] = bio;
    if (rateCredits !== undefined) updateData['mentorProfile.rateCredits'] = rateCredits;
    if (rateINR !== undefined) updateData['mentorProfile.rateINR'] = rateINR;
    if (meetingLink !== undefined) updateData['mentorProfile.meetingLink'] = meetingLink;
    if (upiId !== undefined) updateData['mentorProfile.upiId'] = upiId;
    if (bankDetails !== undefined) updateData['mentorProfile.bankDetails'] = bankDetails;
    if (availability !== undefined) updateData['mentorProfile.availability'] = availability;
    if (dateOverrides !== undefined) updateData['mentorProfile.dateOverrides'] = dateOverrides;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true });
    res.json(user.mentorProfile);
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// --- SCHEDULING ---

exports.createSlot = async (req, res) => {
  // Deprecated. We now use dynamic slots via availability.
  res.status(400).json({ error: "Manual slots are deprecated. Update your availability schedule instead." });
};

exports.deleteSlot = async (req, res) => {
  // Deprecated.
  res.status(400).json({ error: "Manual slots are deprecated." });
};

exports.getMentorSlots = async (req, res) => {
  try {
    const mentor = await User.findById(req.params.mentorId);
    if (!mentor || !mentor.isMentor) return res.status(404).json({ error: "Mentor not found" });

    const availability = mentor.mentorProfile?.availability || [];
    const dateOverrides = mentor.mentorProfile?.dateOverrides || [];
    const slots = [];
    
    // Generate dates for the next 14 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = currentDate.getDay();
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check for overrides first
      const override = dateOverrides.find(o => o.date === dateString);
      let daySlots = [];
      
      if (override) {
        daySlots = override.slots || [];
      } else {
        const dayConfig = availability.find(a => a.dayOfWeek === dayOfWeek);
        if (dayConfig && dayConfig.slots) {
          daySlots = dayConfig.slots;
        } else if (dayConfig && dayConfig.startTime && dayConfig.endTime) { // Legacy fallback
          daySlots = [{ startTime: dayConfig.startTime, endTime: dayConfig.endTime }];
        }
      }

      // Generate 1-hour intervals for each slot block
      daySlots.forEach(slotBlock => {
        const [startHour, startMin] = slotBlock.startTime.split(':').map(Number);
        const [endHour, endMin] = slotBlock.endTime.split(':').map(Number);
        
        let currentSlotTime = new Date(currentDate);
        currentSlotTime.setHours(startHour, startMin, 0, 0);
        
        const endDayTime = new Date(currentDate);
        endDayTime.setHours(endHour, endMin, 0, 0);

        while (currentSlotTime < endDayTime) {
          const slotEndTime = new Date(currentSlotTime.getTime() + 60 * 60 * 1000);
          if (slotEndTime <= endDayTime) {
            // Only add if it's in the future
            if (currentSlotTime > new Date()) {
              slots.push({
                _id: `dynamic_${currentSlotTime.getTime()}`,
                startTime: new Date(currentSlotTime),
                endTime: slotEndTime,
                bookedDuration: 0
              });
            }
          }
          currentSlotTime = new Date(currentSlotTime.getTime() + 60 * 60 * 1000); // increment by 1 hour
        }
      });
    }

    // Now fetch existing sessions to compute bookedDuration
    const sessions = await MentorSession.find({
      mentor: req.params.mentorId,
      startTime: { $gte: today, $lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) },
      status: { $in: ['pending', 'confirmed', 'completed'] }
    });

    sessions.forEach(session => {
      // Find the slot that contains this session
      const matchingSlot = slots.find(s => 
        session.startTime >= s.startTime && session.startTime < s.endTime
      );
      if (matchingSlot) {
        matchingSlot.bookedDuration += session.durationMins;
      }
    });

    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch slots" });
  }
};

// The legacy route for fetch by ID is handled above, so no duplicate code is needed.

const Razorpay = require('razorpay');
const crypto = require('crypto');
const CreditHistory = require('../models/CreditHistory');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

exports.bookSession = async (req, res) => {
  try {
    const { mentorId, startTime, durationMins, paymentMethod, context } = req.body;
    
    if (durationMins !== 60) return res.status(400).json({ error: "Only 60 minute sessions are supported" });
    if (!mentorId || !startTime) return res.status(400).json({ error: "mentorId and startTime are required" });

    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.isMentor) return res.status(404).json({ error: "Mentor not found" });

    const sessionStart = new Date(startTime);
    const sessionEnd = new Date(sessionStart.getTime() + durationMins * 60 * 1000);

    // Verify it falls within a generated slot conceptually.
    // To simplify, we just check if there are overlapping sessions for this mentor that would exceed 60m per hour block,
    // but the simplest overlap check is: does any session overlap this exact time?
    const overlappingSession = await MentorSession.findOne({
      mentor: mentorId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { startTime: { $lt: sessionEnd }, $expr: { $gt: [{ $add: ["$startTime", { $multiply: ["$durationMins", 60000] }] }, sessionStart] } }
      ]
    });
    
    // Fallback simple overlap check if aggregation is tricky
    // Any session starting exactly at this time, OR starting 30m before if duration is 60m
    const allSessionsInHour = await MentorSession.find({
      mentor: mentorId,
      startTime: { 
        $gte: new Date(sessionStart.getTime() - 60 * 60 * 1000), 
        $lt: new Date(sessionStart.getTime() + 60 * 60 * 1000) 
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Check if total booked duration in the enclosing 1-hour block exceeds 60m
    // For a given start time (e.g. 9:00 or 9:30), we find the parent 1-hour block (9:00).
    const blockStart = new Date(sessionStart);
    blockStart.setMinutes(0, 0, 0);
    const blockEnd = new Date(blockStart.getTime() + 60 * 60 * 1000);

    let bookedInBlock = 0;
    allSessionsInHour.forEach(s => {
      // If session falls in this block
      if (s.startTime >= blockStart && s.startTime < blockEnd) {
        bookedInBlock += s.durationMins;
      }
    });

    if (bookedInBlock + durationMins > 60) {
      return res.status(400).json({ error: "Not enough time remaining in this slot" });
    }

    const rate = durationMins === 60 ? 1 : 0.5; // multiplier
    const amountRequired = paymentMethod === 'CREDITS' 
      ? Math.round(mentor.mentorProfile.rateCredits * rate)
      : Math.round(mentor.mentorProfile.rateINR * rate);

    if (!amountRequired) return res.status(400).json({ error: "Mentor has not set pricing" });

    // Handle CREDITS
    if (paymentMethod === 'CREDITS') {
      if (req.user.credits < amountRequired) {
        return res.status(400).json({ error: "Insufficient credits" });
      }
      
      // Deduct credits
      req.user.credits -= amountRequired;
      await req.user.save();
      
      await CreditHistory.create({
        user: req.user._id,
        amount: -amountRequired,
        reason: `Booked ${durationMins}m session with ${mentor.name}`
      });

      const session = new MentorSession({
        student: req.user._id,
        mentor: mentor._id,
        startTime: sessionStart,
        durationMins,
        context,
        status: 'confirmed',
        payment: { amount: amountRequired, currency: 'CREDITS', status: 'paid' },
        meetingLink: mentor.mentorProfile.meetingLink
      });

      await session.save();
      return res.status(201).json(session);
    }

    // Handle INR
    if (paymentMethod === 'INR') {
      const options = {
        amount: amountRequired * 100, // paise
        currency: "INR",
        receipt: `sess_${req.user._id.toString().slice(-6)}_${Date.now()}`
      };

      const order = await razorpay.orders.create(options);

      const session = new MentorSession({
        student: req.user._id,
        mentor: mentor._id,
        startTime: sessionStart,
        durationMins,
        context,
        payment: { amount: amountRequired, currency: 'INR', status: 'pending', transactionId: order.id },
        meetingLink: mentor.mentorProfile.meetingLink
      });
      await session.save();

      return res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, sessionId: session._id });
    }

    res.status(400).json({ error: "Invalid payment method" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Booking failed" });
  }
};

exports.verifySessionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId } = req.body;
    
    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      await MentorSession.findByIdAndUpdate(sessionId, { status: 'cancelled' });
      return res.status(400).json({ error: "Invalid signature" });
    }

    const session = await MentorSession.findById(sessionId);
    if (!session || session.status === 'confirmed') {
      return res.status(400).json({ error: "Session already confirmed or not found" });
    }

    session.status = 'confirmed';
    session.payment.status = 'paid';
    await session.save();

    const slot = await MentorSlot.findById(session.slot);
    if (slot) {
      slot.bookedDuration += session.durationMins;
      await slot.save();
    }

    res.json({ success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const isMentorView = req.query.role === 'mentor';
    
    let query = {};
    if (isMentorView) {
      if (!req.user.isMentor) return res.status(403).json({ error: "Not a mentor" });
      query.mentor = req.user._id;
    } else {
      query.student = req.user._id;
    }

    const sessions = await MentorSession.find(query)
      .populate('student', 'name email profilePicture')
      .populate('mentor', 'name email profilePicture mentorProfile')
      .sort({ startTime: 1 });
      
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};
