import Notification from "../models/Notification.js";

export const createNotification = async (req, res) => {
  try {
    const { recipient, title, message, type, relatedStudent, relatedPayment } =
      req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Le titre et le message sont obligatoires",
      });
    }

    const notification = await Notification.create({
      center: req.user.center,
      recipient: recipient || null,
      title,
      message,
      type: type || "general",
      relatedStudent,
      relatedPayment,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Notification créée avec succès",
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la notification",
      error: error.message,
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { isRead, type } = req.query;

    const filter = {
      center: req.user.center,
      $or: [
        { recipient: req.user._id },
        { recipient: null },
      ],
    };

    if (isRead === "true") filter.isRead = true;
    if (isRead === "false") filter.isRead = false;
    if (type) filter.type = type;

    const notifications = await Notification.find(filter)
      .populate("relatedStudent", "firstName lastName")
      .populate("relatedPayment", "amount paidAmount status dueDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des notifications",
      error: error.message,
    });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      center: req.user.center,
      $or: [
        { recipient: req.user._id },
        { recipient: null },
      ],
    })
      .populate("relatedStudent", "firstName lastName")
      .populate("relatedPayment", "amount paidAmount status dueDate");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la notification",
      error: error.message,
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        center: req.user.center,
        $or: [
          { recipient: req.user._id },
          { recipient: null },
        ],
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marquée comme lue",
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la notification",
      error: error.message,
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      center: req.user.center,
      $or: [
        { recipient: req.user._id },
        { recipient: null },
      ],
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification supprimée avec succès",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la notification",
      error: error.message,
    });
  }
};