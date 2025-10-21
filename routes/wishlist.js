// routes/wishlistRoutes.js
const express = require("express");
const Wishlist = require("../models/Wishlist");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const router = express.Router();

// Auth middleware
function auth(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// Add product to wishlist
router.post("/add", auth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: "Invalid product ID" });

    let wishlist = await Wishlist.findOne({ userId: req.user.id }) || new Wishlist({ userId: req.user.id, products: [] });

    if (!wishlist.products.includes(productId)) wishlist.products.push(productId);

    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get wishlist
router.get("/", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id }).populate("products");
    res.json(wishlist || { products: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove product from wishlist
router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.products = wishlist.products.filter(id => id.toString() !== req.params.productId);
    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
