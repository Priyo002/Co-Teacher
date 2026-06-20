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
      try {
        auth0Profile = await cached.profilePromise;
      } catch (err) {
        tokenCache.delete(token);
        throw err;
      }
    } else {
      const fetchPromise = fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Auth0 rejected the access token");
        }
        return response.json();
      });

      let expiresAt = Date.now() + 5 * 60 * 1000; // fallback 5 mins
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.exp) {
          expiresAt = payload.exp * 1000;
        }
      } catch (e) {
        // ignore decoding errors, use fallback
      }

      tokenCache.set(token, { profilePromise: fetchPromise, expiresAt });

      try {
        auth0Profile = await fetchPromise;
      } catch (err) {
        tokenCache.delete(token);
        throw err;
      }
    }

    
    // Find or create user in MongoDB (upsert to prevent race conditions on concurrent requests)
    let user = await User.findOneAndUpdate(
      { email: auth0Profile.email },
      {
        $setOnInsert: {
          name: auth0Profile.name || auth0Profile.nickname || "Learner",
          authProviderId: auth0Profile.sub,
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    req.auth0User = auth0Profile;
    req.user = user; // Attach mongoose document for controllers
    return next();
  } catch (err) {
    console.error("Auth0 Verification Error:", err);
    return res.status(401).json({ error: "Could not verify Auth0 login" });
  }
}

module.exports = { verifyAuth0Token };
