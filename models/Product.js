const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["Gold", "Silver"], required: true },
    subCategory: {
      type: String,
      enum: ["All items", "Necklaces", "Rings", "Bracelets", "Earrings","Anklets","Pooja Silverware"],
      required: true,
    },
    weight: { type: Number, required: false, default:null }, // in grams
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true }, // make sure frontend uses this key
    availableOnline: { type: Boolean, default: false }, // false → orders via WhatsApp
    whatsappUrl: { type: String, trim: true }, // direct link to contact the store
    featured: { type: Boolean, default: false }, // optional for "Featured" badge
    inStock: { type: Boolean, default: true }, // mark out-of-stock items
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
