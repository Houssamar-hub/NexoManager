import Joi from "joi";

// Auth schemas
export const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Le nom complet est obligatoire",
    "string.min": "Le nom complet doit comporter au moins 2 caractères",
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Format d'email invalide",
    "string.empty": "L'email est obligatoire",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Le mot de passe doit comporter au moins 8 caractères",
    "string.empty": "Le mot de passe est obligatoire",
  }),
  centerName: Joi.string().trim().min(2).max(150).required().messages({
    "string.empty": "Le nom du centre est obligatoire",
  }),
  phone: Joi.string().trim().allow("").optional(),
  address: Joi.string().trim().allow("").optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Format d'email invalide",
    "string.empty": "L'email est obligatoire",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Le mot de passe est obligatoire",
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Le mot de passe actuel est obligatoire",
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    "string.min": "Le nouveau mot de passe doit comporter au moins 8 caractères",
    "string.empty": "Le nouveau mot de passe est obligatoire",
  }),
});

// Student schemas
export const createStudentSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Le prénom est obligatoire",
  }),
  lastName: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Le nom de famille est obligatoire",
  }),
  dateOfBirth: Joi.date().iso().max("now").allow(null, "").optional().messages({
    "date.max": "La date de naissance ne peut pas être dans le futur",
  }),
  gender: Joi.string().valid("male", "female").optional(),
  parentName: Joi.string().trim().allow("", null).optional(),
  parentPhone: Joi.string().trim().allow("", null).optional(),
  parentEmail: Joi.string().trim().email().lowercase().allow("", null).optional(),
  schoolLevel: Joi.string().trim().allow("", null).optional(),
  registrationNumber: Joi.string().trim().allow("", null).optional(),
  notes: Joi.string().trim().allow("", null).optional(),
});

export const updateStudentSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  dateOfBirth: Joi.date().iso().max("now").allow(null, "").optional(),
  gender: Joi.string().valid("male", "female").optional(),
  parentName: Joi.string().trim().allow("", null).optional(),
  parentPhone: Joi.string().trim().allow("", null).optional(),
  parentEmail: Joi.string().trim().email().lowercase().allow("", null).optional(),
  schoolLevel: Joi.string().trim().allow("", null).optional(),
  registrationNumber: Joi.string().trim().allow("", null).optional(),
  status: Joi.string().valid("active", "suspended", "left").optional(),
  notes: Joi.string().trim().allow("", null).optional(),
}).min(1);

// Teacher schemas
export const createTeacherSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Le nom complet est obligatoire",
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Format d'email invalide",
    "string.empty": "L'email est obligatoire",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Le mot de passe doit comporter au moins 8 caractères",
    "string.empty": "Le mot de passe est obligatoire",
  }),
  phone: Joi.string().trim().allow("", null).optional(),
  specialization: Joi.string().trim().allow("", null).optional(),
});

export const updateTeacherSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().trim().email().lowercase().optional(),
  phone: Joi.string().trim().allow("", null).optional(),
  specialization: Joi.string().trim().allow("", null).optional(),
  status: Joi.string().valid("active", "inactive").optional(),
}).min(1);

// Group schemas
const scheduleSlotSchema = Joi.object({
  day: Joi.string()
    .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    .required(),
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required(),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required(),
}).custom((value, helpers) => {
  if (value.startTime >= value.endTime) {
    return helpers.message("L'heure de début doit être antérieure à l'heure de fin");
  }
  return value;
});

export const createGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Le nom du groupe est obligatoire",
  }),
  subject: Joi.string().trim().required().messages({
    "string.empty": "La matière est obligatoire",
  }),
  schoolLevel: Joi.string().trim().required().messages({
    "string.empty": "Le niveau scolaire est obligatoire",
  }),
  description: Joi.string().trim().allow("", null).optional(),
  teacher: Joi.string().hex().length(24).allow(null, "").optional(),
  capacity: Joi.number().integer().min(1).max(200).default(20),
  schedule: Joi.array().items(scheduleSlotSchema).default([]),
});

export const updateGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  subject: Joi.string().trim().optional(),
  schoolLevel: Joi.string().trim().optional(),
  description: Joi.string().trim().allow("", null).optional(),
  teacher: Joi.string().hex().length(24).allow(null, "").optional(),
  capacity: Joi.number().integer().min(1).max(200).optional(),
  schedule: Joi.array().items(scheduleSlotSchema).optional(),
  status: Joi.string().valid("active", "inactive").optional(),
}).min(1);

// Attendance schemas
export const createAttendanceSchema = Joi.object({
  student: Joi.string().hex().length(24).required().messages({
    "any.required": "L'élève est obligatoire",
  }),
  group: Joi.string().hex().length(24).required().messages({
    "any.required": "Le groupe est obligatoire",
  }),
  date: Joi.date().iso().required().messages({
    "any.required": "La date est obligatoire",
  }),
  sessionStartTime: Joi.string()
    .pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "Format d'heure invalide (HH:mm)",
      "any.required": "L'heure de séance est obligatoire",
    }),
  status: Joi.string()
    .valid("present", "absent", "late", "excused")
    .default("present"),
  notes: Joi.string().trim().allow("", null).optional(),
});

export const bulkAttendanceSchema = Joi.object({
  group: Joi.string().hex().length(24).required().messages({
    "any.required": "Le groupe est obligatoire",
  }),
  date: Joi.date().iso().required().messages({
    "any.required": "La date est obligatoire",
  }),
  sessionStartTime: Joi.string()
    .pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "Format d'heure invalide (HH:mm)",
    }),
  records: Joi.array()
    .items(
      Joi.object({
        student: Joi.string().hex().length(24).required(),
        status: Joi.string()
          .valid("present", "absent", "late", "excused")
          .required(),
        notes: Joi.string().trim().allow("", null).optional(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Au moins un élève doit être renseigné",
    }),
});

// Payment schemas
export const createPaymentSchema = Joi.object({
  student: Joi.string().hex().length(24).required().messages({
    "any.required": "L'élève est obligatoire",
  }),
  group: Joi.string().hex().length(24).required().messages({
    "any.required": "Le groupe est obligatoire",
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    "number.positive": "Le montant doit être strictement supérieur à 0",
    "any.required": "Le montant est obligatoire",
  }),
  paidAmount: Joi.number().min(0).precision(2).default(0),
  dueDate: Joi.date().iso().required().messages({
    "any.required": "La date d'échéance est obligatoire",
  }),
  paymentDate: Joi.date().iso().optional(),
  paymentMethod: Joi.string()
    .valid("cash", "bank_transfer", "card", "other")
    .default("cash"),
  description: Joi.string().trim().allow("", null).optional(),
}).custom((value, helpers) => {
  if (value.paidAmount > value.amount) {
    return helpers.message("Le montant payé ne peut pas excéder le montant total");
  }
  return value;
});

export const updatePaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  paidAmount: Joi.number().min(0).precision(2).optional(),
  dueDate: Joi.date().iso().optional(),
  paymentDate: Joi.date().iso().optional(),
  paymentMethod: Joi.string()
    .valid("cash", "bank_transfer", "card", "other")
    .optional(),
  description: Joi.string().trim().allow("", null).optional(),
}).min(1);

// Center schema
export const updateCenterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  email: Joi.string().trim().email().lowercase().allow("", null).optional(),
  phone: Joi.string().trim().allow("", null).optional(),
  address: Joi.string().trim().allow("", null).optional(),
}).min(1);
