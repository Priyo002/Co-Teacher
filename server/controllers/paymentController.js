const Razorpay = require('razorpay');
const crypto = require('crypto');

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
      return res.status(400).json({ error: "Transaction not legit!" });
    }

    // Give credits to user
    const { credits } = PACKAGES[packageId];
    
    req.user.credits += credits;
    await req.user.save();

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
