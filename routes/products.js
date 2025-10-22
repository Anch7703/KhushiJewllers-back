// routes/products.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const Product = require("../models/Product");

const router = express.Router();

const allowedOrigins = [
  "http://localhost:5173",
  "https://khushijewellers.onrender.com"
];

router.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// Helper to create a correct public URL for an image
const makeImageUrl = (img, req) => {
  if (!img) return null;
  // already a full absolute URL
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  // already a server-relative images path
  if (img.startsWith("/images")) return `${req.protocol}://${req.get("host")}${img}`;
  // otherwise assume just the filename and build path
  return `${req.protocol}://${req.get("host")}/images/products/${img}`;
};

// Get all products (with category/subcategory/featured filtering)
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
      const doc = p._doc || p.toObject(); // safe extraction
      // Support common field names: image, imageUrl, img
      const imageField = doc.image || doc.imageUrl || doc.img || null;

      return {
        ...doc,
        imageUrl: makeImageUrl(imageField, req),
      };
    });

    console.log("Sending products with images:", productsWithImageURL.map(p => p.imageUrl));
    res.json(productsWithImageURL);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const doc = product._doc || product.toObject();
    const imageField = doc.image || doc.imageUrl || doc.img || null;
    const productWithUrl = {
      ...doc,
      imageUrl: makeImageUrl(imageField, req),
    };

    res.json(productWithUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
