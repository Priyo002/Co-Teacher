const { Router } = require("express");
const courseRoutes = require("./courses/courseRoutes");
const userRoutes = require("./user");
const certificateRoutes = require("./certificates");
const leaderboardRoutes = require("./leaderboard");
const mentorRoutes = require("./mentorRoutes");
const focusRoutes = require("./focus");
const pathRoutes = require("./paths/pathRoutes");
const executeRoutes = require("./execute");

const router = Router();

router.use("/courses", courseRoutes);
router.use("/user", userRoutes);
router.use("/certificates", certificateRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/mentors", mentorRoutes);
router.use("/focus", focusRoutes);
router.use("/paths", pathRoutes);
router.use("/execute", executeRoutes);

module.exports = router;
