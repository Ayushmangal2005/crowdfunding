import express from 'express';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch campaigns error:', error);
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

// Create campaign
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'startup') {
      return res.status(403).json({ message: 'Only startups can create campaigns' });
    }

    const { title, description, goalAmount, deadline, category, images } = req.body;

    const campaign = new Campaign({
      title,
      description,
      goalAmount,
      deadline,
      category,
      images,
      creator: req.user._id
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

    // Check if user is the creator or admin
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

    // Check if user is the creator or admin
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

// Get campaigns by user
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

// Get campaign stats for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ creator: req.params.userId });
    
    const stats = {
      totalCampaigns: campaigns.length,
      totalRaised: campaigns.reduce((sum, campaign) => sum + campaign.raisedAmount, 0),
      totalBackers: campaigns.reduce((sum, campaign) => sum + campaign.backers.length, 0),
      successRate: campaigns.length > 0 ? Math.round((campaigns.filter(c => c.raisedAmount >= c.goalAmount).length / campaigns.length) * 100) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;