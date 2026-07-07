const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} originalName - Original filename to preserve extension
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<Object>} Cloudinary upload result
 */
exports.uploadBufferToCloudinary = (buffer, originalName, folder = 'xerox_uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folder, 
        resource_type: 'auto', // Auto allows Cloudinary to correctly identify PDFs and set Content-Type
        format: 'pdf', // Force PDF format
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};
