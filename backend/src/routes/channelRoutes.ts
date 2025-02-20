import { Router } from 'express';
import { auth } from '../middleware/auth';
import * as channelController from '../controllers/channelController';

const router = Router();

router.get('/:channelId/users', auth, channelController.getChannelUsers);

export default router;