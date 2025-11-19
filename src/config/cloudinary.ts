import { v2 as cloudinary } from 'cloudinary';
import Constants from 'expo-constants';

// Get Cloudinary URL from environment variables
const cloudinaryUrl = Constants.expoConfig?.extra?.cloudinaryUrl || process.env.CLOUDINARY_URL;

if (!cloudinaryUrl) {
  console.warn('CLOUDINARY_URL not set. Please add it to your .env file or app.json extra config.');
} else {
  cloudinary.config(cloudinaryUrl);
}

export { cloudinary };
export const MODELING_FOLDER = 'Modeling';

