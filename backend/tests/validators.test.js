import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  createStudentSchema,
  updateStudentSchema,
  createTeacherSchema,
  updateTeacherSchema,
  createGroupSchema,
  updateGroupSchema,
  createAttendanceSchema,
  bulkAttendanceSchema,
  createPaymentSchema,
  updatePaymentSchema,
  updateCenterSchema,
} from "../src/validators/schemas.js";

describe("Validation Schemas - Authentication", () => {
  it("should validate a correct registration payload", () => {
    const payload = {
      fullName: "Yassine Mansouri",
      email: "yassine@nexomanager.com",
      password: "password123",
      centerName: "Centre Al Majd",
      phone: "+212600112233",
    };
    const { error, value } = registerSchema.validate(payload);
    assert.equal(error, undefined);
    assert.equal(value.email, "yassine@nexomanager.com");
  });

  it("should reject registration with password shorter than 8 chars", () => {
    const payload = {
      fullName: "Yassine",
      email: "test@test.com",
      password: "short",
      centerName: "Centre",
    };
    const { error } = registerSchema.validate(payload);
    assert.ok(error);
    assert.match(error.message, /8 caractères/);
  });

  it("should reject registration with invalid email", () => {
    const payload = {
      fullName: "Yassine",
      email: "invalid-email",
      password: "password123",
      centerName: "Centre",
    };
    const { error } = registerSchema.validate(payload);
    assert.ok(error);
  });

  it("should validate a correct login payload", () => {
    const payload = {
      email: "test@nexomanager.com",
      password: "securepassword",
    };
    const { error } = loginSchema.validate(payload);
    assert.equal(error, undefined);
  });

  it("should validate password change payload", () => {
    const payload = {
      currentPassword: "oldpassword",
      newPassword: "newpassword123",
    };
    const { error } = changePasswordSchema.validate(payload);
    assert.equal(error, undefined);
  });
});

describe("Validation Schemas - Students", () => {
  it("should validate valid student creation", () => {
    const payload = {
      firstName: "Karim",
      lastName: "Bennani",
      gender: "male",
      parentPhone: "0611223344",
      schoolLevel: "Tronc Commun",
      registrationNumber: "REG-2026-001",
    };
    const { error } = createStudentSchema.validate(payload);
    assert.equal(error, undefined);
  });

  it("should reject student creation when name is missing", () => {
    const payload = {
      firstName: "",
      lastName: "Bennani",
    };
    const { error } = createStudentSchema.validate(payload);
    assert.ok(error);
  });

  it("should reject future date of birth", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const payload = {
      firstName: "Salma",
      lastName: "Tahiri",
      dateOfBirth: futureDate.toISOString(),
    };
    const { error } = createStudentSchema.validate(payload);
    assert.ok(error);
  });
});

describe("Validation Schemas - Groups and Schedules", () => {
  it("should validate group creation with valid weekly schedule", () => {
    const payload = {
      name: "Maths Bac 1",
      subject: "Mathématiques",
      schoolLevel: "1ère Année Bac",
      capacity: 15,
      schedule: [
        {
          day: "Monday",
          startTime: "16:00",
          endTime: "18:00",
        },
        {
          day: "Wednesday",
          startTime: "14:00",
          endTime: "16:00",
        },
      ],
    };
    const { error } = createGroupSchema.validate(payload);
    assert.equal(error, undefined);
  });

  it("should reject group schedule when startTime is after endTime", () => {
    const payload = {
      name: "Physique Group",
      subject: "Physique",
      schoolLevel: "2ème Année Bac",
      schedule: [
        {
          day: "Tuesday",
          startTime: "18:00",
          endTime: "16:00", // invalid!
        },
      ],
    };
    const { error } = createGroupSchema.validate(payload);
    assert.ok(error);
    assert.match(error.message, /antérieure/);
  });
});

describe("Validation Schemas - Attendance", () => {
  const validMongoId = "507f1f77bcf86cd799439011";

  it("should validate single attendance creation", () => {
    const payload = {
      student: validMongoId,
      group: validMongoId,
      date: new Date().toISOString(),
      sessionStartTime: "14:30",
      status: "present",
    };
    const { error } = createAttendanceSchema.validate(payload);
    assert.equal(error, undefined);
  });

  it("should validate bulk attendance creation", () => {
    const payload = {
      group: validMongoId,
      date: new Date().toISOString(),
      sessionStartTime: "10:00",
      records: [
        { student: validMongoId, status: "present" },
        { student: validMongoId, status: "absent", notes: "Malade" },
      ],
    };
    const { error } = bulkAttendanceSchema.validate(payload);
    assert.equal(error, undefined);
  });

  it("should reject bulk attendance with empty records array", () => {
    const payload = {
      group: validMongoId,
      date: new Date().toISOString(),
      sessionStartTime: "10:00",
      records: [],
    };
    const { error } = bulkAttendanceSchema.validate(payload);
    assert.ok(error);
  });
});

describe("Validation Schemas - Payments and Finances", () => {
  const validMongoId = "507f1f77bcf86cd799439011";

  it("should validate payment creation with partial amount", () => {
    const payload = {
      student: validMongoId,
      group: validMongoId,
      amount: 500,
      paidAmount: 200,
      dueDate: "2026-11-01T00:00:00.000Z",
      paymentMethod: "cash",
    };
    const { error } = createPaymentSchema.validate(payload);
    assert.equal(error, undefined);
  });

  it("should reject negative amount", () => {
    const payload = {
      student: validMongoId,
      group: validMongoId,
      amount: -100,
      dueDate: "2026-11-01T00:00:00.000Z",
    };
    const { error } = createPaymentSchema.validate(payload);
    assert.ok(error);
  });

  it("should reject paidAmount greater than amount", () => {
    const payload = {
      student: validMongoId,
      group: validMongoId,
      amount: 400,
      paidAmount: 600, // overpayment rejected
      dueDate: "2026-11-01T00:00:00.000Z",
    };
    const { error } = createPaymentSchema.validate(payload);
    assert.ok(error);
    assert.match(error.message, /excéder/);
  });
});
