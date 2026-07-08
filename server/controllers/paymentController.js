const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const CreditHistory = require('../models/CreditHistory');
const { sendEmail } = require('../services/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

// Options map to keep pricing logic secure on the backend
const PACKAGES = {
  'basic': { amount: 50, credits: 100 },
  'pro': { amount: 200, credits: 500 },
  'ultra': { amount: 500, credits: 1500 },
};

exports.createOrder = async (req, res) => {
  try {
    const { packageId } = req.body;
    
    if (!PACKAGES[packageId]) {
      return res.status(400).json({ error: "Invalid package selected" });
    }

    const { amount, credits } = PACKAGES[packageId];

    const options = {
      amount: amount * 100, // Razorpay works in paise (1 INR = 100 paise)
      currency: "INR",
      receipt: `rcpt_${req.user._id.toString().slice(-6)}_${Date.now()}`,
      notes: {
        packageId,
        credits,
        userId: req.user._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);
    
    // Log pending transaction
    await Transaction.create({
      userId: req.user._id,
      razorpay_order_id: order.id,
      amount: amount,
      currency: order.currency,
      packageId: packageId,
      creditsAdded: credits,
      status: "pending"
    });
    
    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      packageDetails: PACKAGES[packageId]
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ error: error.message || "Failed to create payment order" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

    // Verify signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      // Mark transaction as failed
      await Transaction.findOneAndUpdate(
        { razorpay_order_id },
        { status: "failed", razorpay_payment_id }
      );
      return res.status(400).json({ error: "Transaction not legit!" });
    }

    // Verify if it's already processed to prevent double-crediting
    const transaction = await Transaction.findOne({ razorpay_order_id });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction record not found" });
    }
    if (transaction.status === "success") {
      return res.json({ success: true, message: "Payment already verified", newBalance: req.user.credits });
    }

    // Give credits to user
    const { credits } = PACKAGES[packageId];
    
    req.user.credits += credits;
    req.user.lowCreditEmailSent = false;
    await req.user.save();

    await CreditHistory.create({
      user: req.user._id,
      amount: credits,
      reason: `Purchased ${packageId.toUpperCase()} Package`
    });

    // Mark transaction as success
    transaction.status = "success";
    transaction.razorpay_payment_id = razorpay_payment_id;
    await transaction.save();

    // Send Receipt Email
    if (req.user.email) {
      sendEmail({
        to: req.user.email,
        subject: "Payment Receipt - Co-Teacher Credits",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #4F46E5;">Payment Successful!</h1>
            <p>Hi ${req.user.name || 'Student'},</p>
            <p>We successfully received your payment for the <strong>${packageId.toUpperCase()}</strong> plan.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0;">Receipt Details:</h3>
              <p><strong>Amount Paid:</strong> ₹${PACKAGES[packageId].amount}</p>
              <p><strong>Credits Added:</strong> +${credits} Credits</p>
              <p><strong>Order ID:</strong> ${razorpay_order_id}</p>
            </div>
            <p>Your new balance is <strong>${req.user.credits} credits</strong>.</p>
            <br/>
            <p>Thank you for learning with us!<br/>The Co-Teacher Team</p>
          </div>
        `
      });
    }

    res.json({ 
      success: true, 
      message: "Payment verified successfully", 
      newBalance: req.user.credits 
    });

  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ transactions });
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
