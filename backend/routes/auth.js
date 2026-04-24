import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, company, bio } = req.body;


    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      company,
      bio,
      approvalStatus: role === 'startup' ? 'pending' : 'approved'
    });

    await user.save();

    // Startups need admin approval — don't issue a token yet
    if (role === 'startup') {
      return res.status(201).json({ pendingApproval: true, message: 'Registration successful! Your account is pending admin approval.' });
    }

    // Generate JWT token for non-startup roles
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        bio: user.bio,
        subscription: user.subscription,
        totalInvested: user.totalInvested,
        totalRaised: user.totalRaised,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error.password);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.email, 'Role:', user.role);

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check startup approval
    if (user.role === 'startup' && user.approvalStatus === 'pending') {
      return res.status(403).json({ message: 'Your account is pending admin approval. Please wait for approval before logging in.' });
    }
    if (user.role === 'startup' && user.approvalStatus === 'rejected') {
      return res.status(403).json({ message: 'Your account registration has been rejected. Please contact support.' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        bio: user.bio,
        subscription: user.subscription,
        totalInvested: user.totalInvested,
        totalRaised: user.totalRaised,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { company, bio } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { company, bio },
      { new: true, runValidators: true }
    );

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      company: updatedUser.company,
      bio: updatedUser.bio,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;