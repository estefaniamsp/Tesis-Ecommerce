import { Router } from "express";
import {
  actualizarTokenNotificacion,
  enviarNotificacionesClientes,
  obtenerNotificacionesCliente,
  obtenerTodasNotificacionesEnviadas
} from "../controllers/notificacion_controller.js";
import verificarAutenticacion from "../middlewares/auth.js";
import verificarAuthAdmin from "../middlewares/admin_auth.js";

const router = Router();

router.get("/notificaciones", verificarAuthAdmin, obtenerTodasNotificacionesEnviadas);
router.get("/notificaciones/cliente", verificarAutenticacion, obtenerNotificacionesCliente);

router.post("/enviar-notificacion", verificarAuthAdmin, enviarNotificacionesClientes);
router.patch("/notificaciones/:pushToken", verificarAutenticacion, actualizarTokenNotificacion);


export default router;
