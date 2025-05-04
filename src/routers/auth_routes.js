import express from 'express';
const router = express.Router();
import { 
    loginInteligente
} from '../controllers/auth_controller.js';
import { validarLogin, manejarErrores } from '../middlewares/validacionForms.js';

router.post('/login', validarLogin, manejarErrores, loginInteligente);


export default router;
