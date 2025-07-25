import Stripe from 'stripe';
import PaymentOrder from '../models/paymentOrder.model.js';
import User from '../models/user.model.js';



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51RoFfJ1e1pHn96P9eWaS36sTN0Yoy6al1bNvqRCnCNiKdMb9dIES6233DtbxBQWRprzI08WXeRuHg8xBI9rxBQfo00Gv55KTU9', {
  apiVersion: '2024-04-10',
});


export const createStripeSession = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const amount = 10000; // in cents → $100.00

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Subscription',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_BASE_URL}/failure`,
      metadata: { userId },
    });

    // Save order
    const order = new PaymentOrder({
      userId,
      transactionUUID: session.id,
      amount: amount / 100,
      status: 'pending',
    });
    await order.save();

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({ message: "Failed to create session" });
  }
};

// export const confirmStripePayment = async (req, res) => {
//   const { session_id } = req.body;
//   if (!session_id) return res.status(400).json({ message: "Session ID required" });

//   try {
//     const session = await stripe.checkout.sessions.retrieve(session_id);

//     if (session.payment_status === 'paid') {
//       const order = await PaymentOrder.findOne({ transactionUUID: session_id });
//       if (!order) return res.status(404).json({ message: 'Order not found' });

//       order.status = 'completed';
//       await order.save();

//       const user = await User.findById(session.metadata.userId);
//       if (user) {
//         user.subscribed = true;
//         user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
//         await user.save();
//       }

//       return res.json({ message: 'Payment confirmed and subscription updated' });
//     }

//     return res.status(400).json({ message: "Payment not completed" });
//   } catch (err) {
//     console.error("Confirm error:", err);
//     return res.status(500).json({ message: "Error confirming payment" });
//   }
// };
export const confirmStripePayment = async (req, res) => {
  //console.log("Stripe confirm payment body:", req.body);
  const { session_id } = req.body;
 //console.log("Stripe confirm session_id:", session_id);
  if (!session_id) {
    return res.status(400).json({ message: "Session ID required" });
  }

  try {
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ message: "Payment not completed or invalid session" });
    }

    // Find the corresponding order
    const order = await PaymentOrder.findOne({ transactionUUID: session_id });
    
    if (!order) {
      return res.status(404).json({ message: 'Payment order not found' });
    }

    // Update order status
    order.status = 'completed';
    await order.save();

    // Update user subscription
    const user = await User.findById(session.metadata.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.subscribed = true;
    user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await user.save();

    return res.status(200).json({ message: "Payment confirmed and subscription updated" });

  } catch (err) {
    console.error("Stripe confirm payment error:", err);
    return res.status(500).json({ message: "Internal server error while confirming payment" });
  }
};
