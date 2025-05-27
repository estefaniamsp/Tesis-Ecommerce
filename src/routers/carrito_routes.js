import { Router } from 'express';
import { 
    getCarritoClienteController,  
    setCarritoController, 
    emptyCarritoController 
} from '../controllers/carrito_controller.js';
import verificarAutenticacion from '../middlewares/auth.js'; 
import { validarCarrito, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

router.get('/carritos', verificarAutenticacion, getCarritoClienteController);
router.put('/carritos', verificarAutenticacion, validarCarrito, manejarErrores, setCarritoController);
router.delete('/carritos', verificarAutenticacion, emptyCarritoController);

export default router;
