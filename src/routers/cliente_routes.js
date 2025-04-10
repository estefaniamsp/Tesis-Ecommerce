import {Router} from 'express'
const router = Router()
// Importar los métodos del controlador 
import {
    loginCliente,
    registerCliente,
    updateClienteProfile,
    recuperarContrasenia,
    cambiarContrasenia,
    confirmEmail
} from "../controllers/cliente_controller.js"
import verificarAutenticacion from '../middlewares/auth.js'; 
import { validarCliente, manejarErrores } from '../middlewares/validacionForms.js';

// Rutas publicas
router.post("/login", loginCliente);
router.post("/registro", validarCliente, manejarErrores, registerCliente);
router.put("/perfil/:id", verificarAutenticacion, updateClienteProfile);
router.post("/recuperar-contrasenia",verificarAutenticacion, recuperarContrasenia);
router.post("/cambiar-contrasenia", verificarAutenticacion, cambiarContrasenia);
router.get('/confirmar/:token', confirmEmail);
router.post("/logout", (req, res) => {res.status(200).json({ msg: "Sesión cerrada exitosamente." });});

// Exportar la variable router
export default router  