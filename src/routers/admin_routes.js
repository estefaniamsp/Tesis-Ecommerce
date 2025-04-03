import express from 'express';
const router = express.Router();
import { 
    loginAdmin
} from '../controllers/admin_controller.js';

router.post('/adminLogin', loginAdmin);

export default router;
