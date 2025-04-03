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

// Obtener todos los carritos
router.get('/carritos', getAllCarritosController);

// Obtener un carrito por ID
router.get('/carritos/:id', getCarritoByIDController);

// Crear un nuevo carrito
router.post('/carritos', verificarAutenticacion, validarCarrito, manejarErrores, createCarritoController);

// Actualizar un carrito
router.put('/carritos/:id', verificarAutenticacion, updateCarritoController);

// Eliminar un carrito
router.delete('/carritos/:id', verificarAutenticacion, deleteCarritoController);

export default router;
