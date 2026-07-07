const express = require("express");
const { toggleBookmark, getBookmarks, checkBookmark, getProfile, updateProfile } = require("../controllers/userController");
const { verifyAuth0Token } = require("../middlewares/auth0Auth");

const router = express.Router();

router.use(verifyAuth0Token);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.get("/bookmarks", getBookmarks);
router.get("/bookmarks/:lessonId", checkBookmark);
router.post("/bookmarks/:lessonId", toggleBookmark);

module.exports = router;
