// ─── Image upload route ─────────────────────────────────────
// POST /uploads/image — multipart/form-data with a single "image" field
// Returns { url: "/uploads/<filename>" }

import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Store files in backend/uploads/ with unique names
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, "../../uploads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
  },
});

const router = Router();

// Require auth for uploads
router.use(authMiddleware);

router.post(
  "/image",
  upload.single("image"),
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
