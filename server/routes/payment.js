const express = require('express');
const router = express.Router();
const { verifyAuth0Token } = require('../middlewares/auth0Auth');
const { createOrder, verifyPayment, getUserTransactions } = require('../controllers/paymentController');

router.use(verifyAuth0Token);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/transactions', getUserTransactions);

module.exports = router;
