import { Router } from 'express';
import { 
    getAllCategoriasController, 
    getCategoriaByIDController, 
    createCategoriaController, 
    updateCategoriaController, 
    deleteCategoriaController 
} from '../controllers/categoria_controller.js';
import verificarAuthAdmin from '../middlewares/admin_auth.js';  
import { validarCategoria, manejarErrores } from '../middlewares/validacionForms.js';  
import { handleMulterError } from '../middlewares/handleMulterError.js';
import upload from '../config/multer.js'; 

const router = Router();

router.get('/categorias', getAllCategoriasController);
router.get('/categorias/:id', getCategoriaByIDController);
router.post('/categorias', verificarAuthAdmin,(req, res, next) => {req.folderName = "categorias";
    next();
}, upload.single('imagen'), handleMulterError, validarCategoria, manejarErrores, createCategoriaController);
router.put('/categorias/:id', (req, res, next) => {req.folderName = "categorias";
    next();
}, verificarAuthAdmin, upload.single('imagen'), handleMulterError, updateCategoriaController);
router.delete('/categorias/:id', verificarAuthAdmin, deleteCategoriaController);

export default router;
