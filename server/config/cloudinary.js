import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;

/**
 * Upload image to Cloudinary
 * @param {string} imageBase64 - Base64 encoded image string
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (imageBase64, folder = 'movierec-memes') => {
  try {
    // If it's already a URL, return it as is
    if (imageBase64.startsWith('http')) {
      return { url: imageBase64, publicId: null };
    }

    console.log('📤 Uploading image to Cloudinary...');
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      max_file_size: 10000000 // 10MB
    });

    console.log('✅ Image uploaded successfully:', result.secure_url);
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw new Error('Failed to upload image: ' + error.message);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 */
export const deleteImage = async (publicId) => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Image deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};
