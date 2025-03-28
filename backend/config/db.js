const mongoose = require('mongoose');

const connectDB = async () => {
  // If no MONGODB_URI is provided, don't attempt to connect
  if (!process.env.MONGODB_URI) {
    console.log('No MongoDB URI provided, skipping database connection');
    return null;
  }
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Don't exit the process, just return null
    return null;
  }
};

module.exports = connectDB;