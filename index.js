require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const wishlistRoutes = require("./routes/wishlist");


require("./config/passport"); // passport config

const app = express();
// serve images located in front/public/images/products
app.use("/images/products", express.static(path.join(__dirname, "../front/public/images/products")));



// debug helper (temporary) to display the exact file path being requested
app.get("/debug-image/:name", (req, res) => {
  const filePath = path.join(__dirname, "front", "public", "images", "products", req.params.name);
  console.log("DEBUG trying to send file:", filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("sendFile error:", err);
      return res.status(404).send("not found: " + filePath);
    }
  });
});

app.use(express.static(path.join(__dirname, "dist")));

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Optional session (only needed if using Passport sessions)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 hours
  })
);


app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);


// Route to check logged-in user
app.get("/api/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});
// Root
app.get("/", (req, res) => res.send("Jewelry store backend is running..."));

// Google OAuth
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect("http://localhost:5173/")
);
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Error handler (after routes)
app.use(require("./middleware/errorHandler"));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .then(() => app.listen(5000, () => console.log("🚀 Server running on port 5000")))
  .catch((err) => console.error("❌ DB connection error:", err));

