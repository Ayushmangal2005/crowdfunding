import express from 'express';
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Investment from '../models/Investment.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const totalInvestments = await Investment.countDocuments();
    const totalFunded = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const recentCampaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('creator', 'name company')
      .select('title goalAmount raisedAmount status createdAt');

    res.json({
      stats: {
        totalUsers,
        totalCampaigns,
        totalInvestments,
        totalFunded: totalFunded[0]?.total || 0
      },
      recentUsers,
      recentCampaigns
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status
router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all campaigns for admin
router.get('/campaigns', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find()
      .populate('creator', 'name company email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments();

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
    console.error('Fetch admin campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update campaign status
router.put('/campaigns/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('creator', 'name company');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;