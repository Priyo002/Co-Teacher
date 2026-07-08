const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({})
      .select('name globalScore totalTestsTaken createdAt profilePicture')
      .sort({ globalScore: -1, createdAt: 1 })
      .limit(50);

    // Get current user's rank if not in top 50
    let currentUserRank = null;
    let currentUserScore = req.user.globalScore || 0;
    
    const inTop50 = topUsers.some(u => u._id.toString() === req.user._id.toString());
    if (!inTop50) {
      const higherScoringUsers = await User.countDocuments({
        globalScore: { $gt: currentUserScore }
      });
      // Handle ties for 0 score by just adding count of users with same score?
      // For simplicity, just rank them below everyone with higher score.
      currentUserRank = higherScoringUsers + 1;
    }

    res.json({
      success: true,
      leaderboard: topUsers,
      currentUserRank,
      currentUserScore
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
