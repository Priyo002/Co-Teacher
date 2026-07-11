const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MentorSession = require('../models/MentorSession');

async function cleanPending() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await MentorSession.deleteMany({ status: 'pending' });
    console.log(`Deleted ${result.deletedCount} pending sessions.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
cleanPending();
