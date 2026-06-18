require('dotenv').config();
const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');

async function checkCert() {
  await mongoose.connect(process.env.MONGO_URI);
  const cert = await Certificate.findOne({ certificateId: '24bc6e3d-af5f-4fc4-b4c5-9ac540ae633c' });
  console.log("Found Certificate:", cert);
  process.exit(0);
}

checkCert();
