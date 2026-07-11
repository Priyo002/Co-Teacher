const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { google } = require('googleapis');
dotenv.config();

const MentorSession = require('../models/MentorSession');
const User = require('../models/User');

const getOauth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/mentors/auth/google/callback` : 'http://localhost:5001/api/mentors/auth/google/callback'
  );
};

const generateGoogleMeetLink = async (mentor, session) => {
  try {
    const oauth2Client = getOauth2Client();
    oauth2Client.setCredentials({ refresh_token: mentor.mentorProfile.googleRefreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: `Co-Teacher Mentorship Session`,
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
    return null;
  }
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const sessions = await MentorSession.find({ meetingLink: { $in: [null, ""] } }).populate('mentor');
  console.log(`Found ${sessions.length} sessions without meeting links`);

  for (const session of sessions) {
    if (session.mentor && session.mentor.mentorProfile && session.mentor.mentorProfile.googleRefreshToken) {
      console.log(`Generating link for session ${session._id}...`);
      const link = await generateGoogleMeetLink(session.mentor, session);
      if (link) {
        session.meetingLink = link;
        await session.save();
        console.log(`Successfully generated link: ${link}`);
      } else {
        console.log(`Failed to generate link for session ${session._id}`);
      }
    } else {
      console.log(`Mentor for session ${session._id} does not have Google Calendar connected. Skipping.`);
    }
  }

  console.log('Done!');
  process.exit(0);
};

run().catch(console.error);
