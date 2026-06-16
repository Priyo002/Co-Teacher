const User = require("../models/User");

const tokenCache = new Map();

async function verifyAuth0Token(req, res, next) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Auth0 access token is required" });
  }

  const token = authorization.slice(7);

  try {
    let auth0Profile;
    const cached = tokenCache.get(token);
    
    if (cached && cached.expiresAt > Date.now()) {
      auth0Profile = cached.profile;
    } else {
      const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        return res.status(401).json({ error: "Auth0 rejected the access token" });
      }

      auth0Profile = await response.json();
      // Cache for 5 minutes to avoid rate limits
      tokenCache.set(token, { profile: auth0Profile, expiresAt: Date.now() + 5 * 60 * 1000 });
    }

    
    // Find or create user in MongoDB
    let user = await User.findOne({ email: auth0Profile.email });
    if (!user) {
      user = await User.create({
        name: auth0Profile.name || auth0Profile.nickname || "Learner",
        email: auth0Profile.email,
        authProviderId: auth0Profile.sub, // The Auth0 user ID
      });
    }

    req.auth0User = auth0Profile;
    req.user = user; // Attach mongoose document for controllers
    return next();
  } catch (err) {
    console.error("Auth0 Verification Error:", err);
    return res.status(401).json({ error: "Could not verify Auth0 login" });
  }
}

module.exports = { verifyAuth0Token };
