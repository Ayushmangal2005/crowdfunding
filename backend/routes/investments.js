import express from 'express';
import crypto from 'crypto';
import Investment from '../models/Investment.js';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

function getCashfreeConfig() {
  return {
    clientId: process.env.CASHFREE_CLIENT_ID,
    clientSecret: process.env.CASHFREE_CLIENT_SECRET,
    baseUrl: process.env.CASHFREE_ENV === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg',
  };
}

function generateOrderId() {
  return 'order_' + crypto.randomBytes(8).toString('hex');
}

// Create Cashfree order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, campaignId } = req.body;
    const { clientId, clientSecret, baseUrl } = getCashfreeConfig();

    if (req.user.role !== 'investor') {
      return res.status(403).json({ message: 'Only investors can make investments' });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const orderId = generateOrderId();

    const orderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/campaign/${campaignId}?order_id=${orderId}&campaign_id=${campaignId}&amount=${amount}`,
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
      console.error('Cashfree create order error:', data);
      return res.status(500).json({ message: 'Failed to create payment order' });
    }

    res.json({
      orderId,
      paymentSessionId: data.payment_session_id,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify payment and create investment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { orderId, campaignId, amount } = req.body;
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
      return res.status(400).json({ message: 'Payment not completed', status: data.order_status });
    }

    // Create investment record
    const investment = new Investment({
      investor: req.user._id,
      campaign: campaignId,
      amount,
      paymentId: orderId,
      status: 'completed',
    });
    await investment.save();

    // Update campaign raised amount and backers
    const campaign = await Campaign.findById(campaignId);
    campaign.raisedAmount += amount;
    const existingBackerIndex = campaign.backers.findIndex(
      b => b.investor.toString() === req.user._id.toString()
    );
    if (existingBackerIndex >= 0) {
      campaign.backers[existingBackerIndex].amount += amount;
    } else {
      campaign.backers.push({ investor: req.user._id, amount });
    }
    await campaign.save();

    // Update user totals
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalInvested: amount } });
    await User.findByIdAndUpdate(campaign.creator, { $inc: { totalRaised: amount } });

    res.json({ message: 'Investment completed successfully', investment });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// Get user investments
router.get('/user/:userId', async (req, res) => {
  try {
    const investments = await Investment.find({ investor: req.params.userId })
      .populate('campaign', 'title goalAmount raisedAmount deadline')
      .sort({ createdAt: -1 });

    res.json(investments);
  } catch (error) {
    console.error('Fetch investments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all investments (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const investments = await Investment.find()
      .populate('investor', 'name email')
      .populate('campaign', 'title creator')
      .sort({ createdAt: -1 });

    res.json(investments);
  } catch (error) {
    console.error('Fetch all investments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
