import {Router} from 'express'
const router = Router()
// Importar los métodos del controlador 
import {
    loginCliente,
    registerCliente,
    updateClienteProfile,
    recuperarContrasenia,
    cambiarContrasenia,
    confirmEmail,

    getClienteById,
    getAllClientes,
    createClienteAdmin,
    updateClienteAdmin,
    deleteClienteAdmin


} from "../controllers/cliente_controller.js"
import verificarAutenticacion from '../middlewares/auth.js'; 
import verificarAuthAdmin from '../middlewares/admin_auth.js';
import { validarCliente, manejarErrores, validarClientePerfil } from '../middlewares/validacionForms.js';

// Rutas publicas
router.post("/login", loginCliente);
router.post("/registro", validarCliente, manejarErrores, registerCliente);
router.put("/perfil", verificarAutenticacion, validarClientePerfil, updateClienteProfile);
router.post("/recuperar-contrasenia", recuperarContrasenia);
router.post("/cambiar-contrasenia",  cambiarContrasenia);
router.get("/confirmarCliente/:token", confirmEmail);

// Rutas privadas (solo para administradores)
router.get("/admin/clientes", verificarAuthAdmin, getAllClientes);
router.get("/admin/clientes/:id", verificarAuthAdmin, getClienteById);
router.post("/admin/clientes", verificarAuthAdmin, validarCliente, manejarErrores, createClienteAdmin);
router.put("/admin/clientes/:id", verificarAuthAdmin, validarCliente, manejarErrores, updateClienteAdmin);
router.delete("/admin/clientes/:id", verificarAuthAdmin, deleteClienteAdmin);

// Exportar la variable router
export default router  