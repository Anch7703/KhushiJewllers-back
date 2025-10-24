// routes/products.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const Product = require("../models/Product");

const router = express.Router();

// ✅ Always keep both localhost and production frontends
const allowedOrigins = [
  "http://localhost:5173",
  "https://khushijewellers-front.onrender.com", // your Render frontend
];

router.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ✅ Helper: Build correct image URL
const makeImageUrl = (img) => {
  if (!img) return null;

  if (img.startsWith("http://") || img.startsWith("https://")) return img;

  return `https://khushijewllers.onrender.com/images/products/${path.basename(img)}`;
};

// ✅ Fetch all products (with filtering)
router.get("/", async (req, res) => {
  try {
    const { category, subcategory, featured, limit } = req.query;
    const query = {};

    if (category) query.category = { $regex: new RegExp(`^${category}$`, "i") };
    if (subcategory && subcategory !== "all")
      query.subCategory = { $regex: new RegExp(`^${subcategory}$`, "i") };
    if (featured !== undefined) query.featured = featured === "true";

    let productsQuery = Product.find(query);
    if (limit) productsQuery = productsQuery.limit(parseInt(limit, 10));

    const products = await productsQuery;

    const productsWithImageURL = products.map((p) => {
      const doc = p._doc || p.toObject();
      const imageField = doc.image || doc.imageUrl || doc.img || null;

      return {
        ...doc,
        imageUrl: makeImageUrl(imageField, req),
      };
    });

    res.json(productsWithImageURL);
  } catch (err) {
    console.error("❌ Product fetch error:", err);
    res.status(500).json({ error: "Server error while fetching products" });
  }
});

// ✅ Fetch product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const doc = product._doc || product.toObject();
    const imageField = doc.image || doc.imageUrl || doc.img || null;

    res.json({
      ...doc,
      imageUrl: makeImageUrl(imageField, req),
    });
  } catch (err) {
    console.error("❌ Product ID fetch error:", err);
    res.status(500).json({ error: "Server error while fetching product" });
  }
});

module.exports = router;
