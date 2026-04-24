// const mongoose = require('mongoose');

// const CarSchema = new mongoose.Schema({
//   name: String,
//   brand: String,
//   type: String, // e.g., SUV, Sedan
//   seatingCapacity: Number,
//   description: String,
//   images: [String], // URLs or file paths
//   features: [String],
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Car', CarSchema);


const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    name: String,
    brand: String,
    type: String,
    description: { type: String, required: false, default: "" },
    seatingCapacity: String,
    features: { type: [String], required: false, default: [] },
    images: [String], // ✅ multiple images stored as URLs
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
