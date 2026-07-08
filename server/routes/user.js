const express = require("express");
const { toggleBookmark, getBookmarks, checkBookmark, getProfile, updateProfile, sendOtp, verifyOtp, getCreditHistory, getCertificates } = require("../controllers/userController");
const { verifyAuth0Token } = require("../middlewares/auth0Auth");

const router = express.Router();

router.use(verifyAuth0Token);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.get("/credit-history", getCreditHistory);

router.get("/bookmarks", getBookmarks);
router.get("/bookmarks/:lessonId", checkBookmark);
router.post("/bookmarks/:lessonId", toggleBookmark);

router.get("/certificates", getCertificates);

module.exports = router;
