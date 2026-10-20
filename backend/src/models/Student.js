
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
    },

    parentName: {
      type: String,
      trim: true,
    },

    parentPhone: {
      type: String,
      trim: true,
    },

    parentEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    schoolLevel: {
      type: String,
      trim: true,
    },

    registrationNumber: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "left"],
      default: "active",
    },

    notes: {
      type: String,
      trim: true,
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

studentSchema.index(
  { center: 1, registrationNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      registrationNumber: { $type: "string" },
    },
  }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;
