import { Router } from 'express';
import { 
    getAllProductosController, 
    getProductoByIDController, 
    createProductoController, 
    updateProductoController, 
    deleteProductoController 
} from '../controllers/producto_controller.js';
import auth_admin from '../middlewares/auth_admin.js';
import { validarProducto, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

router.get('/productos', getAllProductosController);
router.get('/productos/:id', getProductoByIDController);
router.post('/productos', auth_admin, validarProducto, manejarErrores, createProductoController);
router.put('/productos/:id', auth_admin, updateProductoController);
router.delete('/productos/:id', auth_admin, deleteProductoController);

export default router;
