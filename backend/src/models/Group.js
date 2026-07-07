
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    schoolLevel: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    capacity: {
      type: Number,
      min: 1,
      default: 20,
    },

    schedule: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: true,
        },

        startTime: {
          type: String,
          required: true,
        },

        endTime: {
          type: String,
          required: true,
        },
      },
    ],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


groupSchema.index({ center: 1, name: 1, subject: 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;
