import { Router } from 'express';
import * as userController from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, userController.getAllUsers);

export default router;