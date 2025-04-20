import { Router } from 'express';
import { 
    getAllVentasController, 
    getVentaByIDController, 
    createVentaCliente, 
    updateVentaController, 
    deleteVentaController 
} from '../controllers/venta_controller.js'; 
import verificarAuthAdmin from '../middlewares/admin_auth.js'; 
import { validarVenta, manejarErrores } from '../middlewares/validacionForms.js';
import verificarAutenticacion from '../middlewares/auth.js'; 

const router = Router();

// Obtener todas las ventas
router.get('/ventas', verificarAuthAdmin, getAllVentasController);
router.get('/ventas/:id', verificarAuthAdmin, getVentaByIDController);
router.post('/ventas', verificarAutenticacion, validarVenta, manejarErrores, createVentaCliente);
router.put('/ventas/:id', verificarAuthAdmin, updateVentaController);
router.delete('/ventas/:id', verificarAuthAdmin, deleteVentaController);

export default router;
