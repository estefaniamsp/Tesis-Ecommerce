import {Router} from 'express'
const router = Router()
// Importar los métodos del controlador 
import {
    loginUser,
    registerUser,
    updateUserProfile,
    recuperarContrasenia,
    cambiarContrasenia,
} from "../controllers/usuario_controller.js"
import verificarAutenticacion from '../middlewares/auth.js'; 
import { validarUsuario, manejarErrores } from '../middlewares/validacionForms.js';

// Rutas publicas
router.post("/login", loginUser);
router.post("/registro", validarUsuario, manejarErrores, registerUser);
router.put("/perfil/:id", verificarAutenticacion, updateUserProfile);
router.post("/recuperar-contrasenia",verificarAutenticacion, recuperarContrasenia);
router.post("/cambiar-contrasenia", verificarAutenticacion, cambiarContrasenia);
router.post("/logout", (req, res) => {
    res.status(200).json({ msg: "Sesión cerrada exitosamente." });
});

// Exportar la variable router
export default router  