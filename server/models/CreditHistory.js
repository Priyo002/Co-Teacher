const mongoose = require("mongoose");

const creditHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true, // e.g. +100 or -100
  },
  reason: {
    type: String,
    required: true, // e.g. "Generated Course", "Purchased Credits"
  },
}, { timestamps: true });

module.exports = mongoose.model("CreditHistory", creditHistorySchema);
