
import express from 'express';
import { initializeEsewaPayment , confirmEsewaSubscription } from '../controllers/payment.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/initialize-esewa', initializeEsewaPayment );
// router.get('/complete-payment', completePayment);
router.post('/confirm-esewa-payment',verifyToken, confirmEsewaSubscription);

export default router;
