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
import { validarCliente, manejarErrores, validarClientePerfil } from '../middlewares/validacionForms.js';

// Rutas publicas
router.post("/login", loginCliente);
router.post("/registro", validarCliente, manejarErrores, registerCliente);
router.put("/perfil", verificarAutenticacion, validarClientePerfil, updateClienteProfile);
router.post("/recuperar-contrasenia", recuperarContrasenia);
router.post("/cambiar-contrasenia",  cambiarContrasenia);
router.get("/confirmarCliente/:token", confirmEmail);

// Exportar la variable router
export default router  