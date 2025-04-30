import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = req.folderName || 'tesis_imagenes'; // más claro y seguro
    return {
      folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    };
  }
});

const upload = multer({ storage });

export default upload;