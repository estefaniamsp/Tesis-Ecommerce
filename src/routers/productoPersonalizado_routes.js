import { Router } from "express";
import {
    getAllProductosPersonalizadosController,
    getProductoPersonalizadoByIDController,
    createProductoPersonalizadoController,
    updateProductoPersonalizadoController,
    deleteProductoPersonalizadoController,
} from "../controllers/productoPersonalizado_controller.js";
import upload from '../config/multer.js';
import verificarAutenticacion from '../middlewares/auth.js';

const router = Router();

router.get("/productos-personalizados", verificarAutenticacion, getAllProductosPersonalizadosController);
router.get("/productos-personalizados/:id", verificarAutenticacion, getProductoPersonalizadoByIDController);
router.post("/productos-personalizados", verificarAutenticacion,
    (req, res, next) => {
        req.folderName = "productos-personalizados";
        next();
    }, upload.single("imagen"), createProductoPersonalizadoController);
router.put("/productos-personalizados/:id", verificarAutenticacion,
    (req, res, next) => {
        req.folderName = "productos-personalizados";
        next();
    }, upload.single("imagen"), updateProductoPersonalizadoController);
router.delete("/productos-personalizados/:id", verificarAutenticacion, deleteProductoPersonalizadoController);
export default router;
