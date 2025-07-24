
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import PaymentOrder from '../models/paymentOrder.model.js';
import User from '../models/user.model.js';

export const initializeEsewaPayment = async (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'initialize') {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: 'User ID is required' });

      // Amount breakdown
      const amount = 100;
      const tax_amount = 10;
      const product_service_charge = 0;
      const product_delivery_charge = 0;
      const total_amount = amount + tax_amount + product_service_charge + product_delivery_charge;

      // Unique transaction UUID: alphanumeric + hyphen only
      const transaction_uuid = uuidv4();

      // Save order in DB
      const newOrder = new PaymentOrder({
        userId,
        transactionUUID: transaction_uuid,
        amount: total_amount,
        status: 'pending',
      });
      await newOrder.save();
  
      const product_code = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
      const secret_key = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
      const success_url = `${process.env.FRONTEND_BASE_URL}/success`;
      const failure_url = `${process.env.FRONTEND_BASE_URL}/failure`;

      // Fields to sign - order matters!
      const fieldsToSign = [
        { key: 'total_amount', value: total_amount.toString() },
        { key: 'transaction_uuid', value: transaction_uuid },
        { key: 'product_code', value: product_code },
      ];

      // Compose string for signature exactly as required
      const dataToSign = fieldsToSign.map(f => `${f.key}=${f.value}`).join(',');

      // Generate HMAC-SHA256 signature in base64
      const hmac = crypto.createHmac('sha256', secret_key);
      hmac.update(dataToSign);
      const signature = hmac.digest('base64');

      // Full data to send to frontend for form, including mandatory fields and optional charges
      const paymentData = {
        amount: amount.toString(),
        tax_amount: tax_amount.toString(),
        total_amount: total_amount.toString(),
        transaction_uuid,
        product_code,
        product_service_charge: product_service_charge.toString(),
        product_delivery_charge: product_delivery_charge.toString(),
        success_url,
        failure_url,
        signed_field_names: fieldsToSign.map(f => f.key).join(','),
        signature,
      };

      return res.json({ payment: paymentData });
    }

    else if (action === 'confirm') {
      const { transaction_uuid, userId } = req.body;
      if (!transaction_uuid || !userId) {
        return res.status(400).json({ message: 'Transaction UUID and userId required' });
      }

      // Find order in DB
      const paymentOrder = await PaymentOrder.findOne({ transactionUUID: transaction_uuid });
      if (!paymentOrder) return res.status(404).json({ message: 'Payment order not found' });

      const product_code = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
      const expectedAmount = paymentOrder.amount;

      // Query eSewa status API to verify payment
      const response = await axios.get('https://rc.esewa.com.np/api/epay/transaction/status', {
        params: {
          product_code,
          transaction_uuid,
          total_amount: expectedAmount,
        },
      });

      const { status } = response.data;

      if (status === 'COMPLETE') {
        paymentOrder.status = 'completed';
        await paymentOrder.save();

        // Update user subscription
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.subscribed = true;
        user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        await user.save();

        return res.json({ message: 'Payment confirmed and subscription updated' });
      } else {
        paymentOrder.status = 'failed';
        await paymentOrder.save();
        return res.status(400).json({ message: `Payment not completed, status: ${status}` });
      }
    }

    else {
      return res.status(400).json({ message: 'Invalid action. Must be "initialize" or "confirm".' });
    }
  }
  catch (error) {
    console.error('Esewa payment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const confirmEsewaSubscription = async (req, res) => {
  const { transactionUUID, productCode } = req.body;
  const userId = req.user.id; // or however you're identifying the user via auth middleware

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.subscribed = true;
    user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await user.save();

    return res.status(200).json({ message: "Subscription confirmed" });
  } catch (err) {
    console.error("Subscription confirm error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};