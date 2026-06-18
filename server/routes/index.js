const { Router } = require("express");
const courseRoutes = require("./courses/courseRoutes");
const userRoutes = require("./user");
const certificateRoutes = require("./certificates");

const router = Router();

router.use("/courses", courseRoutes);
router.use("/user", userRoutes);
router.use("/certificates", certificateRoutes);

module.exports = router;
