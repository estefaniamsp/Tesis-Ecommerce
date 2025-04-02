import {Router} from 'express'
import { 
    getAllClientesController, 
    getClienteByIDController, 
    createClienteController, 
    updateClienteController, 
    deleteClienteController 
} from '../controllers/cliente_controller.js'
import  auth_admin  from '../middlewares/auth_admin.js'
import { validarCliente, manejarErrores } from '../middlewares/validacionForms.js';

const router = Router()


router.get('/clientes',getAllClientesController)
router.get('/clientes/:id',getClienteByIDController)
router.post('/clientes',auth_admin, validarCliente, manejarErrores, createClienteController)
router.put('/clientes',auth_admin, updateClienteController)
router.delete('/clientes',auth_admin, deleteClienteController)


export default router