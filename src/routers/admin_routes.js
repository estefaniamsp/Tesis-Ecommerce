import express from 'express';
const router = express.Router();
import { 
    loginAdmin,
    confirmEmail,
    recuperarContraseniaController,
    cambiarContraseniaController
} from '../controllers/admin_controller.js';

router.post('/adminLogin', loginAdmin);
router.get('/confirmarAdmin/:token', confirmEmail);
router.post('/recuperarContraseniaAdmin', recuperarContraseniaController);
router.post('/cambiarContraseniaAdmin', cambiarContraseniaController);

export default router;
