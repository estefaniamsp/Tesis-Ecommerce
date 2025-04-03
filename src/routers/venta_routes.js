import { Router } from 'express';
import { 
    getAllVentasController, 
    getVentaByIDController, 
    createVentaController, 
    updateVentaController, 
    deleteVentaController 
} from '../controllers/venta_controller.js'; 
import verificarAutenticacion from '../middlewares/auth.js'; 
import { validarVenta, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

// Obtener todas las ventas
router.get('/ventas', verificarAutenticacion, getAllVentasController);
router.get('/ventas/:id', verificarAutenticacion, getVentaByIDController);
router.post('/ventas', verificarAutenticacion, validarVenta, manejarErrores, createVentaController);
router.put('/ventas/:id', verificarAutenticacion, updateVentaController);
router.delete('/ventas/:id', verificarAutenticacion, deleteVentaController);

export default router;
