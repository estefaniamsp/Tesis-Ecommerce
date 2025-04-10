import express from 'express';
const router = express.Router();
import { 
    loginAdmin,
    confirmEmail
} from '../controllers/admin_controller.js';

router.post('/adminLogin', loginAdmin);
router.get('/confirmar/:token', confirmEmail);

export default router;
