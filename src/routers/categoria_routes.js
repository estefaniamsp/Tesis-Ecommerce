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
import upload from '../config/multer.js'; 

const router = Router();

router.get('/categorias', getAllCategoriasController);
router.get('/categorias/:id', getCategoriaByIDController);
router.post('/categorias', verificarAuthAdmin, upload.single('imagen'), validarCategoria, manejarErrores, createCategoriaController);
router.put('/categorias/:id', verificarAuthAdmin, upload.single('imagen'), updateCategoriaController);
router.delete('/categorias/:id', verificarAuthAdmin, deleteCategoriaController);

export default router;
