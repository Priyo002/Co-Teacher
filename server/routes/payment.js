const express = require('express');
const router = express.Router();
const { verifyAuth0Token } = require('../middlewares/auth0Auth');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

router.use(verifyAuth0Token);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;
