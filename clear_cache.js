const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./server/models/User');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.updateMany({}, { 
    $set: { cachedCourseSuggestions: [] },
    $unset: { lastSuggestionsGeneratedAt: "" }
  });
  console.log("Cleared cached suggestions for all users!");
  process.exit(0);
}

fix();
