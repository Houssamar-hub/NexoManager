export type UserRole = "admin" | "manager" | "teacher";
export type UserStatus = "active" | "inactive";

export interface Center {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  specialization?: string;
  center?: string | Center;
  createdAt?: string;
  updatedAt?: string;
}

export type StudentStatus = "active" | "suspended" | "left";

export interface Student {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  schoolLevel?: string;
  registrationNumber?: string;
  status: StudentStatus;
  notes?: string;
  center: string;
  createdAt: string;
  updatedAt?: string;
}

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface ScheduleSlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface Group {
  _id: string;
  id?: string;
  name: string;
  subject: string;
  schoolLevel: string;
  description?: string;
  teacher?: User | string;
  students?: Student[] | string[];
  capacity: number;
  schedule: ScheduleSlot[];
  status: "active" | "inactive";
  center: string;
  enrolledCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  _id: string;
  id?: string;
  student: Student | string;
  group: Group | string;
  center: string;
  date: string;
  sessionStartTime: string;
  status: AttendanceStatus;
  notes?: string;
  recordedBy?: User | string;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentMethod = "cash" | "bank_transfer" | "card" | "other";
export type PaymentStatus = "pending" | "partial" | "paid" | "overdue";

export interface PaymentRecord {
  _id: string;
  id?: string;
  student: Student | any;
  group: Group | any;
  center: string;
  amount: number;
  paidAmount: number;
  remainingAmount?: number;
  paymentDate: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  effectiveStatus?: PaymentStatus;
  description?: string;
  recordedBy?: User | any;
  createdAt: string;
  updatedAt?: string;
}

export type NotificationType =
  | "payment_due"
  | "payment_overdue"
  | "absence"
  | "general";

export interface NotificationItem {
  _id: string;
  id?: string;
  center: string;
  recipient?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  relatedStudent?: Student | any;
  relatedPayment?: PaymentRecord | any;
  relatedAttendance?: AttendanceRecord | any;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface MonthlyStatistic {
  year: number;
  month: number;
  label: string;
  newStudents: number;
  collected: number;
  paymentCount: number;
}

export interface DashboardData {
  generatedAt: string;
  timeZone: string;
  overview: {
    students: {
      total: number;
      active: number;
      inactive: number;
    };
    teachers: {
      total: number;
      active: number;
      inactive: number;
    };
    groups: {
      total: number;
      active: number;
      inactive: number;
    };
  };
  attendance: {
    today: {
      totalRecords: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendanceRate: number;
    };
    currentMonth: {
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendanceRate: number;
    };
  };
  finance: {
    totalPayments: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    overduePaymentsCount: number;
    overdueAmount: number;
  };
  monthlyStatistics: MonthlyStatistic[];
  recent: {
    students: any[];
    payments: any[];
  };
}
