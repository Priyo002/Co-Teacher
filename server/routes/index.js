const { Router } = require("express");
const courseRoutes = require("./courses/courseRoutes");
const userRoutes = require("./user");

const router = Router();

router.use("/courses", courseRoutes);
router.use("/user", userRoutes);

module.exports = router;
