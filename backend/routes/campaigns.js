import express from 'express';
import crypto from 'crypto';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';

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

// Create Cashfree order for campaign creation fee (5% of goal)
router.post('/create-order', auth, async (req, res) => {
  try {
    if (req.user.role !== 'startup') {
      return res.status(403).json({ message: 'Only startups can create campaigns' });
    }

    const { goalAmount } = req.body;
    if (!goalAmount || goalAmount < 1000) {
      return res.status(400).json({ message: 'Invalid goal amount' });
    }

    const fee = Math.ceil(goalAmount * 0.05);
    const { clientId, clientSecret, baseUrl } = getCashfreeConfig();
    const orderId = 'camp_' + crypto.randomBytes(8).toString('hex');

    const orderData = {
      order_id: orderId,
      order_amount: fee,
      order_currency: 'INR',
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/create-campaign?order_id=${orderId}`,
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

    res.json({ orderId, paymentSessionId: data.payment_session_id, fee });
  } catch (error) {
    console.error('Campaign fee order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    else filter.status = 'active';

    const campaigns = await Campaign.find(filter)
      .populate('creator', 'name company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(filter);

    res.json({
      campaigns,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Fetch campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get campaigns by user — must be before /:id
router.get('/user/:userId', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ creator: req.params.userId })
      .populate('creator', 'name company')
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error) {
    console.error('Fetch user campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get campaign stats for a user — must be before /:id
router.get('/stats/:userId', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ creator: req.params.userId });

    const stats = {
      totalCampaigns: campaigns.length,
      totalRaised: campaigns.reduce((sum, c) => sum + c.raisedAmount, 0),
      totalBackers: campaigns.reduce((sum, c) => sum + c.backers.length, 0),
      successRate: campaigns.length > 0
        ? Math.round((campaigns.filter(c => c.raisedAmount >= c.goalAmount).length / campaigns.length) * 100)
        : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'name company bio')
      .populate('backers.investor', 'name');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Fetch campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create campaign — requires verified payment orderId
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'startup') {
      return res.status(403).json({ message: 'Only startups can create campaigns' });
    }

    const { title, description, goalAmount, deadline, category, images, orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Payment required to create campaign' });
    }

    // Verify payment with Cashfree
    const { clientId, clientSecret, baseUrl } = getCashfreeConfig();
    const verifyResponse = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01',
        'accept': 'application/json',
      },
    });

    const orderData = await verifyResponse.json();
    if (orderData.order_status !== 'PAID') {
      return res.status(400).json({ message: 'Campaign creation fee payment not verified' });
    }

    const campaign = new Campaign({
      title,
      description,
      goalAmount,
      deadline,
      category,
      images,
      creator: req.user._id,
    });

    await campaign.save();
    await campaign.populate('creator', 'name company');

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update campaign
router.put('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('creator', 'name company');

    res.json(updatedCampaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
