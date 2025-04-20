import { Router } from 'express';
import { 
    getAllProductosController, 
    getProductoByIDController, 
    createProductoController, 
    updateProductoController, 
    deleteProductoController 
} from '../controllers/producto_controller.js';
import upload from '../config/multer.js';
import verificarAuthAdmin from '../middlewares/admin_auth.js';
import { validarProducto, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

router.get('/productos', getAllProductosController);
router.get('/productos/:id', getProductoByIDController);
router.post('/productos', verificarAuthAdmin, upload.single("imagen"), validarProducto, manejarErrores, createProductoController);
router.put('/productos/:id', verificarAuthAdmin, upload.single("imagen"), updateProductoController);
router.delete('/productos/:id', verificarAuthAdmin, deleteProductoController);

export default router;
