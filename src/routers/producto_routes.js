import { Router } from 'express';
import { 
    getAllProductosController, 
    getProductoByIDController, 
    createProductoController, 
    updateProductoController, 
    deleteProductoController 
} from '../controllers/producto_controller.js';
import verificarAutenticacion from '../middlewares/auth.js';
import { validarProducto, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

router.get('/productos', getAllProductosController);
router.get('/productos/:id', getProductoByIDController);
router.post('/productos', verificarAutenticacion, validarProducto, manejarErrores, createProductoController);
router.put('/productos/:id', verificarAutenticacion, updateProductoController);
router.delete('/productos/:id', verificarAutenticacion, deleteProductoController);

export default router;
