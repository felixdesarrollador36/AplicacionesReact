import mongoose from 'mongoose';
import { Notification } from '../models/index.js';

export const createNotification = async ({ userId, type, message }) => {
  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(userId),
    type,
    message,
  });

  return {
    id: notification._id.toString(),
    type: notification.type,
    message: notification.message,
    is_read: notification.isRead,
    created_at: notification.createdAt,
  };
};
