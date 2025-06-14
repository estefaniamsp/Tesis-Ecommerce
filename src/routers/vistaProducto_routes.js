import express from "express";
import { obtenerUltimasVistasCliente } from "../controllers/vistaProducto_controller.js";
import verificarAutenticacion from '../middlewares/auth.js'; 

const router = express.Router();

router.get("/ultimas", verificarAutenticacion, obtenerUltimasVistasCliente);

export default router;