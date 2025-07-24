
import express from 'express';
import { initializeEsewaPayment , confirmEsewaSubscription } from '../controllers/payment.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { createStripeSession, confirmStripePayment  } from '../controllers/stripe.controller.js';
const router = express.Router();

router.post('/initialize-esewa', initializeEsewaPayment );
// router.get('/complete-payment', completePayment);
router.post('/confirm-esewa-payment',verifyToken, confirmEsewaSubscription);
router.post('/initialize-stripe', verifyToken, createStripeSession);
router.post('/confirm-stripe-payment', verifyToken, confirmStripePayment);
export default router;
