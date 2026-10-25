import mongoose from "mongoose";
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
      title: title.trim(),
      message: message.trim(),
      type: type || "general",
      relatedStudent: relatedStudent || null,
      relatedPayment: relatedPayment || null,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Notification créée avec succès",
      notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la notification",
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { isRead, type } = req.query;

    const filter = {
      center: req.user.center,
      $or: [{ recipient: req.user._id }, { recipient: null }],
    };

    if (isRead === "true") filter.isRead = true;
    if (isRead === "false") filter.isRead = false;
    if (type) filter.type = type;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("relatedStudent", "firstName lastName registrationNumber")
        .populate("relatedPayment", "amount paidAmount status dueDate")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Notification.countDocuments({
        center: req.user.center,
        $or: [{ recipient: req.user._id }, { recipient: null }],
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des notifications",
    });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      center: req.user.center,
      $or: [{ recipient: req.user._id }, { recipient: null }],
    })
      .populate("relatedStudent", "firstName lastName registrationNumber")
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
    console.error("Get notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        center: req.user.center,
        $or: [{ recipient: req.user._id }, { recipient: null }],
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
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
    console.error("Mark read error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la notification",
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        center: req.user.center,
        $or: [{ recipient: req.user._id }, { recipient: null }],
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des notifications",
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Identifiant invalide",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      center: req.user.center,
      $or: [{ recipient: req.user._id }, { recipient: null }],
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
    console.error("Delete notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la notification",
    });
  }
};
