import { Router } from 'express';
import { 
    getCarritoClienteController,  
    addCarritoController,
    updateCantidadProductoController,
    removeProductoCarritoController,
    emptyCarritoController,
    pagarCarritoController
} from '../controllers/carrito_controller.js';
import verificarAutenticacion from '../middlewares/auth.js'; 
import { validarCarrito, validarModificarCantidad, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

router.get('/carritos', verificarAutenticacion, getCarritoClienteController);
router.put('/carritos/agregar', verificarAutenticacion, validarCarrito, manejarErrores, addCarritoController);
router.put('/carritos/modificar-cantidad', verificarAutenticacion, validarModificarCantidad, manejarErrores, updateCantidadProductoController);
router.put('/carritos/eliminar', verificarAutenticacion, removeProductoCarritoController);
router.delete('/carritos', verificarAutenticacion, emptyCarritoController);
router.post('/carritos/pagar', verificarAutenticacion, pagarCarritoController);

export default router;
