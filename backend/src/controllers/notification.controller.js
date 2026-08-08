import  * as notificationService from '../services/notification.service.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotificationsForUser(req.user.userId);
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.userId);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
