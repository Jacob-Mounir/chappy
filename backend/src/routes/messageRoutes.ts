import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { auth } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', messageController.getMessages);
router.post('/', auth, messageController.sendMessage);
router.delete('/:messageId', auth, messageController.deleteMessage);

export default router;