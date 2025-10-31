const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

// Cloudinary storage for post images
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "DevConnect/posts",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
  },
});

const upload = multer({ storage });

module.exports = upload;
