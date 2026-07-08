const express = require("express");
const { getLeaderboard } = require("../controllers/leaderboardController");
const { verifyAuth0Token } = require("../middlewares/auth0Auth");

const router = express.Router();

router.use(verifyAuth0Token);

router.get("/", getLeaderboard);

module.exports = router;
