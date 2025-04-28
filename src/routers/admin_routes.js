import express from 'express';
const router = express.Router();
import { 
    loginAdmin,
    confirmEmail,
    recuperarContraseniaController,
    cambiarContraseniaController
} from '../controllers/admin_controller.js';
import { validarLogin, validarCambioContraseniaAdmin, manejarErrores } from '../middlewares/validacionForms.js';

router.post('/adminLogin', validarLogin, manejarErrores, loginAdmin);
router.get('/confirmarAdmin/:token', confirmEmail);
router.post('/recuperarContraseniaAdmin', recuperarContraseniaController);
router.post('/cambiarContraseniaAdmin', validarCambioContraseniaAdmin, manejarErrores, cambiarContraseniaController);

export default router;
