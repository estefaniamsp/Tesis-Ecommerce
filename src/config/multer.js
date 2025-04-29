import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js'; 

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tesis_imagenes', // nombre de la carpeta que se creará en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

export default upload;