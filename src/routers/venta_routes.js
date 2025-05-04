import { Router } from 'express';
import { 
    getAllVentasController, 
    getVentaByIDController, 
    createVentaCliente, 
    createVentaAdmin, 
    updateVentaController,
    deleteVentaController,
    getVentasClienteController,
    getFacturaClienteById
} from '../controllers/venta_controller.js'; 
import verificarAuthAdmin from '../middlewares/admin_auth.js'; 
import { validarVenta, manejarErrores } from '../middlewares/validacionForms.js';
import verificarAutenticacion from '../middlewares/auth.js'; 

const router = Router();

// Rutas para obtener las ventas de un cliente específico
router.post('/ventas', verificarAutenticacion, validarVenta, manejarErrores, createVentaCliente);
router.get('/ventas/cliente/mis-ventas', verificarAutenticacion, getVentasClienteController);
router.get('/ventas/cliente/factura/:id', verificarAutenticacion, getFacturaClienteById);

// Rutas para el administrador 
router.get('/ventas', verificarAuthAdmin, getAllVentasController);
router.get('/ventas/:id', verificarAuthAdmin, getVentaByIDController);
router.post('/ventas/admin', verificarAuthAdmin, validarVenta, manejarErrores, createVentaAdmin);
router.put('/ventas/:id', verificarAuthAdmin, updateVentaController);
router.delete('/ventas/:id', verificarAuthAdmin, deleteVentaController);




export default router;
