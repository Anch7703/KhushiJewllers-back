require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const wishlistRoutes = require("./routes/wishlist");
require("./config/passport");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS (you can remove this entirely once merged)
app.use(
  cors({
    origin: true, // allow same domain + dev
    credentials: true,
  })
);

// ✅ Mongo session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ Static image handling
app.use("/images/products", express.static(path.join(__dirname, "../front/public/images/products")));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);

// ✅ Google OAuth redirect
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect("/")
);

// ✅ Serve React frontend (from Vite build)
app.use(express.static(path.join(__dirname, "../front/dist")));
app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../front/dist", "index.html"));
});

// ✅ Start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ Mongo error:", err));
