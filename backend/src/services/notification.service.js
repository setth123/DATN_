import Notification from '../models/Notification.model.js';

export const createNotification = async (notificationData) => {
  const notification = new Notification(notificationData);
  await notification.save();

  // Populate 'from' for potential use in socket emission or immediate return
  await notification.populate({
    path: 'from',
    select: 'profilePicture', // Only select what's truly needed from 'from'
  });

  return notification;
};

export const getNotificationsForUser = async (userId) => {
  // With displayName, jobTitle, and conversationId stored directly, fetching is simpler and more performant.
  var notifications = await Notification.find({ to: userId })
    .populate({ path: 'from', select: 'profilePicture' }) // Populate 'from' if profile picture is needed
    .sort({ createdAt: -1 }); // Sort by newest first
  return notifications;
};

export const markAsRead = async (notificationId) => {
  const notification = await Notification.findById(notificationId);
  if (notification) {
    notification.isRead = true;
    await notification.save();
  }
  return notification;
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ to: userId, isRead: false }, { isRead: true });
};
