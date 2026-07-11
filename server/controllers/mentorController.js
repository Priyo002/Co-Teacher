const User = require('../models/User');
const MentorApplication = require('../models/MentorApplication');
const MentorSlot = require('../models/MentorSlot');
const MentorSession = require('../models/MentorSession');
const { sendEmail } = require('../services/emailService');

const sendSessionScheduledEmails = async (student, mentor, session) => {
  if (!student.email || !mentor.email) return;
  const timeStr = new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2>Mentorship Session Scheduled!</h2>
      <p>A 60-minute mentorship session has been confirmed.</p>
      <p><strong>Time:</strong> ${timeStr} (IST)</p>
      <p><strong>Meeting Link:</strong> <a href="${session.meetingLink}">${session.meetingLink}</a></p>
      <p><strong>Context:</strong> ${session.context || 'N/A'}</p>
    </div>
  `;
  await sendEmail({ to: student.email, subject: `Session Scheduled with ${mentor.name}`, html: htmlContent });
  await sendEmail({ to: mentor.email, subject: `Session Scheduled with ${student.name}`, html: htmlContent });
};

const sendSessionRescheduledEmails = async (student, mentor, session) => {
  if (!student.email || !mentor.email) return;
  const timeStr = new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2>Mentorship Session Rescheduled</h2>
      <p>Your mentorship session has been rescheduled.</p>
      <p><strong>New Time:</strong> ${timeStr} (IST)</p>
      <p><strong>Meeting Link:</strong> <a href="${session.meetingLink}">${session.meetingLink}</a></p>
    </div>
  `;
  await sendEmail({ to: student.email, subject: `Session Rescheduled with ${mentor.name}`, html: htmlContent });
  await sendEmail({ to: mentor.email, subject: `Session Rescheduled with ${student.name}`, html: htmlContent });
};

// --- ADMIN / APPLICATION ---

