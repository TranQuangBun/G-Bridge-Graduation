import bcrypt from "bcrypt";
import { Op } from "sequelize";
import {
  User,
  InterpreterProfile,
  Language,
  Certification,
} from "./src/models/index.js";
import { sequelize } from "./src/config/database.js";

async function seedInterpreters() {
  try {
    console.log("🌱 Starting to seed interpreter data...");

    // Connect to database
    await sequelize.authenticate();
    console.log("✓ Database connected");

    // Delete old test data first
    console.log("🗑️  Deleting old test data...");
    await User.destroy({
      where: {
        email: {
          [Op.like]: "interpreter%@example.com",
        },
      },
    });
    console.log("✓ Old data deleted");

    // Hash password for all test users
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Create interpreter users
    const interpreters = await User.bulkCreate([
      {
        fullName: "Nguyen Van A",
        email: "interpreter1@example.com",
        passwordHash,
        role: "interpreter",
        phone: "0901234567",
        address: "123 Nguyen Hue, District 1, Ho Chi Minh City",
        avatar: "https://i.pravatar.cc/150?img=11",
        isActive: true,
        isVerified: true,
      },
      {
        fullName: "Tran Thi B",
        email: "interpreter2@example.com",
        passwordHash,
        role: "interpreter",
        phone: "0912345678",
        address: "456 Le Loi, District 3, Ho Chi Minh City",
        avatar: "https://i.pravatar.cc/150?img=22",
        isActive: true,
        isVerified: true,
      },
      {
        fullName: "Le Minh C",
        email: "interpreter3@example.com",
        passwordHash,
        role: "interpreter",
        phone: "0923456789",
        address: "789 Tran Hung Dao, Hanoi",
        avatar: "https://i.pravatar.cc/150?img=33",
        isActive: true,
        isVerified: true,
      },
      {
        fullName: "Pham Thu D",
        email: "interpreter4@example.com",
        passwordHash,
        role: "interpreter",
        phone: "0934567890",
        address: "321 Hai Ba Trung, Da Nang",
        avatar: "https://i.pravatar.cc/150?img=44",
        isActive: true,
        isVerified: true,
      },
      {
        fullName: "Hoang Van E",
        email: "interpreter5@example.com",
        passwordHash,
        role: "interpreter",
        phone: "0945678901",
        address: "654 Nguyen Trai, Hanoi",
        avatar: "https://i.pravatar.cc/150?img=55",
        isActive: true,
        isVerified: true,
      },
    ]);

    console.log(`✓ Created ${interpreters.length} interpreter users`);

    // Create interpreter profiles
    const profiles = [
      {
        userId: interpreters[0].id,
        languages: ["English", "Vietnamese", "Japanese"],
        specializations: ["Medical", "Legal"],
        experience: 5,
        hourlyRate: 25.0,
        currency: "USD",
        availability: {
          monday: ["09:00-17:00"],
          tuesday: ["09:00-17:00"],
          wednesday: ["09:00-17:00"],
          thursday: ["09:00-17:00"],
          friday: ["09:00-17:00"],
        },
        certifications: [
          { name: "IELTS", score: "8.0" },
          { name: "TOEFL", score: "110" },
        ],
        portfolio:
          "Specialized in medical and legal interpretation with 5 years of experience. Fluent in English, Vietnamese, and Japanese.",
        rating: 4.5,
        totalReviews: 23,
        completedJobs: 45,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: interpreters[1].id,
        languages: ["English", "Vietnamese", "Korean"],
        specializations: ["Business", "Technical"],
        experience: 3,
        hourlyRate: 20.0,
        currency: "USD",
        availability: {
          monday: ["09:00-17:00"],
          tuesday: ["09:00-17:00"],
          wednesday: ["09:00-17:00"],
          thursday: ["09:00-17:00"],
          friday: ["09:00-17:00"],
        },
        certifications: [{ name: "TOEFL", score: "105" }],
        portfolio:
          "Business and technical interpreter with experience in corporate settings. Native Vietnamese, fluent in English and Korean.",
        rating: 4.2,
        totalReviews: 15,
        completedJobs: 28,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: interpreters[2].id,
        languages: ["English", "Vietnamese", "French"],
        specializations: ["Legal", "Conference"],
        experience: 8,
        hourlyRate: 35.0,
        currency: "USD",
        availability: {
          monday: ["09:00-17:00"],
          tuesday: ["09:00-17:00"],
          wednesday: ["09:00-17:00"],
          thursday: ["09:00-17:00"],
          friday: ["09:00-17:00"],
        },
        certifications: [
          { name: "IELTS", score: "8.5" },
          { name: "DELF", score: "C1" },
        ],
        portfolio:
          "Experienced legal and conference interpreter. Over 8 years of professional experience.",
        rating: 4.8,
        totalReviews: 42,
        completedJobs: 89,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: interpreters[3].id,
        languages: ["English", "Vietnamese", "Chinese", "Japanese"],
        specializations: ["Medical", "Technical", "Business"],
        experience: 10,
        hourlyRate: 45.0,
        currency: "USD",
        availability: {
          monday: ["09:00-17:00"],
          tuesday: ["09:00-17:00"],
          wednesday: ["09:00-17:00"],
          thursday: ["09:00-17:00"],
          friday: ["09:00-17:00"],
        },
        certifications: [
          { name: "IELTS", score: "9.0" },
          { name: "JLPT", score: "N1" },
          { name: "HSK", score: "6" },
        ],
        portfolio:
          "Senior interpreter with 10+ years experience. Specialized in medical, technical, and business interpretation.",
        rating: 4.9,
        totalReviews: 67,
        completedJobs: 134,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: interpreters[4].id,
        languages: ["English", "Vietnamese", "German"],
        specializations: ["Technical", "Conference"],
        experience: 4,
        hourlyRate: 22.0,
        currency: "USD",
        availability: {
          monday: ["09:00-17:00"],
          tuesday: ["09:00-17:00"],
          wednesday: ["09:00-17:00"],
          thursday: ["09:00-17:00"],
          friday: ["09:00-17:00"],
        },
        certifications: [
          { name: "IELTS", score: "7.5" },
          { name: "Goethe-Zertifikat", score: "B2" },
        ],
        portfolio:
          "Technical and conference interpreter with expertise in IT and engineering fields.",
        rating: 4.3,
        totalReviews: 18,
        completedJobs: 32,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
    ];

    await InterpreterProfile.bulkCreate(profiles);
    console.log(`✓ Created ${profiles.length} interpreter profiles`);

    // Create language records
    const languageRecords = [];

    // English for all
    interpreters.forEach((interpreter, index) => {
      languageRecords.push({
        userId: interpreter.id,
        name: "English",
        proficiencyLevel: "Professional",
        canSpeak: true,
        canWrite: true,
        canRead: true,
        yearsOfExperience: [5, 3, 8, 10, 4][index],
        isActive: true,
      });
    });

    // Vietnamese for all
    interpreters.forEach((interpreter, index) => {
      languageRecords.push({
        userId: interpreter.id,
        name: "Vietnamese",
        proficiencyLevel: "Native",
        canSpeak: true,
        canWrite: true,
        canRead: true,
        yearsOfExperience: [5, 3, 8, 10, 4][index],
        isActive: true,
      });
    });

    // Additional languages
    const additionalLangs = [
      {
        userId: interpreters[0].id,
        name: "Japanese",
        level: "Advanced",
        exp: 3,
      },
      { userId: interpreters[1].id, name: "Korean", level: "Advanced", exp: 2 },
      {
        userId: interpreters[2].id,
        name: "French",
        level: "Professional",
        exp: 5,
      },
      {
        userId: interpreters[3].id,
        name: "Japanese",
        level: "Advanced",
        exp: 4,
      },
      {
        userId: interpreters[3].id,
        name: "Chinese",
        level: "Advanced",
        exp: 4,
      },
      {
        userId: interpreters[4].id,
        name: "German",
        level: "Professional",
        exp: 3,
      },
    ];

    additionalLangs.forEach((lang) => {
      languageRecords.push({
        userId: lang.userId,
        name: lang.name,
        proficiencyLevel: lang.level,
        canSpeak: true,
        canWrite: true,
        canRead: true,
        yearsOfExperience: lang.exp,
        isActive: true,
      });
    });

    await Language.bulkCreate(languageRecords);
    console.log(`✓ Created ${languageRecords.length} language records`);

    // Create certifications
    const certificationRecords = [
      {
        userId: interpreters[0].id,
        name: "IELTS Academic",
        issuingOrganization: "British Council",
        issueDate: "2020-01-15",
        expiryDate: "2022-01-15",
        credentialId: `IELTS-${Math.floor(Math.random() * 10000)}`,
        score: "8.0",
        description: "Overall band score: 8.0",
        isVerified: true,
        isActive: true,
        verificationStatus: "approved",
      },
      {
        userId: interpreters[1].id,
        name: "TOEFL iBT",
        issuingOrganization: "ETS",
        issueDate: "2021-03-20",
        credentialId: `TOEFL-${Math.floor(Math.random() * 10000)}`,
        score: "105",
        description: "Total score: 105/120",
        isVerified: true,
        isActive: true,
        verificationStatus: "approved",
      },
      {
        userId: interpreters[2].id,
        name: "IELTS Academic",
        issuingOrganization: "British Council",
        issueDate: "2019-06-10",
        credentialId: `IELTS-${Math.floor(Math.random() * 10000)}`,
        score: "8.5",
        description: "Overall band score: 8.5",
        isVerified: true,
        isActive: true,
        verificationStatus: "approved",
      },
      {
        userId: interpreters[3].id,
        name: "IELTS Academic",
        issuingOrganization: "IDP",
        issueDate: "2018-09-15",
        credentialId: `IELTS-${Math.floor(Math.random() * 10000)}`,
        score: "9.0",
        description: "Overall band score: 9.0",
        isVerified: true,
        isActive: true,
        verificationStatus: "approved",
      },
      {
        userId: interpreters[4].id,
        name: "TOEFL iBT",
        issuingOrganization: "ETS",
        issueDate: "2020-11-25",
        credentialId: `TOEFL-${Math.floor(Math.random() * 10000)}`,
        score: "102",
        description: "Total score: 102/120",
        isVerified: true,
        isActive: true,
        verificationStatus: "approved",
      },
    ];

    await Certification.bulkCreate(certificationRecords);
    console.log(`✓ Created ${certificationRecords.length} certifications`);

    console.log("✅ Seeding completed successfully!");
    console.log("\nTest credentials:");
    console.log("Email: interpreter1@example.com - interpreter5@example.com");
    console.log("Password: Password123!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedInterpreters();
