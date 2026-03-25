import mongoose from 'mongoose';

export const connectDB = async () => {
  console.log('Attempting to connect to MongoDB...');
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-p2p-lending');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`An unknown error occurred during DB connection`, error);
    }
    process.exit(1);
  }
};
