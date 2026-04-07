import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return;
  }

  await mongoose.connect(uri);
}
