import express from 'express';
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Investment from '../models/Investment.js';

const router = express.Router();

// Get public stats
router.get('/', async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();
    
    const totalFundedResult = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalFunded = totalFundedResult[0]?.total || 0;
    
    const completedCampaigns = await Campaign.countDocuments({
      $expr: { $gte: ['$raisedAmount', '$goalAmount'] }
    });
    
    const successRate = totalCampaigns > 0 ? Math.round((completedCampaigns / totalCampaigns) * 100) : 0;

    res.json({
      totalCampaigns,
      totalUsers,
      totalFunded,
      successRate
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;