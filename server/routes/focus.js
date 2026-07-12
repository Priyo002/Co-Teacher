const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FocusSession = require('../models/FocusSession');
const { verifyAuth0Token } = require('../middlewares/auth0Auth');

// POST /api/focus
// Create a new focus session log
router.post('/', verifyAuth0Token, async (req, res) => {
  try {
    const { 
      courseId, 
      lessonId, 
      courseTitle, 
      lessonTitle, 
      startTime, 
      endTime, 
      duration, 
      averageScore, 
      nudgeCount, 
      dataPoints 
    } = req.body;

    const sessionData = {
      user: req.user._id,
      courseTitle,
      lessonTitle,
      startTime: startTime ? new Date(startTime) : Date.now(),
      endTime: endTime ? new Date(endTime) : Date.now(),
      duration: duration || 0,
      averageScore: averageScore || 0,
      nudgeCount: nudgeCount || 0,
      dataPoints: dataPoints || []
    };

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      sessionData.courseId = courseId;
    }
    if (lessonId) {
      sessionData.lessonId = lessonId;
    }

    const session = await FocusSession.create(sessionData);

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error("Error saving focus session:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/focus/me
// Get focus sessions for the logged-in user
router.get('/me', verifyAuth0Token, async (req, res) => {
  try {
    const sessions = await FocusSession.find({ user: req.user._id })
      .sort({ startTime: -1 })
      .limit(100); // limit to recent 100 for now

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error("Error fetching focus sessions:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
