import { Router } from 'express';
import { 
    getAllIngredientesController, 
    getIngredienteByIDController, 
    createIngredienteController, 
    updateIngredienteController, 
    deleteIngredienteController 
} from '../controllers/ingrediente_controller.js';
import verificarAuthAdmin from '../middlewares/admin_auth.js';  
import { validarIngrediente, manejarErrores } from '../middlewares/validacionForms.js';  
import { handleMulterError } from '../middlewares/handleMulterError.js';
import upload from '../config/multer.js'; 

const router = Router();

router.get('/ingredientes', getAllIngredientesController);
router.get('/ingredientes/:id', getIngredienteByIDController);
router.post('/ingredientes', verificarAuthAdmin, (req, res, next) => { 
    req.folderName = "ingredientes";
    next();
}, upload.single('imagen'), handleMulterError, validarIngrediente, manejarErrores, createIngredienteController);
router.put('/ingredientes/:id', (req, res, next) => { 
    req.folderName = "ingredientes";
    next();
}, verificarAuthAdmin, upload.single('imagen'), handleMulterError, updateIngredienteController);
router.delete('/ingredientes/:id', verificarAuthAdmin, deleteIngredienteController);

export default router;
