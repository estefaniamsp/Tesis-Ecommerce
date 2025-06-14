import { Router } from "express";
import {
    getAllProductosPersonalizadosController,
    getProductoPersonalizadoByIDController,
    createProductoPersonalizadoController,
    updateProductoPersonalizadoController,
    updateImagenProductoPersonalizadoController,
    deleteProductoPersonalizadoController,
} from "../controllers/productoPersonalizado_controller.js";
import upload from '../config/multer.js';
import verificarAutenticacion from '../middlewares/auth.js';

const router = Router();

router.get("/productos-personalizados", verificarAutenticacion, getAllProductosPersonalizadosController);
router.get("/productos-personalizados/:id", verificarAutenticacion, getProductoPersonalizadoByIDController);
router.post("/productos-personalizados", verificarAutenticacion, createProductoPersonalizadoController);
router.put("/productos-personalizados/:id", verificarAutenticacion, updateProductoPersonalizadoController);
router.put("/productos-personalizados/:id/imagen", verificarAutenticacion,
  (req, res, next) => {
    req.folderName = "productos-personalizados";
    next();
  }, upload.single("imagen"), updateImagenProductoPersonalizadoController);
router.delete("/productos-personalizados/:id", verificarAutenticacion, deleteProductoPersonalizadoController);
export default router;
