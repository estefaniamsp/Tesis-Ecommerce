import { Router } from 'express';
import { 
    getAllVentasController, 
    getVentaByIDController, 
    createVentaController, 
    updateVentaController, 
    deleteVentaController 
} from '../controllers/venta_controller.js'; 
import auth_admin from '../middlewares/auth_admin.js'; 
import { validarVenta, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router();

// Obtener todas las ventas
router.get('/ventas', auth_admin, getAllVentasController);
router.get('/ventas/:id', auth_admin, getVentaByIDController);
router.post('/ventas', auth_admin, validarVenta, manejarErrores, createVentaController);
router.put('/ventas/:id', auth_admin, updateVentaController);
router.delete('/ventas/:id', auth_admin, deleteVentaController);

export default router;
