require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const wishlistRoutes = require("./routes/wishlist");

require("./config/passport"); // Passport setup

const app = express();

// ✅ Allowed origins (your frontend + local dev)
const allowedOrigins = [
  "http://localhost:5173",
  "https://khushijewellers-front.onrender.com",
  "https://khushijewellers.co.in",
  "https://www.khushijewellers.co.in",
];


// ✅ CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// ✅ Express middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session setup with MongoStore
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 2,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  })
);

// ✅ Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Static image serving
app.use(
  "/images/products",
  express.static(path.join(__dirname, "public/images/products"))
);

// ✅ API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);

// ✅ Logged-in user check
app.get("/api/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// ✅ Google OAuth
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect(process.env.CLIENT_URL || "http://localhost:5173/")
);

// ✅ Error handler middleware
app.use(require("./middleware/errorHandler"));

// ✅ Serve frontend build in production

// ✅ MongoDB connection + start
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ DB connection error:", err));

console.log("Environment:", process.env.NODE_ENV);
console.log(
  "Callback URL:",
  process.env.NODE_ENV === "production"
    ? "https://khushijewellers.co.in/api/auth/google/callback"
    : "http://localhost:5000/api/auth/google/callback"
);
