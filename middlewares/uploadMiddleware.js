const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary")

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "DevConnect/profilePhotos",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "fill" }],
  },
});

const upload = multer({ storage });

module.exports = upload;
