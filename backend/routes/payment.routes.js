
// import express from 'express';
// import { initializeEsewaPayment , confirmEsewaSubscription } from '../controllers/payment.controller.js';
// import { verifyToken } from '../utils/verifyUser.js';
// import { createStripeSession, confirmStripePayment  } from '../controllers/stripe.controller.js';
// const router = express.Router();

// router.post('/initialize-esewa', initializeEsewaPayment );
// // router.get('/complete-payment', completePayment);
// router.post('/confirm-esewa-payment',verifyToken, confirmEsewaSubscription);
// router.post('/initialize-stripe', verifyToken, createStripeSession);
// router.post('/confirm-stripe-payment', verifyToken, confirmStripePayment);
// export default router;
import express from 'express';
import {
  initializeEsewaPayment,
  confirmEsewaSubscription,
} from '../controllers/payment.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import {
  createStripeSession,
  confirmStripePayment,
} from '../controllers/stripe.controller.js';

const router = express.Router();

router.route('/initialize-esewa')
  .post(initializeEsewaPayment)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/confirm-esewa-payment')
  .post(verifyToken, confirmEsewaSubscription)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/initialize-stripe')
  .post(verifyToken, createStripeSession)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/confirm-stripe-payment')
  .post(verifyToken, confirmStripePayment)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

export default router;
