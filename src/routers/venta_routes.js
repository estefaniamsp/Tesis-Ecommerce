import { Router } from 'express';
import { 
    getAllVentasController, 
    getVentaByIDController, 
    updateVentaController,
    deleteVentaController,
    getVentasClienteController,
    getFacturaClienteById,
    getDashboardController
} from '../controllers/venta_controller.js'; 
import verificarAuthAdmin from '../middlewares/admin_auth.js'; 
import verificarAutenticacion from '../middlewares/auth.js'; 

const router = Router();

// Rutas para obtener las ventas de un cliente específico
router.get('/ventas/cliente/mis-ventas', verificarAutenticacion, getVentasClienteController);
router.get('/ventas/cliente/factura/:id', verificarAutenticacion, getFacturaClienteById);

// Rutas para el administrador 
router.get('/ventas', verificarAuthAdmin, getAllVentasController);
router.get('/ventas/dashboard', verificarAuthAdmin, getDashboardController);
router.get('/ventas/:id', verificarAuthAdmin, getVentaByIDController);
router.put('/ventas/:id', verificarAuthAdmin, updateVentaController);
router.delete('/ventas/:id', verificarAuthAdmin, deleteVentaController);


export default router;
