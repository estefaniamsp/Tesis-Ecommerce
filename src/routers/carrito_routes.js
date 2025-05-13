import { Router } from 'express';
import { 
    getAllCarritosController, 
    getCarritoByIDController, 
    createCarritoController, 
    updateCarritoController, 
    deleteCarritoController 
} from '../controllers/carrito_controller.js';
import verificarAutenticacion from '../middlewares/auth.js'; 
import { validarCarrito, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

router.get('/carritos', verificarAutenticacion, getAllCarritosController);
router.get('/carritos/:id', verificarAutenticacion, getCarritoByIDController);
router.post('/carritos', verificarAutenticacion, validarCarrito, manejarErrores, createCarritoController);
router.put('/carritos/:id', verificarAutenticacion, updateCarritoController);
router.delete('/carritos/:id', verificarAutenticacion, deleteCarritoController);

export default router;
