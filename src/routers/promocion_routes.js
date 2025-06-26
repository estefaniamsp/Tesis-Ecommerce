import { Router } from "express";
import { 
  createPromocionController, 
  getAllPromocionesController, 
  getPromocionByIdController, 
  updatePromocionController, 
  deletePromocionController 
} from "../controllers/promocion_controller.js";
import upload from "../config/multer.js";
import verificarAuthAdmin from "../middlewares/admin_auth.js"; 
import { validarPromocion, validarActualizarPromocion, manejarErrores } from "../middlewares/validacionForms.js";
import {handleMulterError} from "../middlewares/handleMulterError.js";

const router = Router();

router.get("/promociones", getAllPromocionesController);
router.get("/promociones/:id", getPromocionByIdController);
router.post("/promociones", verificarAuthAdmin,(req, res, next) => {req.folderName = "promociones";
  next();
}, upload.single("imagen"), handleMulterError, validarPromocion, manejarErrores, createPromocionController);
router.put("/promociones/:id", verificarAuthAdmin,(req, res, next) => {req.folderName = "promociones";
    next();
}, upload.single("imagen"), handleMulterError, validarActualizarPromocion, manejarErrores, updatePromocionController);
router.delete("/promociones/:id", verificarAuthAdmin, deletePromocionController);

export default router;
