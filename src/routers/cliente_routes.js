import {Router} from 'express'
const router = Router()
// Importar los métodos del controlador 
import {
    registerCliente,
    updateClienteProfile,
    getClienteProfile,
    recuperarContrasenia,
    cambiarContrasenia,
    confirmEmail,

    getClienteById,
    getAllClientes,
    desactiveClienteAdmin,
    activeClienteAdmin


} from "../controllers/cliente_controller.js"
import verificarAutenticacion from '../middlewares/auth.js'; 
import verificarAuthAdmin from '../middlewares/admin_auth.js';
import upload from "../config/multer.js";
import { validarCliente, manejarErrores, validarCambioContraseniaCliente, validarClientePerfil } from '../middlewares/validacionForms.js';

// Rutas publicas
router.post("/registro", validarCliente, manejarErrores, registerCliente);
router.put("/perfil", verificarAutenticacion, (req, res, next) => {req.folderName = "clientes";
    next();
}, upload.single("imagen"), validarClientePerfil, manejarErrores, updateClienteProfile);
router.get("/perfil", verificarAutenticacion, getClienteProfile);
router.post("/recuperar-contrasenia", recuperarContrasenia);
router.post("/cambiar-contrasenia", validarCambioContraseniaCliente, manejarErrores, cambiarContrasenia);
router.get("/confirmarCliente/:token", confirmEmail);

// Rutas privadas (solo para administradores)
router.get("/admin/clientes", verificarAuthAdmin, getAllClientes);
router.get("/admin/clientes/:id", verificarAuthAdmin, getClienteById);
router.delete("/admin/clientes/:id", verificarAuthAdmin, desactiveClienteAdmin);
router.patch("/admin/clientes/activar/:id", verificarAuthAdmin, activeClienteAdmin);

// Exportar la variable router
export default router  