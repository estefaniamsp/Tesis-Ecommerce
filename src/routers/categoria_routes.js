import { Router } from 'express';
import { 
    getAllCategoriasController, 
    getCategoriaByIDController, 
    createCategoriaController, 
    updateCategoriaController, 
    deleteCategoriaController 
} from '../controllers/categoria_controller.js';
import auth_admin from '../middlewares/auth_admin.js';  
import { validarCategoria, manejarErrores } from '../middlewares/validacionForms.js';  

const router = Router();

router.get('/categorias', getAllCategoriasController);
router.get('/categorias/:id', getCategoriaByIDController);
router.post('/categorias', auth_admin, validarCategoria, manejarErrores, createCategoriaController);
router.put('/categorias/:id', auth_admin, updateCategoriaController);
router.delete('/categorias/:id', auth_admin, deleteCategoriaController);

export default router;
