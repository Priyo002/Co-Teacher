const { Router } = require("express");
const courseRoutes = require("./courses/courseRoutes");

const router = Router();

// In a full implementation, you would add auth routes here
// router.use("/auth", authRoutes);

router.use("/courses", courseRoutes);

module.exports = router;
