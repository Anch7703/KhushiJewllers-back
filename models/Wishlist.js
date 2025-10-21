const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    set: arr => [...new Set(arr.map(String))], // remove duplicates
    default: []
  },
}, { timestamps: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);

