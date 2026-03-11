import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@fundflow.com' });
    if (existingAdmin) {
      console.log('Admin user already exists, deleting old one...');
      await User.deleteOne({ email: 'admin@fundflow.com' });
    }

    // Password will be hashed by Mongoose pre-save hook

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@fundflow.com',
      password: 'admin123', // Let Mongoose hash it
      role: 'admin',
      company: 'FundFlow Admin',
      bio: 'System Administrator',
      isActive: true
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@fundflow.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin(); 