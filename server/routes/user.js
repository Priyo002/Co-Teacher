const express = require("express");
const multer = require("multer");
const { toggleBookmark, getBookmarks, checkBookmark, getProfile, updateProfile, sendOtp, verifyOtp, getCreditHistory, getCertificates, uploadProfilePicture } = require("../controllers/userController");
const { verifyAuth0Token } = require("../middlewares/auth0Auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyAuth0Token);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/profile/picture", upload.single("image"), uploadProfilePicture);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.get("/credit-history", getCreditHistory);

router.get("/bookmarks", getBookmarks);
router.get("/bookmarks/:lessonId", checkBookmark);
router.post("/bookmarks/:lessonId", toggleBookmark);

router.get("/certificates", getCertificates);

module.exports = router;
