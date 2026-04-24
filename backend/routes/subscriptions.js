import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const INVESTOR_PRICE = 100;
const STARTUP_PRICE = 50;
const SUBSCRIPTION_DAYS = 30;

function getCashfreeConfig() {
  return {
    clientId: process.env.CASHFREE_CLIENT_ID,
    clientSecret: process.env.CASHFREE_CLIENT_SECRET,
    baseUrl: process.env.CASHFREE_ENV === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg',
  };
}

// Create subscription order
router.post('/create-order', auth, async (req, res) => {
  try {
    if (!['investor', 'startup'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admins do not need a subscription' });
    }

    const price = req.user.role === 'startup' ? STARTUP_PRICE : INVESTOR_PRICE;
    const { clientId, clientSecret, baseUrl } = getCashfreeConfig();
    const orderId = 'sub_' + crypto.randomBytes(8).toString('hex');

    const orderData = {
      order_id: orderId,
      order_amount: price,
      order_currency: 'INR',
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/subscribe?order_id=${orderId}`,
      },
    };

    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree subscription order error:', data);
      return res.status(500).json({ message: 'Failed to create subscription order' });
    }

    res.json({ orderId, paymentSessionId: data.payment_session_id, price });
  } catch (error) {
    console.error('Subscription create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify and activate subscription
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const { clientId, clientSecret, baseUrl } = getCashfreeConfig();

    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01',
        'accept': 'application/json',
      },
    });

    const data = await response.json();

    if (data.order_status !== 'PAID') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(req.user._id, {
      subscription: { status: 'active', startDate, endDate, orderId },
    });

    res.json({ message: 'Subscription activated', startDate, endDate });
  } catch (error) {
    console.error('Subscription verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
