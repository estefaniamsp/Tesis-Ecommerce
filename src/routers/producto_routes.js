import { Router } from 'express';
import { 
    getAllProductosController, 
    getProductoByIDController, 
    createProductoController, 
    updateProductoController, 
    deleteProductoController,
    reactivarProductoController,
    personalizarProductoIAController
} from '../controllers/producto_controller.js';
import upload from '../config/multer.js';
import verificarAuthAdmin from '../middlewares/admin_auth.js';
import verificarAutenticacion from '../middlewares/auth.js';
import recuperarIdUsuario from '../middlewares/recuperarIdUsuario.js';
import { validarProducto, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

router.get('/productos', getAllProductosController);
router.get('/productos/:id', recuperarIdUsuario, getProductoByIDController);
router.post('/productos', verificarAuthAdmin,(req, res, next) => {req.folderName = "productos";
    next();
}, upload.single("imagen"), validarProducto, manejarErrores, createProductoController);
router.put('/productos/:id', verificarAuthAdmin,(req, res, next) => {req.folderName = "productos";
    next();
}, upload.single("imagen"), updateProductoController);
router.delete('/productos/:id', verificarAuthAdmin, deleteProductoController);
router.patch('/productos/:id', verificarAuthAdmin, reactivarProductoController);
router.post('/productos/recomendacion', verificarAutenticacion, personalizarProductoIAController);

export default router;
