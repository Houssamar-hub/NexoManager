import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    sessionStartTime: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

attendanceSchema.index(
  {
    center: 1,
    group: 1,
    student: 1,
    date: 1,
    sessionStartTime: 1,
  },
  { unique: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;  