import { Router } from 'express';
import { 
    getAllProductosController, 
    getProductoByIDController, 
    createProductoController, 
    updateProductoController, 
    deleteProductoController,
    reactivarProductoController
} from '../controllers/producto_controller.js';
import upload from '../config/multer.js';
import verificarAuthAdmin from '../middlewares/admin_auth.js';
import verificarAutenticacion from '../middlewares/auth.js';
import recuperarIdUsuario from '../middlewares/recuperarIdUsuario.js';
import { validarProducto, manejarErrores } from '../middlewares/validacionForms.js';
import { handleMulterError } from '../middlewares/handleMulterError.js';

const router = Router();

router.get('/productos', getAllProductosController);
router.get('/productos/:id', recuperarIdUsuario, getProductoByIDController);
router.post('/productos', verificarAuthAdmin,(req, res, next) => {req.folderName = "productos";
    next();
}, upload.single("imagen"), handleMulterError, validarProducto, manejarErrores, createProductoController);
router.put('/productos/:id', verificarAuthAdmin,(req, res, next) => {req.folderName = "productos";
    next();
}, upload.single("imagen"), handleMulterError, updateProductoController);
router.delete('/productos/:id', verificarAuthAdmin, deleteProductoController);
router.patch('/productos/:id', verificarAuthAdmin, reactivarProductoController);

export default router;
