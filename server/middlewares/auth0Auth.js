async function verifyAuth0Token(req, res, next) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Auth0 access token is required" });
  }

  const token = authorization.slice(7);

  try {
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(401).json({ error: "Auth0 rejected the access token" });
    }

    req.auth0User = await response.json();
    return next();
  } catch {
    return res.status(401).json({ error: "Could not verify Auth0 login" });
  }
}

module.exports = { verifyAuth0Token };
