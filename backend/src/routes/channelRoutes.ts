import { Router } from 'express';
import { auth } from '../middleware/auth';
import * as channelController from '../controllers/channelController';

const router = Router();

router.post('/', auth, channelController.createChannel);
router.get('/', auth, channelController.getChannels);
router.get('/:id', auth, channelController.getChannel);
router.put('/:id', auth, channelController.updateChannel);
router.delete('/:id', auth, channelController.deleteChannel);

export default router; 