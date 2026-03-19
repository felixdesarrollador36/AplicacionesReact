import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

export const connectDb = async () => {
  if (!mongoUri) {
    throw new Error('Falta configurar MONGODB_URI en variables de entorno');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  return mongoose.connection;
};

export const pingDb = async () => {
  if (!mongoose.connection.db) {
    return false;
  }

  await mongoose.connection.db.admin().ping();
  return true;
};

export const disconnectDb = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
};
