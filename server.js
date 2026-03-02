const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // serve uploaded videos

// -------- STORAGE SETUP --------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// -------- UPLOAD VIDEO --------
app.post("/upload", upload.single("video"), (req, res) => {
  res.json({ message: "Video uploaded successfully" });
});

// -------- LIST ALL VIDEOS --------
app.get("/videos", (req, res) => {
  fs.readdir("./uploads", (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read folder" });
    res.json(files);
  });
});

// -------- START SERVER --------
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});