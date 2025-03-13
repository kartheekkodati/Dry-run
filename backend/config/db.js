const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/code-editor', {
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