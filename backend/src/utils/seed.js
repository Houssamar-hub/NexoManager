import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";

// Fix Windows DNS resolution for MongoDB Atlas SRV records
if (dns && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if system restricts custom DNS servers
  }
}

import Center from "../models/Center.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Group from "../models/Group.js";
import Attendance from "../models/Attendance.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nexomanager";

export const seedDatabase = async () => {
  try {
    console.log("🔌 Connexion à MongoDB pour le seeding...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✅ Connecté à MongoDB.");

    // 1. Create or Find Center
    const centerEmail = "contact@excellence-educative.ma";
    let center = await Center.findOne({ email: centerEmail });

    if (!center) {
      center = await Center.create({
        name: "Centre d'Excellence Éducative",
        email: centerEmail,
        phone: "+212 522 34 56 78",
        address: "75 Boulevard d'Anfa, Casablanca",
        status: "active",
      });
      console.log(`🏢 Centre créé : ${center.name} (${center._id})`);
    } else {
      console.log(`🏢 Centre existant trouvé : ${center.name} (${center._id})`);
    }

    const centerId = center._id;

    // Optional: Clean up existing center's demo data for fresh seed
    await Promise.all([
      User.deleteMany({ center: centerId }),
      Student.deleteMany({ center: centerId }),
      Group.deleteMany({ center: centerId }),
      Attendance.deleteMany({ center: centerId }),
      Payment.deleteMany({ center: centerId }),
      Notification.deleteMany({ center: centerId }),
    ]);
    console.log("🧹 Données précédentes du centre nettoyées.");

    // 2. Create Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("AdminPass123!", salt);
    const managerPassword = await bcrypt.hash("ManagerPass123!", salt);
    const teacherPassword = await bcrypt.hash("TeacherPass123!", salt);

    const admin = await User.create({
      fullName: "Dr. Karim Alami",
      email: "admin@excellence.edu",
      password: adminPassword,
      role: "admin",
      center: centerId,
      phone: "+212 661 11 22 33",
      status: "active",
    });

    const manager = await User.create({
      fullName: "Fatima Zahra Benali",
      email: "manager@excellence.edu",
      password: managerPassword,
      role: "manager",
      center: centerId,
      phone: "+212 662 33 44 55",
      status: "active",
    });

    const teacherMath = await User.create({
      fullName: "Prof. Mohammed Tazi",
      email: "prof.maths@excellence.edu",
      password: teacherPassword,
      role: "teacher",
      center: centerId,
      phone: "+212 663 55 66 77",
      specialization: "Mathématiques",
      status: "active",
    });

    const teacherPhys = await User.create({
      fullName: "Prof. Amina Chraibi",
      email: "prof.physique@excellence.edu",
      password: teacherPassword,
      role: "teacher",
      center: centerId,
      phone: "+212 664 77 88 99",
      specialization: "Physique-Chimie",
      status: "active",
    });

    console.log("👥 Utilisateurs créés (Admin, Manager, 2 Professeurs).");

    // 3. Create Students
    const studentData = [
      {
        firstName: "Yassine",
        lastName: "Berrada",
        dateOfBirth: new Date("2007-04-12"),
        gender: "male",
        parentName: "Omar Berrada",
        parentPhone: "+212 670 12 34 56",
        parentEmail: "o.berrada@gmail.com",
        schoolLevel: "2ème Bac Sciences Maths",
        registrationNumber: "ETU-2026-001",
        status: "active",
      },
      {
        firstName: "Sara",
        lastName: "Mansouri",
        dateOfBirth: new Date("2007-09-24"),
        gender: "female",
        parentName: "Nadia Mansouri",
        parentPhone: "+212 671 23 45 67",
        parentEmail: "nadia.mansouri@gmail.com",
        schoolLevel: "2ème Bac Sciences Physiques",
        registrationNumber: "ETU-2026-002",
        status: "active",
      },
      {
        firstName: "Mehdi",
        lastName: "El Amrani",
        dateOfBirth: new Date("2008-01-15"),
        gender: "male",
        parentName: "Hassan El Amrani",
        parentPhone: "+212 672 34 56 78",
        parentEmail: "hassan.amrani@gmail.com",
        schoolLevel: "1ère Bac Sciences Expérimentales",
        registrationNumber: "ETU-2026-003",
        status: "active",
      },
      {
        firstName: "Salma",
        lastName: "Kadiri",
        dateOfBirth: new Date("2008-06-30"),
        gender: "female",
        parentName: "Mounir Kadiri",
        parentPhone: "+212 673 45 67 89",
        parentEmail: "mounir.kadiri@hotmail.com",
        schoolLevel: "1ère Bac Sciences Maths",
        registrationNumber: "ETU-2026-004",
        status: "active",
      },
      {
        firstName: "Amine",
        lastName: "Idrissi",
        dateOfBirth: new Date("2009-11-05"),
        gender: "male",
        parentName: "Khadija Idrissi",
        parentPhone: "+212 674 56 78 90",
        parentEmail: "khadija.idrissi@yahoo.fr",
        schoolLevel: "Tronc Commun Scientifique",
        registrationNumber: "ETU-2026-005",
        status: "active",
      },
      {
        firstName: "Rania",
        lastName: "Bennani",
        dateOfBirth: new Date("2010-03-18"),
        gender: "female",
        parentName: "Tariq Bennani",
        parentPhone: "+212 675 67 89 01",
        parentEmail: "tariq.bennani@gmail.com",
        schoolLevel: "3ème Année Collège",
        registrationNumber: "ETU-2026-006",
        status: "active",
      },
      {
        firstName: "Hamza",
        lastName: "Cherkaoui",
        dateOfBirth: new Date("2010-08-22"),
        gender: "male",
        parentName: "Zineb Cherkaoui",
        parentPhone: "+212 676 78 90 12",
        parentEmail: "zineb.cherkaoui@gmail.com",
        schoolLevel: "3ème Année Collège",
        registrationNumber: "ETU-2026-007",
        status: "active",
      },
      {
        firstName: "Ines",
        lastName: "Naciri",
        dateOfBirth: new Date("2007-12-08"),
        gender: "female",
        parentName: "Kamal Naciri",
        parentPhone: "+212 677 89 01 23",
        parentEmail: "kamal.naciri@gmail.com",
        schoolLevel: "2ème Bac Sciences Maths",
        registrationNumber: "ETU-2026-008",
        status: "active",
      },
    ];

    const createdStudents = await Student.insertMany(
      studentData.map((s) => ({
        ...s,
        center: centerId,
        createdBy: admin._id,
      }))
    );
    console.log(`🎓 ${createdStudents.length} élèves créés.`);

    // 4. Create Groups
    const sIds = createdStudents.map((s) => s._id);

    const group1 = await Group.create({
      name: "Mathématiques 2ème Bac SM - Groupe A",
      subject: "Mathématiques",
      schoolLevel: "2ème Bac Sciences Maths",
      description: "Préparation intensive au baccalauréat national et aux concours.",
      teacher: teacherMath._id,
      center: centerId,
      createdBy: admin._id,
      capacity: 15,
      students: [sIds[0], sIds[1], sIds[7]],
      schedule: [
        { day: "Monday", startTime: "18:00", endTime: "20:00", room: "Salle Al-Khwarizmi" },
        { day: "Wednesday", startTime: "18:00", endTime: "20:00", room: "Salle Al-Khwarizmi" },
      ],
      status: "active",
    });

    const group2 = await Group.create({
      name: "Physique-Chimie 1ère Bac Exp",
      subject: "Physique-Chimie",
      schoolLevel: "1ère Bac Sciences Expérimentales",
      description: "Mécanique, électricité, réactions acide-base et optique.",
      teacher: teacherPhys._id,
      center: centerId,
      createdBy: admin._id,
      capacity: 12,
      students: [sIds[2], sIds[3], sIds[4]],
      schedule: [
        { day: "Tuesday", startTime: "17:30", endTime: "19:30", room: "Labo Curie" },
        { day: "Thursday", startTime: "17:30", endTime: "19:30", room: "Labo Curie" },
      ],
      status: "active",
    });

    const group3 = await Group.create({
      name: "Soutien Maths & Logique 3AC",
      subject: "Mathématiques",
      schoolLevel: "3ème Année Collège",
      description: "Renforcement des bases d'algèbre et de géométrie plane.",
      teacher: teacherMath._id,
      center: centerId,
      createdBy: admin._id,
      capacity: 10,
      students: [sIds[5], sIds[6]],
      schedule: [
        { day: "Saturday", startTime: "10:00", endTime: "12:00", room: "Salle Pythagore" },
      ],
      status: "active",
    });

    console.log("📚 3 Groupes d'études créés.");

    // 5. Create Attendance Records (over the past 2 weeks)
    const attendances = [];
    const now = new Date();

    // Session 1: Group 1 (14 days ago)
    const d1 = new Date(now.getTime() - 14 * 86400000);
    attendances.push(
      { student: sIds[0], group: group1._id, center: centerId, date: d1, sessionStartTime: "18:00", status: "present", recordedBy: teacherMath._id },
      { student: sIds[1], group: group1._id, center: centerId, date: d1, sessionStartTime: "18:00", status: "present", recordedBy: teacherMath._id },
      { student: sIds[7], group: group1._id, center: centerId, date: d1, sessionStartTime: "18:00", status: "late", notes: "15 min de retard (embouteillage)", recordedBy: teacherMath._id }
    );

    // Session 2: Group 1 (7 days ago)
    const d2 = new Date(now.getTime() - 7 * 86400000);
    attendances.push(
      { student: sIds[0], group: group1._id, center: centerId, date: d2, sessionStartTime: "18:00", status: "absent", notes: "Absence non justifiée", recordedBy: teacherMath._id },
      { student: sIds[1], group: group1._id, center: centerId, date: d2, sessionStartTime: "18:00", status: "present", recordedBy: teacherMath._id },
      { student: sIds[7], group: group1._id, center: centerId, date: d2, sessionStartTime: "18:00", status: "present", recordedBy: teacherMath._id }
    );

    // Session 3: Group 2 (10 days ago)
    const d3 = new Date(now.getTime() - 10 * 86400000);
    attendances.push(
      { student: sIds[2], group: group2._id, center: centerId, date: d3, sessionStartTime: "17:30", status: "present", recordedBy: teacherPhys._id },
      { student: sIds[3], group: group2._id, center: centerId, date: d3, sessionStartTime: "17:30", status: "present", recordedBy: teacherPhys._id },
      { student: sIds[4], group: group2._id, center: centerId, date: d3, sessionStartTime: "17:30", status: "excused", notes: "Certificat médical fourni", recordedBy: teacherPhys._id }
    );

    // Session 4: Group 3 (4 days ago)
    const d4 = new Date(now.getTime() - 4 * 86400000);
    attendances.push(
      { student: sIds[5], group: group3._id, center: centerId, date: d4, sessionStartTime: "10:00", status: "present", recordedBy: teacherMath._id },
      { student: sIds[6], group: group3._id, center: centerId, date: d4, sessionStartTime: "10:00", status: "present", recordedBy: teacherMath._id }
    );

    await Attendance.insertMany(attendances);
    console.log(`📋 ${attendances.length} relevés de présence enregistrés.`);

    // 6. Create Payments
    const payments = [
      // Last month fully paid
      {
        student: sIds[0],
        group: group1._id,
        center: centerId,
        amount: 800,
        paidAmount: 800,
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 5),
        paymentDate: new Date(now.getFullYear(), now.getMonth() - 1, 3),
        paymentMethod: "bank_transfer",
        status: "paid",
        description: "Mensualité Maths SM - Mois précédent",
        recordedBy: manager._id,
      },
      {
        student: sIds[1],
        group: group1._id,
        center: centerId,
        amount: 800,
        paidAmount: 800,
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 5),
        paymentDate: new Date(now.getFullYear(), now.getMonth() - 1, 4),
        paymentMethod: "cash",
        status: "paid",
        description: "Mensualité Maths SM - Mois précédent",
        recordedBy: manager._id,
      },
      // Current month - Paid
      {
        student: sIds[0],
        group: group1._id,
        center: centerId,
        amount: 800,
        paidAmount: 800,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        paymentDate: new Date(now.getFullYear(), now.getMonth(), 4),
        paymentMethod: "cash",
        status: "paid",
        description: "Mensualité Maths SM - Mois en cours",
        recordedBy: manager._id,
      },
      // Current month - Partial
      {
        student: sIds[2],
        group: group2._id,
        center: centerId,
        amount: 700,
        paidAmount: 350,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        paymentDate: new Date(now.getFullYear(), now.getMonth(), 8),
        paymentMethod: "cash",
        status: "partial",
        description: "Acompte Mensualité Physique-Chimie",
        recordedBy: manager._id,
      },
      // Current month - Pending (Due soon)
      {
        student: sIds[3],
        group: group2._id,
        center: centerId,
        amount: 700,
        paidAmount: 0,
        dueDate: new Date(now.getTime() + 5 * 86400000), // In 5 days
        paymentMethod: "other",
        status: "pending",
        description: "Mensualité Physique-Chimie - En attente",
        recordedBy: manager._id,
      },
      // Current month - Overdue
      {
        student: sIds[1],
        group: group1._id,
        center: centerId,
        amount: 800,
        paidAmount: 0,
        dueDate: new Date(now.getTime() - 6 * 86400000), // Due 6 days ago
        paymentMethod: "cash",
        status: "overdue",
        description: "Mensualité Maths SM - En retard de règlement",
        recordedBy: manager._id,
      },
      // Group 3 - Paid
      {
        student: sIds[5],
        group: group3._id,
        center: centerId,
        amount: 500,
        paidAmount: 500,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        paymentDate: new Date(now.getFullYear(), now.getMonth(), 2),
        paymentMethod: "card",
        status: "paid",
        description: "Mensualité Soutien Maths 3AC",
        recordedBy: manager._id,
      },
    ];

    await Payment.insertMany(payments);
    console.log(`💳 ${payments.length} paiements/factures enregistrés.`);

    // 7. Create Notifications
    const notifications = [
      {
        center: centerId,
        recipient: manager._id,
        title: "Échéance dépassée : Sara Mansouri",
        message: "La mensualité de 800 MAD pour le cours de Maths SM est arrivée à échéance le 19 courant sans versement.",
        type: "payment_overdue",
        relatedStudent: sIds[1],
      },
      {
        center: centerId,
        recipient: manager._id,
        title: "Absence enregistrée : Yassine Berrada",
        message: "L'élève Yassine Berrada a été marqué absent non justifié lors de la dernière séance de Mathématiques.",
        type: "absence",
        relatedStudent: sIds[0],
      },
      {
        center: centerId,
        title: "Bienvenue sur NexoManager",
        message: "Votre centre d'excellence éducative est configuré. Vous pouvez dès maintenant gérer les inscriptions, les plannings et les finances.",
        type: "general",
      },
    ];

    await Notification.insertMany(notifications);
    console.log(`🔔 ${notifications.length} notifications initialisées.`);

    console.log("\n=======================================================");
    console.log("🎉 SEEDING TERMINÉ AVEC SUCCÈS !");
    console.log("=======================================================");
    console.log("🏢 Centre : Centre d'Excellence Éducative");
    console.log("🔑 Comptes de test créés :");
    console.log("   • Administrateur : admin@excellence.edu      / AdminPass123!");
    console.log("   • Responsable    : manager@excellence.edu    / ManagerPass123!");
    console.log("   • Professeur 1   : prof.maths@excellence.edu / TeacherPass123!");
    console.log("   • Professeur 2   : prof.physique@excellence.edu / TeacherPass123!");
    console.log("📊 Données réelles insérées :");
    console.log("   • 8 Élèves actifs");
    console.log("   • 3 Groupes d'études avec plannings et salles");
    console.log("   • 11 Relevés de présence sur 4 séances");
    console.log("   • 7 Factures/Paiements (Payés, Partiels, En retard)");
    console.log("   • 3 Notifications d'activité");
    console.log("=======================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur pendant le seeding :", error);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  seedDatabase();
}
