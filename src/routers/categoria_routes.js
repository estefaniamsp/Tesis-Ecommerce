import { Router } from 'express';
import { 
    getAllCategoriasController, 
    getCategoriaByIDController, 
    createCategoriaController, 
    updateCategoriaController, 
    deleteCategoriaController 
} from '../controllers/categoria_controller.js';
import verificarAutenticacion from '../middlewares/auth.js';  
import { validarCategoria, manejarErrores } from '../middlewares/validacionForms.js';  

const router = Router();

router.get('/categorias', getAllCategoriasController);
router.get('/categorias/:id', getCategoriaByIDController);
router.post('/categorias', verificarAutenticacion, validarCategoria, manejarErrores, createCategoriaController);
router.put('/categorias/:id', verificarAutenticacion, updateCategoriaController);
router.delete('/categorias/:id', verificarAutenticacion, deleteCategoriaController);

export default router;