exports.getApplicationStatus = async (req, res) => {
  try {
    const app = await MentorApplication.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!app) {
      return res.json({ status: 'none' });
    }
    return res.json({ status: app.status, updatedAt: app.updatedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch application status" });
  }
};

exports.applyToMentor = async (req, res) => {
  try {
    const { 
      jobTitle, company, location, languages, experienceYears, targetAudience, domains, skills,
      linkedinUrl, portfolioUrl, proofOfWork 
    } = req.body;

    if (!jobTitle || !company || !location || !languages || !experienceYears || !targetAudience || !domains || !skills) {
      return res.status(400).json({ error: "Please fill out all required fields" });
    }

    if (req.user.isMentor) {
      return res.status(400).json({ error: "You are already an approved mentor" });
    }

    const existingApp = await MentorApplication.findOne({ user: req.user._id, status: 'pending' });
    if (existingApp) {
      return res.status(400).json({ error: "You already have a pending application" });
    }

    const lastRejectedApp = await MentorApplication.findOne({ user: req.user._id, status: 'rejected' }).sort({ createdAt: -1 });
    if (lastRejectedApp) {
      const cooldownDays = 30;
      const daysSinceRejection = (Date.now() - new Date(lastRejectedApp.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRejection < cooldownDays) {
        return res.status(400).json({ error: `You must wait ${Math.ceil(cooldownDays - daysSinceRejection)} more days before re-applying.` });
      }
    }

    const application = new MentorApplication({
      user: req.user._id,
      jobTitle,
      company,
      location,
      languages,
      experienceYears,
      targetAudience,
      domains,
      skills,
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
    const app = await MentorApplication.findById(applicationId).populate('user');
    
    if (!app) return res.status(404).json({ error: "Application not found" });

    app.status = status;
    await app.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(app.user._id, {
        isMentor: true,
        $set: {
          'mentorProfile.jobTitle': app.jobTitle,
          'mentorProfile.company': app.company,
          'mentorProfile.location': app.location,
          'mentorProfile.languages': app.languages,
          'mentorProfile.experienceYears': app.experienceYears,
          'mentorProfile.targetAudience': app.targetAudience,
          'mentorProfile.domains': app.domains,
          'mentorProfile.skills': app.skills,
          'mentorProfile.linkedinUrl': app.linkedinUrl,
          'mentorProfile.portfolioUrl': app.portfolioUrl,
          'mentorProfile.proofOfWork': app.proofOfWork,
          'mentorProfile.rateINR': 500,
          'mentorProfile.bio': `Hi! I'm a ${app.jobTitle} at ${app.company} with ${app.experienceYears}+ years of experience. I specialize in ${app.domains.join(', ')}.`
        }
      });
      
      await sendEmail({
        to: app.user.email,
        subject: "🎉 You are now a Co-Teacher Mentor!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2>Congratulations, ${app.user.name}!</h2>
            <p>Your mentor application has been approved. You are now officially a Co-Teacher Mentor.</p>
            <p>You can now go to your Mentor Dashboard, connect your Google Calendar, and start setting up your availability slots so students can book you.</p>
            <p>Welcome to the team!</p>
          </div>
        `
      });
    } else if (status === 'rejected') {
      await sendEmail({
        to: app.user.email,
        subject: "Update on your Co-Teacher Mentor Application",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2>Hi ${app.user.name},</h2>
            <p>Thank you for applying to be a mentor on Co-Teacher.</p>
            <p>Unfortunately, after careful review, we are unable to accept your application at this time. We receive many applications and have to make tough decisions.</p>
            <p>You are welcome to gain some more experience and apply again in the future.</p>
          </div>
        `
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

    const { 
      bio, rateINR, meetingLink, upiId, bankDetails, availability, dateOverrides,
      jobTitle, company, location, languages, domains, skills, targetAudience, 
      experienceYears, linkedinUrl, portfolioUrl, proofOfWork
    } = req.body;
    
    const updateData = {};
    if (bio !== undefined) updateData['mentorProfile.bio'] = bio;
    if (rateINR !== undefined) updateData['mentorProfile.rateINR'] = rateINR;
    if (meetingLink !== undefined) updateData['mentorProfile.meetingLink'] = meetingLink;
    if (upiId !== undefined) updateData['mentorProfile.upiId'] = upiId;
    if (bankDetails !== undefined) updateData['mentorProfile.bankDetails'] = bankDetails;
    if (availability !== undefined) updateData['mentorProfile.availability'] = availability;
    if (dateOverrides !== undefined) updateData['mentorProfile.dateOverrides'] = dateOverrides;
    
    if (jobTitle !== undefined) updateData['mentorProfile.jobTitle'] = jobTitle;
    if (company !== undefined) updateData['mentorProfile.company'] = company;
    if (location !== undefined) updateData['mentorProfile.location'] = location;
    if (languages !== undefined) updateData['mentorProfile.languages'] = languages;
    if (domains !== undefined) updateData['mentorProfile.domains'] = domains;
    if (skills !== undefined) updateData['mentorProfile.skills'] = skills;
    if (targetAudience !== undefined) updateData['mentorProfile.targetAudience'] = targetAudience;
    if (experienceYears !== undefined) updateData['mentorProfile.experienceYears'] = experienceYears;
    if (linkedinUrl !== undefined) updateData['mentorProfile.linkedinUrl'] = linkedinUrl;
    if (portfolioUrl !== undefined) updateData['mentorProfile.portfolioUrl'] = portfolioUrl;
    if (proofOfWork !== undefined) updateData['mentorProfile.proofOfWork'] = proofOfWork;

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
    
    // Generate dates for the next 14 days based on IST
    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

    for (let i = 0; i < 14; i++) {
      const targetIST = new Date(istTime.getTime() + i * 24 * 60 * 60 * 1000);
      const year = targetIST.getUTCFullYear();
      const month = String(targetIST.getUTCMonth() + 1).padStart(2, '0');
      const date = String(targetIST.getUTCDate()).padStart(2, '0');
      
      const dateString = `${year}-${month}-${date}`;
      const dayOfWeek = targetIST.getUTCDay();
      
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
        
        let currentSlotTime = new Date(`${dateString}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00+05:30`);
        const endDayTime = new Date(`${dateString}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00+05:30`);

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
    // We ignore pending sessions older than 5 minutes (assume payment abandoned)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessions = await MentorSession.find({
      mentor: req.params.mentorId,
      startTime: { $gte: today, $lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) },
      $or: [
        { status: { $in: ['confirmed', 'completed'] } },
        { status: 'pending', createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } }
      ]
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
      $or: [
        { status: { $in: ['confirmed', 'completed'] } },
        { status: 'pending', createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } }
      ]
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

    const profile = mentor.mentorProfile || {};
    const baseRate = profile.rateINR !== undefined ? profile.rateINR : 500;
    const rate = durationMins === 60 ? 1 : 0.5; // multiplier
    const amountRequired = Math.round(baseRate * rate);

    if (amountRequired === 0) {
      // Free session! Bypass Razorpay entirely.
      const session = new MentorSession({
        student: req.user._id,
        mentor: mentor._id,
        startTime: sessionStart,
        durationMins,
        context,
        status: 'confirmed', // immediately confirm
        payment: { amount: 0, currency: 'INR', status: 'paid' }
      });
      session.meetingLink = await generateGoogleMeetLink(mentor, session, req.user.name);
      await session.save();
      
      // Send emails
      await sendSessionScheduledEmails(req.user, mentor, session);
      
      return res.json({ freeSession: true, sessionId: session._id });
    }

    // Handle INR payment via Razorpay

    // Handle INR
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
      payment: { amount: amountRequired, currency: 'INR', status: 'pending', transactionId: order.id }
    });
    await session.save();

    return res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, sessionId: session._id });
  } catch (err) {
    console.error(err);
    console.error("Razorpay Error:", err);
    const errorMsg = err.error?.description || err.message || JSON.stringify(err);
    res.status(500).json({ error: "Booking failed: " + errorMsg });
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

    const session = await MentorSession.findById(sessionId).populate('student', 'name email').populate('mentor', 'name email');
    if (!session || session.status === 'confirmed') {
      return res.status(400).json({ error: "Session already confirmed or not found" });
    }

    session.status = 'confirmed';
    session.payment.status = 'paid';
    if (!session.meetingLink) {
      const mentor = await User.findById(session.mentor);
      session.meetingLink = await generateGoogleMeetLink(mentor, session, session.student?.name);
    }
    await session.save();

    const slot = await MentorSlot.findById(session.slot);
    if (slot) {
      slot.bookedDuration += session.durationMins;
      await slot.save();
    }

    // Send emails
    await sendSessionScheduledEmails(session.student, session.mentor, session);

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
      
    require('fs').appendFileSync('debug.log', `[getMySessions] req.user._id=${req.user._id} Found ${sessions.length} sessions\n`);
    res.json(sessions);
  } catch (err) {
    require('fs').appendFileSync('debug.log', `[getMySessions] Error: ${err.message}\n`);
    console.error('[getMySessions] Error:', err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};

exports.getMentorProfileDetails = async (req, res) => {
  try {
    if (!req.user || !req.user.isMentor) {
      return res.status(403).json({ error: "Not a mentor" });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.mentorProfile || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile details" });
  }
};

// --- Google Calendar Integration ---

const { google } = require('googleapis');

const getOauth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/mentors/auth/google/callback` : 'http://localhost:5001/api/mentors/auth/google/callback'
  );
};

const generateGoogleMeetLink = async (mentor, session, studentName = null) => {
  if (process.env.NODE_ENV === 'development' && !process.env.GOOGLE_CLIENT_ID) {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const chunk = (len) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${chunk(3)}-${chunk(4)}-${chunk(3)}`;
  }

  try {
    const oauth2Client = getOauth2Client();
    oauth2Client.setCredentials({ refresh_token: mentor.mentorProfile.googleRefreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const summary = studentName ? `Mentorship: ${studentName} & ${mentor.name}` : `Co-Teacher Mentorship Session`;

    const event = {
      summary: summary,
      description: `Mentorship session via Co-Teacher.\nContext: ${session.context || 'N/A'}`,
      start: { dateTime: session.startTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: new Date(session.startTime.getTime() + session.durationMins * 60000).toISOString(), timeZone: 'UTC' },
      conferenceData: {
        createRequest: {
          requestId: session._id.toString(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1
    });

    return res.data.hangoutLink;
  } catch (err) {
    console.error("Failed to create Google Calendar event:", err);
    return mentor.mentorProfile?.meetingLink || 'https://meet.google.com/fallback-link';
  }
};

exports.connectGoogleCalendar = async (req, res) => {
  try {
    const oauth2Client = getOauth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force to get refresh token
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: req.user._id.toString()
    });
    res.json({ url });
  } catch (err) {
    console.error("Google Auth Connect Error:", err);
    res.status(500).json({ error: "Failed to generate Google Calendar auth URL" });
  }
};

exports.googleAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect('http://localhost:5173/mentor-dashboard?error=missing_params');
    }

    const oauth2Client = getOauth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(state, {
        $set: { 'mentorProfile.googleRefreshToken': tokens.refresh_token }
      });
    }

    // Redirect back to frontend
    res.redirect('http://localhost:5173/mentor-dashboard?calendar_connected=true');
  } catch (err) {
    console.error("Google Auth Callback Error:", err);
    res.redirect('http://localhost:5173/mentor-dashboard?error=auth_failed');
  }
};

exports.rescheduleSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStartTime } = req.body;
    
    if (!newStartTime) return res.status(400).json({ error: "newStartTime is required" });

    const session = await MentorSession.findById(id).populate('student', 'name email').populate('mentor', 'name email');
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Verify ownership
    if (session.student._id.toString() !== req.user._id.toString() && session.mentor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to reschedule this session" });
    }
    
    session.startTime = new Date(newStartTime);
    await session.save();

    // Send emails
    await sendSessionRescheduledEmails(session.student, session.mentor, session);

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: "Reschedule failed: " + err.message });
  }
};

exports.getMentorProfileDetails = async (req, res) => {
  try {
    if (!req.user || !req.user.isMentor) {
      return res.status(403).json({ error: "Not a mentor" });
    }
    res.json({ mentorProfile: req.user.mentorProfile });
  } catch (err) {
    console.error('[getMentorProfileDetails] Error:', err);
    res.status(500).json({ error: "Failed to fetch profile details" });
  }
};
