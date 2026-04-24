// // // const express = require('express');
// // // const router = express.Router();
// // // const Car = require('../models/Car');
// // // const auth = require('../middlewares/auth');

// // // // 🧾 Public: get all cars
// // // router.get('/', async (req, res) => {
// // //   const cars = await Car.find().sort({ createdAt: -1 });
// // //   res.json(cars);
// // // });

// // // // 🧾 Public: get one car by ID
// // // router.get('/:id', async (req, res) => {
// // //   const car = await Car.findById(req.params.id);
// // //   if (!car) return res.status(404).json({ error: 'Car not found' });
// // //   res.json(car);
// // // });

// // // // 🧰 Admin: add a new car
// // // router.post('/', auth, async (req, res) => {
// // //   if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

// // //   const car = new Car(req.body);
// // //   await car.save();
// // //   res.json({ message: 'Car added successfully', car });
// // // });

// // // // 🧰 Admin: update existing car
// // // router.put('/:id', auth, async (req, res) => {
// // //   if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

// // //   const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
// // //   res.json({ message: 'Car updated', car });
// // // });

// // // // 🧰 Admin: delete car
// // // router.delete('/:id', auth, async (req, res) => {
// // //   if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

// // //   await Car.findByIdAndDelete(req.params.id);
// // //   res.json({ message: 'Car deleted' });
// // // });

// // // module.exports = router;



// // const express = require("express");
// // const router = express.Router();
// // const path = require("path");
// // const fs = require("fs");
// // const multer = require("multer");
// // const Car = require("../models/Car");
// // const auth = require("../middlewares/auth");

// // // --- Multer Storage ---
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     const dir = path.join(__dirname, "../uploads/cars");
// //     fs.mkdirSync(dir, { recursive: true }); // Ensure folder exists
// //     cb(null, dir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
// //     cb(null, uniqueName + path.extname(file.originalname));
// //   },
// // });

// // const upload = multer({
// //   storage,
// //   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
// // });

// // // --- Public: Get All Cars ---
// // router.get("/", async (req, res) => {
// //   const cars = await Car.find().sort({ createdAt: -1 });
// //   res.json(cars);
// // });

// // // --- Public: Get One Car ---
// // router.get("/:id", async (req, res) => {
// //   const car = await Car.findById(req.params.id);
// //   if (!car) return res.status(404).json({ error: "Car not found" });
// //   res.json(car);
// // });

// // // --- Admin: Add New Car (Multiple Images) ---
// // router.post("/", auth, upload.array("images", 10), async (req, res) => {
// //   try {
// //     if (!req.user.isAdmin)
// //       return res.status(403).json({ error: "Forbidden" });

// //     const imagePaths = req.files.map((file) => `/uploads/cars/${file.filename}`);

// //     const { name, brand, type, description, seatingCapacity, features } =
// //       req.body;

// //     const car = new Car({
// //       name,
// //       brand,
// //       type,
// //       description,
// //       seatingCapacity,
// //       features: features ? features.split(",").map((f) => f.trim()) : [],
// //       images: imagePaths,
// //     });

// //     await car.save();
// //     res.json({ message: "✅ Car added successfully!", car });
// //   } catch (err) {
// //     console.error("❌ Error adding car:", err);
// //     res.status(500).json({ error: "Server error while adding car" });
// //   }
// // });

// // // --- Admin: Delete Car ---
// // router.delete("/:id", auth, async (req, res) => {
// //   if (!req.user.isAdmin) return res.status(403).json({ error: "Forbidden" });

// //   await Car.findByIdAndDelete(req.params.id);
// //   res.json({ message: "Car deleted successfully" });
// // });

// // module.exports = router;


































// // routes/cars.js
// const express = require("express");
// const router = express.Router();
// const path = require("path");
// const fs = require("fs");
// const multer = require("multer");
// const Car = require("../models/Car");
// const auth = require("../middlewares/auth");

// // ==========================
// // 🖼 MULTER STORAGE CONFIG
// // ==========================
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, "../uploads/cars");
//     fs.mkdirSync(uploadPath, { recursive: true });
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
// });

// // ==========================
// // 🚘 GET ALL CARS (Public)
// // ==========================
// router.get("/", async (req, res) => {
//   try {
//     const cars = await Car.find().sort({ createdAt: -1 });
//     res.json(cars);
//   } catch (err) {
//     console.error("❌ Error fetching cars:", err);
//     res.status(500).json({ error: "Server error while fetching cars" });
//   }
// });

// // ==========================
// // 🚘 GET ONE CAR (Public)
// // ==========================
// router.get("/:id", async (req, res) => {
//   try {
//     const car = await Car.findById(req.params.id);
//     if (!car) return res.status(404).json({ error: "Car not found" });
//     res.json(car);
//   } catch (err) {
//     res.status(500).json({ error: "Server error fetching car" });
//   }
// });

