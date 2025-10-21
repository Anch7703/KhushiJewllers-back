const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    // 1️⃣ Check session first (passport session)
    if (req.isAuthenticated && req.isAuthenticated()) {
      req.user = {
        id: req.user._id,
        email: req.user.email || "",
        name: req.user.name || "",
        role: req.user.role || "customer",
      };
      return next();
    }

    // 2️⃣ Fallback to JWT auth
    let token = req.headers["authorization"]?.split(" ")[1];
    if (!token && req.query.token) token = req.query.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email || "",
      name: decoded.name || "",
      role: decoded.role || "customer",
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
