const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const passport = require("passport");

const router = express.Router();

// Helper: create JWT
const createToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

// ======================
// LOCAL SIGNUP
// ======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email and password required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // ENSURE hashing here

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    const token = createToken(newUser);

    res.status(201).json({ token, name: newUser.name, email: newUser.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ======================
// LOCAL LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password); // Explicit compare
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = createToken(user);

    res.status(200).json({ token, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ======================
// GOOGLE AUTH
// ======================
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  async (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const redirectURL = `${process.env.CLIENT_URL || "http://localhost:5173"}?token=${token}`;
    res.redirect(redirectURL);
  }
);


// ======================
// LOGOUT
// ======================
router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;

