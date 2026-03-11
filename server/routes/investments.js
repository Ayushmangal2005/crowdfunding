import express from 'express';
import Stripe from 'stripe';
import Investment from '../models/Investment.js';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, campaignId } = req.body;

    if (req.user.role !== 'investor') {
      return res.status(403).json({ message: 'Only investors can make investments' });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        campaignId,
        investorId: req.user._id.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm payment and create investment
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, campaignId, amount } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Create investment record
    const investment = new Investment({
      investor: req.user._id,
      campaign: campaignId,
      amount,
      paymentId: paymentIntentId,
      status: 'completed'
    });

    await investment.save();

    // Update campaign raised amount and add backer
    const campaign = await Campaign.findById(campaignId);
    campaign.raisedAmount += amount;
    
    // Add or update backer
    const existingBackerIndex = campaign.backers.findIndex(
      backer => backer.investor.toString() === req.user._id.toString()
    );

    if (existingBackerIndex >= 0) {
      campaign.backers[existingBackerIndex].amount += amount;
    } else {
      campaign.backers.push({
        investor: req.user._id,
        amount
      });
    }

    await campaign.save();

    // Update user's total invested
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalInvested: amount }
    });

    // Update campaign creator's total raised
    await User.findByIdAndUpdate(campaign.creator, {
      $inc: { totalRaised: amount }
    });

    res.json({ message: 'Investment completed successfully', investment });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error' });
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