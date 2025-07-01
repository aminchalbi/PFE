const Notification = require('../models/Notification');

// Envoyer une notification à un utilisateur
const sendNotification = async (userId, message) => {
  try {
    const notification = new Notification({
      user: userId,
      message,
    });

    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error sending notification:', err);
    throw err;
  }
};

// Marquer une notification comme lue
const markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    return notification;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    throw err;
  }
};

// Récupérer toutes les notifications d'un utilisateur
const getNotifications = async (userId) => {
  try {
    const notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    }); // Tri par date décroissante
    return notifications;
  } catch (err) {
    console.error('Error fetching notifications:', err);
    throw err;
  }
};

module.exports = {
  sendNotification,
  markAsRead,
  getNotifications,
};