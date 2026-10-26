import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Business Logic - Financial Calculations", () => {
  it("should calculate remaining balance correctly without negative results", () => {
    const calculateRemaining = (amount, paidAmount) => {
      return Math.max(0, amount - paidAmount);
    };

    assert.equal(calculateRemaining(500, 200), 300);
    assert.equal(calculateRemaining(500, 500), 0);
    assert.equal(calculateRemaining(500, 600), 0); // should not be negative
    assert.equal(calculateRemaining(0, 0), 0);
  });

  it("should calculate collection rate correctly without dividing by zero", () => {
    const calculateCollectionRate = (totalAmount, totalPaid) => {
      if (!totalAmount || totalAmount <= 0) return 0;
      return Math.round((totalPaid / totalAmount) * 10000) / 100;
    };

    assert.equal(calculateCollectionRate(1000, 750), 75);
    assert.equal(calculateCollectionRate(300, 100), 33.33);
    assert.equal(calculateCollectionRate(0, 0), 0);
    assert.equal(calculateCollectionRate(1000, 0), 0);
  });

  it("should determine payment status consistently", () => {
    const determineStatus = (amount, paidAmount, dueDate, now = new Date()) => {
      if (paidAmount >= amount) return "paid";
      if (paidAmount > 0) {
        if (new Date(dueDate) < now) return "overdue";
        return "partial";
      }
      if (new Date(dueDate) < now) return "overdue";
      return "pending";
    };

    const pastDate = new Date(Date.now() - 86400000); // 1 day ago
    const futureDate = new Date(Date.now() + 86400000); // 1 day future

    // Fully paid
    assert.equal(determineStatus(500, 500, pastDate), "paid");
    assert.equal(determineStatus(500, 500, futureDate), "paid");

    // Partial and overdue
    assert.equal(determineStatus(500, 200, pastDate), "overdue");

    // Partial and not overdue
    assert.equal(determineStatus(500, 200, futureDate), "partial");

    // Zero paid and overdue
    assert.equal(determineStatus(500, 0, pastDate), "overdue");

    // Zero paid and not overdue
    assert.equal(determineStatus(500, 0, futureDate), "pending");
  });
});

describe("Business Logic - Attendance Rate Calculations", () => {
  it("should compute attendance rate as (present + late) / total", () => {
    const calculateAttendanceRate = (total, present, late) => {
      if (!total || total <= 0) return 0;
      return Number((((present + late) / total) * 100).toFixed(2));
    };

    // 10 students: 8 present, 1 late, 1 absent -> (8+1)/10 = 90%
    assert.equal(calculateAttendanceRate(10, 8, 1), 90);

    // 0 records -> 0%
    assert.equal(calculateAttendanceRate(0, 0, 0), 0);

    // 3 students: 1 present, 0 late, 2 absent -> 33.33%
    assert.equal(calculateAttendanceRate(3, 1, 0), 33.33);
  });
});

describe("Business Logic - Notification Deduplication Keys", () => {
  it("should generate deterministic deduplication keys", () => {
    const getPaymentDedupeKey = (paymentId) => `payment-overdue:${paymentId}`;
    const getAbsenceDedupeKey = (attendanceId) => `absence:${attendanceId}`;

    assert.equal(getPaymentDedupeKey("123"), "payment-overdue:123");
    assert.equal(getAbsenceDedupeKey("456"), "absence:456");
  });
});
