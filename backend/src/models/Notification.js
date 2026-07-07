import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: [
        "payment_due",
        "payment_overdue",
        "absence",
        "general",
      ],
      default: "general",
    },

    relatedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    relatedPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    relatedAttendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },

    dedupeKey: {
      type: String,
      default: undefined,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({
  center: 1,
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});




export default Notification;