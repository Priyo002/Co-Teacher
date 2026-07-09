const express = require('express');
const router = express.Router();
const { verifyAuth0Token } = require('../middlewares/auth0Auth');
const mentorController = require('../controllers/mentorController');

// All mentor routes require authentication
router.use(verifyAuth0Token);

// --- Admin ---
router.post('/admin/approve', mentorController.approveMentor);
router.get('/admin/applications', mentorController.getApplications);
router.get('/admin/users', mentorController.getAllUsers);

// --- Applications ---
router.post('/apply', mentorController.applyToMentor);

// --- Profile & Discovery ---
router.get('/', mentorController.getMentors);
router.put('/profile', mentorController.updateMentorProfile);

// --- Scheduling ---
router.post('/slots', mentorController.createSlot);
router.get('/:mentorId/slots', mentorController.getMentorSlots);

// --- Booking ---
router.post('/book', mentorController.bookSession);
router.post('/verify', mentorController.verifySessionPayment);
router.get('/sessions', mentorController.getMySessions);

module.exports = router;