// // ==========================
// // 🧰 ADD NEW CAR (Admin Only)
// // ==========================
// router.post("/", auth, (req, res, next) => {
//   // Allow multer to handle multipart form data
//   const uploadHandler = upload.array("images", 10);
//   uploadHandler(req, res, async (err) => {
//     if (err instanceof multer.MulterError) {
//       console.error("❌ Multer error:", err);
//       return res.status(400).json({ error: "File upload error: " + err.message });
//     } else if (err) {
//       console.error("❌ Unknown upload error:", err);
//       return res.status(500).json({ error: "Unexpected upload error" });
//     }

//     try {
//       if (!req.user.isAdmin)
//         return res.status(403).json({ error: "Access forbidden" });

//       // Save file paths
//       const imagePaths = req.files.map((file) => `/uploads/cars/${file.filename}`);

//       const { name, brand, type, description, seatingCapacity, features } =
//         req.body;

//       const car = new Car({
//         name,
//         brand,
//         type,
//         description,
//         seatingCapacity,
//         features: features
//           ? features.split(",").map((f) => f.trim())
//           : [],
//         images: imagePaths,
//       });

//       await car.save();
//       console.log(`✅ New car added: ${car.name} (${imagePaths.length} images)`);

//       res.json({ message: "✅ Car added successfully!", car });
//     } catch (error) {
//       console.error("❌ Server error while saving car:", error);
//       res.status(500).json({ error: "Server error while adding car" });
//     }
//   });
// });

// // ==========================
// // 🗑 DELETE CAR (Admin Only)
// // ==========================
// router.delete("/:id", auth, async (req, res) => {
//   try {
//     if (!req.user.isAdmin)
//       return res.status(403).json({ error: "Access forbidden" });

//     const car = await Car.findByIdAndDelete(req.params.id);
//     if (!car) return res.status(404).json({ error: "Car not found" });

//     res.json({ message: "✅ Car deleted successfully" });
//   } catch (err) {
//     console.error("❌ Error deleting car:", err);
//     res.status(500).json({ error: "Server error while deleting car" });
//   }
// });

// module.exports = router;




// backend/routes/cars.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Car = require("../models/Car");
const auth = require("../middlewares/auth");

// --- Multer Storage Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/cars");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
});

// =============================
// 🧾 GET ALL CARS (Public)
// =============================
router.get("/", async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    console.error("❌ Error fetching cars:", err);
    res.status(500).json({ error: "Server error while fetching cars" });
  }
});

// =============================
// 🧾 GET ONE CAR (Public)
// =============================
router.get("/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (err) {
    res.status(500).json({ error: "Error fetching car" });
  }
});

// =============================
// 🧰 ADD CAR (Admin Only, Multiple Images)
// =============================
router.post("/", auth, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ error: "Forbidden: Admin only" });

    // ✅ Log to verify body fields
    console.log("Received body:", req.body);
    console.log("Received files:", req.files?.length);

    let { name, brand, type, description, seatingCapacity, features } = req.body;
    // Make description and features optional
    if (typeof description !== 'string') description = '';
    if (!features) features = '';

    if (!name || !brand || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const imagePaths = req.files.map(
      (file) => `/uploads/cars/${path.basename(file.path)}`
    );

    const car = new Car({
      name,
      brand,
      type,
      description,
      seatingCapacity,
      features: features ? features.split(",").map((f) => f.trim()).filter(f => f) : [],
      images: imagePaths,
    });

    await car.save();
    console.log("✅ Car added:", car.name);
    res.json({ message: "✅ Car added successfully!", car });
  } catch (err) {
    console.error("❌ Error adding car:", err);
    res.status(500).json({ error: "Server error while adding car" });
  }
});

// =============================
// 🛠️ UPDATE CAR (Admin Only, Optional Images)
// =============================
router.put("/:id", auth, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: "Forbidden: Admin only" });

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });

    let { name, brand, type, description, seatingCapacity, features } = req.body || {};

    if (name !== undefined) car.name = String(name).trim();
    if (brand !== undefined) car.brand = String(brand).trim();
    if (type !== undefined) car.type = String(type).trim();
    if (description !== undefined) car.description = String(description || '');
    if (seatingCapacity !== undefined) car.seatingCapacity = String(seatingCapacity || '');

    if (features !== undefined) {
      car.features = features
        ? String(features)
            .split(',')
            .map((f) => f.trim())
            .filter((f) => f)
        : [];
    }

    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map((file) => `/uploads/cars/${path.basename(file.path)}`);
      car.images = imagePaths;
    }

    await car.save();
    res.json({ message: "Car updated", car });
  } catch (err) {
    console.error("❌ Error updating car:", err);
    res.status(500).json({ error: "Server error while updating car" });
  }
});

// =============================
// 🗑 DELETE CAR (Admin)
// =============================
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ error: "Forbidden: Admin only" });

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Car deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting car:", err);
    res.status(500).json({ error: "Server error while deleting car" });
  }
});

module.exports = router;
