import { Router } from 'express';
import * as directMessageController from '../controllers/directMessageController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/conversations', auth, directMessageController.getConversations);
router.get('/:userId', auth, directMessageController.getDirectMessages);
router.post('/:userId', auth, directMessageController.sendDirectMessage);
router.patch('/:messageId/read', auth, directMessageController.markAsRead);

export default router;