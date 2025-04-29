import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Según la ruta o lógica, decides a qué carpeta subir
    let folder = 'tesis_imagenes'; // Default

    // Ejemplo: según la ruta decides la carpeta
    if (req.originalUrl.includes('/productos')) {
      folder = 'productos';
    } else if (req.originalUrl.includes('/categorias')) {
      folder = 'categorias';
    } else if (req.originalUrl.includes('/promociones')) {
      folder = 'promociones';
    }

    return {
      folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    };
  }
});

const upload = multer({ storage });

export default upload;