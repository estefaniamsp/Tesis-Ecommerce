import { Router } from "express";
import {
    getAllProductosPersonalizadosController,
    getProductoPersonalizadoByIDController,
    createProductoPersonalizadoController,
    updateProductoPersonalizadoController,
    updateImagenProductoPersonalizadoController,
    deleteProductoPersonalizadoController,
    personalizarProductoIAController
} from "../controllers/productoPersonalizado_controller.js";
import upload from '../config/multer.js';
import verificarAutenticacion from '../middlewares/auth.js';
import { handleMulterError } from '../middlewares/handleMulterError.js';

const router = Router();

router.get("/productos-personalizados", verificarAutenticacion, getAllProductosPersonalizadosController);
router.get("/productos-personalizados/:id", verificarAutenticacion, getProductoPersonalizadoByIDController);
router.post("/productos-personalizados", verificarAutenticacion, createProductoPersonalizadoController);
router.put("/productos-personalizados/:id", verificarAutenticacion, updateProductoPersonalizadoController);
router.put("/productos-personalizados/:id/imagen", verificarAutenticacion,
  (req, res, next) => {
    req.folderName = "productos-personalizados";
    next();
  }, upload.single("imagen"), handleMulterError, updateImagenProductoPersonalizadoController);
router.delete("/productos-personalizados/:id", verificarAutenticacion, deleteProductoPersonalizadoController);
router.post('/productos/recomendacion', verificarAutenticacion, personalizarProductoIAController);
export default router;
