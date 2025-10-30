import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "video/mp4",
      "video/webm",
      "video/ogg",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only image and video files are allowed"));
    }
    cb(null, true);
  },
});

// ✅ Cloudinary upload helper
const uploadToCloudinary = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const isVideo = mimetype.startsWith("video/");
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "elihomes_uploads",
        resource_type: isVideo ? "video" : "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// ✅ Single file upload
router.post("/", authenticateUser, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    res.status(200).json({
      message: "File uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
      resourceType: result.resource_type,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err.message);
    res.status(500).json({ message: "Server error during upload" });
  }
});

// ✅ Multiple file upload (e.g. property listing)
router.post(
  "/multiple",
  authenticateUser,
  upload.array("files", 10), // up to 10 uploads per listing
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ message: "No files provided" });

      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, file.mimetype))
      );

      res.status(200).json({
        message: "Files uploaded successfully",
        files: uploads.map((r) => ({
          url: r.secure_url,
          public_id: r.public_id,
          resourceType: r.resource_type,
        })),
      });
    } catch (err) {
      console.error("Multiple upload error:", err.message);
      res.status(500).json({ message: "Server error during multiple upload" });
    }
  }
);

// ✅ Delete file from Cloudinary
router.delete("/delete", authenticateUser, async (req, res) => {
  try {
    const { public_id, resourceType } = req.body;
    if (!public_id) return res.status(400).json({ message: "Missing public_id" });

    await cloudinary.uploader.destroy(public_id, {
      resource_type: resourceType || "image",
    });

    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ message: "Error deleting file" });
  }
});

export default router;
