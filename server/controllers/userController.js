const User = require("../models/User");
const Lesson = require("../models/Lesson");

async function toggleBookmark(req, res) {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    // Verify the lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if it's already bookmarked
    const isBookmarked = user.bookmarkedLessons.includes(lessonId);

    if (isBookmarked) {
      // Remove it
      user.bookmarkedLessons = user.bookmarkedLessons.filter(id => id.toString() !== lessonId);
    } else {
      // Add it
      user.bookmarkedLessons.push(lessonId);
    }

    await user.save();

    return res.json({ 
      isBookmarked: !isBookmarked,
      message: isBookmarked ? "Lesson removed from bookmarks" : "Lesson bookmarked successfully" 
    });
  } catch (error) {
    console.error("Toggle Bookmark Error:", error);
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
}

async function getBookmarks(req, res) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "bookmarkedLessons",
      select: "title description language isEnriched module", // Select fields we need
      populate: {
        path: "module",
        select: "title course",
        populate: {
          path: "course",
          select: "title description"
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter out any orphaned bookmarks (e.g. if a lesson was deleted)
    const validBookmarks = user.bookmarkedLessons.filter(lesson => lesson !== null);
    
    // If we cleaned up orphans, save the user
    if (validBookmarks.length !== user.bookmarkedLessons.length) {
      user.bookmarkedLessons = validBookmarks.map(l => l._id);
      await user.save();
    }

    return res.json({ bookmarks: validBookmarks });
  } catch (error) {
    console.error("Get Bookmarks Error:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
}

async function checkBookmark(req, res) {
  try {
    const { lessonId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isBookmarked = user.bookmarkedLessons.includes(lessonId);
    return res.json({ isBookmarked });
  } catch (error) {
    console.error("Check Bookmark Error:", error);
    res.status(500).json({ error: "Failed to check bookmark status" });
  }
}

module.exports = {
  toggleBookmark,
  getBookmarks,
  checkBookmark
};
