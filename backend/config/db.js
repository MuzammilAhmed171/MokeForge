import mongoose from 'mongoose';

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI is not defined in environment variables');
      return null;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = conn;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
