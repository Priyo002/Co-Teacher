const express = require('express');
const router = express.Router();
const { verifyAuth0Token } = require('../middlewares/auth0Auth');
const mentorController = require('../controllers/mentorController');

// --- Public Auth Callback ---
router.get('/auth/google/callback', mentorController.googleAuthCallback);

// All mentor routes below require authentication
router.use(verifyAuth0Token);

// --- Admin ---
router.post('/admin/approve', mentorController.approveMentor);
router.get('/admin/applications', mentorController.getApplications);
router.get('/admin/users', mentorController.getAllUsers);

// --- Applications ---
router.post('/apply', mentorController.applyToMentor);

// --- Profile & Discovery ---
router.get('/', mentorController.getMentors);
router.get('/profile/details', mentorController.getMentorProfileDetails);
router.put('/profile', mentorController.updateMentorProfile);

// --- Auth & Google Calendar ---
router.get('/auth/google/connect', mentorController.connectGoogleCalendar);

// --- Scheduling & Bookings ---
router.get('/sessions', mentorController.getMySessions);
router.post('/sessions/book', mentorController.bookSession);
router.put('/sessions/:id/reschedule', mentorController.rescheduleSession);
router.post('/sessions/verify-payment', mentorController.verifySessionPayment);

// --- Scheduling ---
router.post('/slots', mentorController.createSlot);
router.get('/:mentorId/slots', mentorController.getMentorSlots);

module.exports = router;
