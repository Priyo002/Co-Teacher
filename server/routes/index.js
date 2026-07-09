const { Router } = require("express");
const courseRoutes = require("./courses/courseRoutes");
const userRoutes = require("./user");
const certificateRoutes = require("./certificates");
const leaderboardRoutes = require("./leaderboard");
const mentorRoutes = require("./mentorRoutes");

const router = Router();

router.use("/courses", courseRoutes);
router.use("/user", userRoutes);
router.use("/certificates", certificateRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/mentors", mentorRoutes);

module.exports = router;
