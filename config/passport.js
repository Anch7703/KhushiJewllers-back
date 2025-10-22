const passport = require("passport");
const jwt = require("jsonwebtoken");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://khushijewllers-back.onrender.com/api/auth/google/callback"
          : "http://localhost:5000/api/auth/google/callback",
    },
    
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Create new user if not found
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName || "User",
            email: profile.emails && profile.emails[0]?.value,
            avatar: profile.photos && profile.photos[0]?.value,
            password: null, // ensures no password validation required
          });
        }

        // Pass the user object to the next middleware
        return done(null, user);
      } catch (err) {
        console.error("Google Strategy Error:", err);
        return done(err, null);
      }
    }
  )
);

// Serialize user ID to session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error("Deserialize Error:", err);
    done(err, null);
  }
});

module.exports = passport;
