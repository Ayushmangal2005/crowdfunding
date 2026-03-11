import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@fundflow.com' });
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(0);
    }

    // Hash the password properly
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Update the admin user's password
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    console.log('Admin password fixed successfully!');
    console.log('Email: admin@fundflow.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error fixing admin password:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixAdminPassword(); 