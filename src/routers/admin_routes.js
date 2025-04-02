import express from 'express';
const router = express.Router();
import { 
    loginAdmin,
    recuperarContraseniaController,
    cambiarContraseniaController
} from '../controllers/admin_controller.js';
import  auth_admin  from '../middlewares/auth_admin.js'

router.post('/login', loginAdmin);
router.post("/recuperar-contrasenia", auth_admin, recuperarContraseniaController);
router.post("/cambiar-contrasenia", auth_admin, cambiarContraseniaController);
router.post("/logout", (req, res) => {
    res.status(200).json({ msg: "Sesión de administrador cerrada exitosamente." });
});

export default router;
