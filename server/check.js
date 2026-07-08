const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./models/User');
  const users = await User.find().sort({ updatedAt: -1 }).limit(1);
  if (users.length > 0) {
    console.log("Latest user:", users[0].email);
    console.log("profilePicture:", users[0].profilePicture);
  }
  process.exit(0);
}
check();
