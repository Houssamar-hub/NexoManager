import mongoose from 'mongoose';

export async function connectDB() {
  const { MONGODB_URI: mongoUri } = process.env;

  if (!mongoUri) {
    throw new Error('MONGODB_URI must be set in the environment');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
}
