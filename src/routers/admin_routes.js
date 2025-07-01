import express from 'express';
const router = express.Router();
import { 
    confirmEmail,
    recuperarContraseniaController,
    cambiarContraseniaController
} from '../controllers/admin_controller.js';
import { validarCambioContraseniaAdmin, manejarErrores } from '../middlewares/validacionForms.js';

router.get('/admin/confirmar-email/:token', confirmEmail);
router.post('/recuperarContraseniaAdmin', recuperarContraseniaController);
router.post('/cambiarContraseniaAdmin', validarCambioContraseniaAdmin, manejarErrores, cambiarContraseniaController);

export default router;
