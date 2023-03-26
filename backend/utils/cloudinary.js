import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();
// Cloudinary Config for Image Upload
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export const uploadFileToCloud = async (fileField, options) => {
  const fileData = await cloudinary.uploader.upload(fileField.tempFilePath, {
    ...options,
  });

  return {
    public_id: fileData.public_id,
    url: fileData.secure_url,
  };
};
