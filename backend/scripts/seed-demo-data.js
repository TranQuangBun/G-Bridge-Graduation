/**
 * Demo Sample Data Seeding Script
 * 
 * This script seeds SAMPLE DATA for demo/testing purposes:
 * - Users (admin, clients, interpreters)
 * - Organizations
 * - Jobs and Job Applications
 * - Conversations and Messages
 * - Notifications
 * - Saved Jobs and Saved Interpreters
 * - Certifications
 * 
 * IMPORTANT: This script seeds reference data (working modes, levels, 
 * application statuses, subscription plans, domains) as fallback if SQL seed 
 * hasn't run. The primary source should be docker/mysql/init/02-seed-data.sql 
 * which runs automatically when MySQL container starts for the first time.
 * 
 * Usage: npm run seed:demo
 */

import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { AppDataSource } from "../src/config/DataSource.js";
import {
  User,
  UserRole,
  InterpreterProfile,
  ClientProfile,
  Organization,
  OrganizationStatus,
  Job,
  JobApplication,
  ApplicationStatusEnum,
  Domain,
  WorkingMode,
  Level,
  Language,
  Certification,
  ApplicationStatus,
  Conversation,
  Message,
  Notification,
  NotificationType,
  JobDomain,
  JobRequiredLanguage,
  SavedJob,
  SavedInterpreter,
  SubscriptionPlan,
  DurationType,
} from "../src/entities/index.js";

// Load environment variables
dotenv.config();

// Default password for all demo users
const DEMO_PASSWORD = "Demo123!";

// Helper function to hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Helper function to get random date in range
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Helper function to get future date
function futureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seedDemoData() {
  try {
    console.log("🌱 Starting to seed demo data...\n");

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("✓ Database connected\n");

    const passwordHash = await hashPassword(DEMO_PASSWORD);

    // ============================================
    // 1. LOAD REFERENCE DATA (from SQL seed)
    // ============================================
    // Note: Reference data (domains, working modes, levels, application statuses)
    // should be seeded by docker/mysql/init/02-seed-data.sql
    // This script only loads them for use in sample data creation

    console.log("📋 Loading Reference Data...");
    
    // Load Domains
    const domainRepository = AppDataSource.getRepository(Domain);
    const domainNames = ["Medical", "Legal", "Business", "Technical", "Conference", "Education", "Tourism", "Media"];
    const domainNameViMap = {
      "Medical": "Y tế",
      "Legal": "Pháp lý",
      "Business": "Kinh doanh",
      "Technical": "Kỹ thuật",
      "Conference": "Hội nghị",
      "Education": "Giáo dục",
      "Tourism": "Du lịch",
      "Media": "Truyền thông",
    };
    const createdDomains = [];
    for (const domainName of domainNames) {
      const domain = await domainRepository.findOne({ where: { name: domainName } });
      if (!domain) {
        // Auto-create if not found (fallback when SQL seed hasn't run yet)
        const newDomain = domainRepository.create({
          name: domainName,
          nameVi: domainNameViMap[domainName] || domainName,
          description: `${domainName} interpretation`,
        });
        await domainRepository.save(newDomain);
        createdDomains.push(newDomain);
      } else {
        createdDomains.push(domain);
      }
    }
    console.log(`✓ Loaded ${createdDomains.length} domains\n`);

    // Load Working Modes
    const workingModeRepository = AppDataSource.getRepository(WorkingMode);
    const workingModeNames = ["Full-time", "Part-time", "Remote", "Hybrid", "Contract", "Freelance"];
    const workingModeNameViMap = {
      "Full-time": "Toàn thời gian",
      "Part-time": "Bán thời gian",
      "Remote": "Làm việc từ xa",
      "Hybrid": "Làm việc kết hợp",
      "Contract": "Hợp đồng",
      "Freelance": "Tự do",
    };
    const createdWorkingModes = [];
    for (const modeName of workingModeNames) {
      const mode = await workingModeRepository.findOne({ where: { name: modeName } });
      if (!mode) {
        // Auto-create if not found (fallback when SQL seed hasn't run yet)
        const newMode = workingModeRepository.create({
          name: modeName,
          nameVi: workingModeNameViMap[modeName] || modeName,
          description: `${modeName} employment`,
        });
        await workingModeRepository.save(newMode);
        createdWorkingModes.push(newMode);
      } else {
        createdWorkingModes.push(mode);
      }
    }
    console.log(`✓ Loaded ${createdWorkingModes.length} working modes\n`);

    // Load Levels
    const levelRepository = AppDataSource.getRepository(Level);
    const levelNames = ["Beginner", "Elementary", "Intermediate", "Upper Intermediate", "Advanced", "Native"];
    const createdLevels = [];
    for (const levelName of levelNames) {
      const level = await levelRepository.findOne({ where: { name: levelName } });
      if (!level) {
        // Auto-create if not found (fallback when SQL seed hasn't run yet)
        const order = levelNames.indexOf(levelName) + 1;
        const newLevel = levelRepository.create({
          name: levelName,
          description: `${levelName} level proficiency`,
          order,
        });
        await levelRepository.save(newLevel);
        createdLevels.push(newLevel);
      } else {
        createdLevels.push(level);
      }
    }
    console.log(`✓ Loaded ${createdLevels.length} levels\n`);

    // Load Application Statuses
    const applicationStatusRepository = AppDataSource.getRepository(ApplicationStatus);
    const statusNames = ["pending", "approved", "rejected", "withdrawn"];
    const statusNameViMap = {
      pending: "Đang chờ",
      approved: "Đã chấp nhận",
      rejected: "Đã từ chối",
      withdrawn: "Đã rút lại",
    };
    const statusDescriptionMap = {
      pending: "Application is pending review",
      approved: "Application has been approved",
      rejected: "Application has been rejected",
      withdrawn: "Application has been withdrawn by applicant",
    };
    const createdStatuses = [];
    for (const statusName of statusNames) {
      const status = await applicationStatusRepository.findOne({ where: { name: statusName } });
      if (!status) {
        // Auto-create if not found (fallback when SQL seed hasn't run yet)
        const newStatus = applicationStatusRepository.create({
          name: statusName,
          nameVi: statusNameViMap[statusName] || statusName,
          description: statusDescriptionMap[statusName] || statusName,
        });
        await applicationStatusRepository.save(newStatus);
        createdStatuses.push(newStatus);
      } else {
        createdStatuses.push(status);
      }
    }
    const pendingStatus = createdStatuses.find((s) => s.name === "pending");
    const approvedStatus = createdStatuses.find((s) => s.name === "approved");
    const rejectedStatus = createdStatuses.find((s) => s.name === "rejected");
    console.log(`✓ Loaded ${createdStatuses.length} application statuses\n`);

    // ============================================
    // 4.5. SEED SUBSCRIPTION PLANS
    // ============================================
    console.log("💳 Seeding Subscription Plans...");
    const subscriptionPlanRepository = AppDataSource.getRepository(SubscriptionPlan);
    const subscriptionPlans = [
      {
        id: 1,
        name: "free",
        displayName: "Free",
        description: "Perfect for getting started with basic features",
        price: 0.00,
        currency: "USD",
        duration: 1,
        durationType: DurationType.MONTHLY,
        features: [
          "Create interpreter profile",
          "Apply to 1 job per month",
          "Basic email notifications",
          "Community access"
        ],
        maxInterpreterViews: 5,
        maxJobPosts: 1,
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 2,
        name: "pro",
        displayName: "Pro",
        description: "Most popular plan for professional interpreters",
        price: 10.00,
        currency: "USD",
        duration: 1,
        durationType: DurationType.MONTHLY,
        features: [
          "Unlimited job applications",
          "AI-powered job matching",
          "Advanced search filters",
          "Priority customer support",
          "Export capabilities"
        ],
        maxInterpreterViews: -1, // -1 means unlimited
        maxJobPosts: -1,
        isActive: true,
        sortOrder: 2,
      },
      {
        id: 3,
        name: "team",
        displayName: "Team",
        description: "Great for growing interpreter teams",
        price: 15.00,
        currency: "USD",
        duration: 1,
        durationType: DurationType.MONTHLY,
        features: [
          "Up to 5 team members",
          "Analytics dashboard",
          "Shared interpreter pool",
          "Bulk job posting",
          "Team roles & permissions",
          "Priority in search results"
        ],
        maxInterpreterViews: -1,
        maxJobPosts: -1,
        isActive: true,
        sortOrder: 3,
      },
      {
        id: 4,
        name: "enterprise",
        displayName: "Enterprise",
        description: "Custom solution for large organizations",
        price: 21.00,
        currency: "USD",
        duration: 1,
        durationType: DurationType.MONTHLY,
        features: [
          "Unlimited team members",
          "Dedicated success manager",
          "Custom integrations",
          "Advanced security & compliance",
          "SLA guarantee",
          "Early access to new features"
        ],
        maxInterpreterViews: -1,
        maxJobPosts: -1,
        isActive: true,
        sortOrder: 4,
      },
    ];

    let createdPlansCount = 0;
    let updatedPlansCount = 0;
    for (const planData of subscriptionPlans) {
      const existingPlan = await subscriptionPlanRepository.findOne({
        where: { id: planData.id }
      });

      if (existingPlan) {
        // Update existing plan
        Object.assign(existingPlan, planData);
        await subscriptionPlanRepository.save(existingPlan);
        updatedPlansCount++;
        console.log(`  ✓ Updated plan: ${planData.displayName} (ID: ${planData.id})`);
      } else {
        // Create new plan
        const newPlan = subscriptionPlanRepository.create(planData);
        await subscriptionPlanRepository.save(newPlan);
        createdPlansCount++;
        console.log(`  ✓ Created plan: ${planData.displayName} (ID: ${planData.id})`);
      }
    }
    console.log(`✓ Seeded ${subscriptionPlans.length} subscription plans (${createdPlansCount} created, ${updatedPlansCount} updated)\n`);

    // ============================================
    // 5. SEED ADMIN USER
    // ============================================
    console.log("👤 Seeding Admin User...");
    const userRepository = AppDataSource.getRepository(User);
    
    // Get admin credentials from environment variables or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || "admin@demo.com";
    const adminPassword = process.env.ADMIN_PASSWORD || DEMO_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "System Administrator";
    
    // Hash admin password (use provided password or demo password)
    const adminPasswordHash = adminPassword !== DEMO_PASSWORD 
      ? await hashPassword(adminPassword)
      : passwordHash;
    
    let admin = await userRepository.findOne({
      where: { email: adminEmail },
    });
    if (!admin) {
      admin = userRepository.create({
        email: adminEmail,
        passwordHash: adminPasswordHash,
        fullName: adminName,
        role: UserRole.ADMIN,
        isActive: true,
        isVerified: true,
      });
      admin = await userRepository.save(admin);
      console.log(`✓ Created admin user: ${admin.email}`);
    } else {
      console.log(`✓ Admin user already exists: ${admin.email}`);
    }
    console.log(`   Password: ${adminPassword}\n`);

    // ============================================
    // 6. SEED CLIENT USERS
    // ============================================
    console.log("👥 Seeding Client Users...");
    const clientUsers = [
      {
        email: "client1@demo.com",
        fullName: "Nguyen Van Client",
        phone: "0901111111",
        address: "123 Le Loi, District 1, Ho Chi Minh City",
        avatar: "https://i.pravatar.cc/150?img=1",
      },
      {
        email: "client2@demo.com",
        fullName: "Tran Thi Company",
        phone: "0902222222",
        address: "456 Nguyen Hue, District 1, Ho Chi Minh City",
        avatar: "https://i.pravatar.cc/150?img=2",
      },
      {
        email: "client3@demo.com",
        fullName: "Le Minh Corporation",
        phone: "0903333333",
        address: "789 Tran Hung Dao, Hanoi",
        avatar: "https://i.pravatar.cc/150?img=3",
      },
    ];

    const createdClients = [];
    for (const clientData of clientUsers) {
      let client = await userRepository.findOne({
        where: { email: clientData.email },
      });
      if (!client) {
        client = userRepository.create({
          ...clientData,
          passwordHash,
          role: "client",
          isActive: true,
          isVerified: true,
        });
        client = await userRepository.save(client);
      }
      createdClients.push(client);
    }
    console.log(`✓ Created ${createdClients.length} client users\n`);

    // ============================================
    // 7. SEED CLIENT PROFILES
    // ============================================
    console.log("📋 Seeding Client Profiles...");
    const clientProfileRepository = AppDataSource.getRepository(ClientProfile);
    const clientProfiles = [
      {
        userId: createdClients[0].id,
        companyName: "Global Medical Services",
        companyType: "healthcare",
        companySize: "size_51_200",
        website: "https://globalmedical.com",
        industry: "Healthcare",
        description: "Leading healthcare provider in Vietnam",
        rating: 4.5,
        totalReviews: 15,
        totalJobsPosted: 8,
        totalJobsCompleted: 5,
        verificationStatus: "verified",
        accountStatus: "active",
      },
      {
        userId: createdClients[1].id,
        companyName: "Vietnam Legal Group",
        companyType: "corporation",
        companySize: "size_201_500",
        website: "https://vietnamlegal.com",
        industry: "Legal Services",
        description: "Premier legal services firm",
        rating: 4.8,
        totalReviews: 23,
        totalJobsPosted: 12,
        totalJobsCompleted: 10,
        verificationStatus: "verified",
        accountStatus: "active",
      },
      {
        userId: createdClients[2].id,
        companyName: "Tech Solutions Vietnam",
        companyType: "corporation",
        companySize: "size_1000_plus",
        website: "https://techsolutions.vn",
        industry: "Technology",
        description: "Innovative technology solutions provider",
        rating: 4.7,
        totalReviews: 45,
        totalJobsPosted: 20,
        totalJobsCompleted: 18,
        verificationStatus: "verified",
        accountStatus: "active",
      },
    ];

    for (const profileData of clientProfiles) {
      let profile = await clientProfileRepository.findOne({
        where: { userId: profileData.userId },
      });
      if (!profile) {
        profile = clientProfileRepository.create(profileData);
        await clientProfileRepository.save(profile);
      }
    }
    console.log(`✓ Created ${clientProfiles.length} client profiles\n`);

    // ============================================
    // 8. SEED ORGANIZATIONS
    // ============================================
    console.log("🏢 Seeding Organizations...");
    const organizationRepository = AppDataSource.getRepository(Organization);
    const organizations = [
      {
        ownerUserId: createdClients[0].id,
        name: "Global Medical Services",
        description: "Leading healthcare provider specializing in medical interpretation services",
        email: "contact@globalmedical.com",
        phone: "0901111111",
        website: "https://globalmedical.com",
        address: "123 Le Loi, District 1, Ho Chi Minh City",
        province: "Ho Chi Minh City",
        approvalStatus: OrganizationStatus.APPROVED,
        licenseVerificationStatus: "approved",
        isActive: true,
      },
      {
        ownerUserId: createdClients[1].id,
        name: "Vietnam Legal Group",
        description: "Premier legal services firm providing interpretation for legal proceedings",
        email: "info@vietnamlegal.com",
        phone: "0902222222",
        website: "https://vietnamlegal.com",
        address: "456 Nguyen Hue, District 1, Ho Chi Minh City",
        province: "Ho Chi Minh City",
        approvalStatus: OrganizationStatus.APPROVED,
        licenseVerificationStatus: "approved",
        isActive: true,
      },
      {
        ownerUserId: createdClients[2].id,
        name: "Tech Solutions Vietnam",
        description: "Technology company requiring technical interpretation services",
        email: "hr@techsolutions.vn",
        phone: "0903333333",
        website: "https://techsolutions.vn",
        address: "789 Tran Hung Dao, Hanoi",
        province: "Hanoi",
        approvalStatus: OrganizationStatus.APPROVED,
        licenseVerificationStatus: "approved",
        isActive: true,
      },
      {
        ownerUserId: createdClients[0].id,
        name: "New Startup Company",
        description: "New startup waiting for approval",
        email: "contact@newstartup.com",
        phone: "0904444444",
        address: "321 Hai Ba Trung, Da Nang",
        province: "Da Nang",
        approvalStatus: OrganizationStatus.PENDING,
        licenseVerificationStatus: "pending",
        isActive: true,
      },
    ];

    const createdOrganizations = [];
    for (const orgData of organizations) {
      let org = await organizationRepository.findOne({
        where: { name: orgData.name },
      });
      if (!org) {
        org = organizationRepository.create(orgData);
        org = await organizationRepository.save(org);
      }
      createdOrganizations.push(org);
    }
    console.log(`✓ Created ${createdOrganizations.length} organizations\n`);

    // ============================================
    // 9. SEED INTERPRETER USERS
    // ============================================
    console.log("👥 Seeding Interpreter Users...");
    const interpreterUsers = [
      {
        email: "interpreter1@demo.com",
        fullName: "Nguyen Van Interpreter",
        phone: "0911111111",
        address: "123 Nguyen Hue, District 1, Ho Chi Minh City",
        avatar: "https://i.pravatar.cc/150?img=11",
      },
      {
        email: "interpreter2@demo.com",
        fullName: "Tran Thi Translator",
        phone: "0922222222",
        address: "456 Le Loi, District 3, Ho Chi Minh City",
        avatar: "https://i.pravatar.cc/150?img=22",
      },
      {
        email: "interpreter3@demo.com",
        fullName: "Le Minh Language",
        phone: "0933333333",
        address: "789 Tran Hung Dao, Hanoi",
        avatar: "https://i.pravatar.cc/150?img=33",
      },
      {
        email: "interpreter4@demo.com",
        fullName: "Pham Thu Professional",
        phone: "0944444444",
        address: "321 Hai Ba Trung, Da Nang",
        avatar: "https://i.pravatar.cc/150?img=44",
      },
      {
        email: "interpreter5@demo.com",
        fullName: "Hoang Van Expert",
        phone: "0955555555",
        address: "654 Nguyen Trai, Hanoi",
        avatar: "https://i.pravatar.cc/150?img=55",
      },
      {
        email: "interpreter6@demo.com",
        fullName: "Vo Thi Specialist",
        phone: "0966666666",
        address: "987 Bach Dang, Ho Chi Minh City",
        avatar: "https://i.pravatar.cc/150?img=56",
      },
      {
        email: "interpreter7@demo.com",
        fullName: "Dang Minh Master",
        phone: "0977777777",
        address: "147 Ly Tu Trong, Ho Chi Minh City",
        avatar: "https://i.pravatar.cc/150?img=57",
      },
      {
        email: "interpreter8@demo.com",
        fullName: "Bui Thi Advanced",
        phone: "0988888888",
        address: "258 Le Duan, Hanoi",
        avatar: "https://i.pravatar.cc/150?img=58",
      },
    ];

    const createdInterpreters = [];
    for (const interpreterData of interpreterUsers) {
      let interpreter = await userRepository.findOne({
        where: { email: interpreterData.email },
      });
      if (!interpreter) {
        interpreter = userRepository.create({
          ...interpreterData,
          passwordHash,
          role: "interpreter",
          isActive: true,
          isVerified: true,
        });
        interpreter = await userRepository.save(interpreter);
      }
      createdInterpreters.push(interpreter);
    }
    console.log(`✓ Created ${createdInterpreters.length} interpreter users\n`);

    // ============================================
    // 10. SEED INTERPRETER PROFILES
    // ============================================
    console.log("📋 Seeding Interpreter Profiles...");
    const interpreterProfileRepository = AppDataSource.getRepository(InterpreterProfile);
    const interpreterProfiles = [
      {
        userId: createdInterpreters[0].id,
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
        portfolio: "Specialized in medical and legal interpretation with 5 years of experience. Fluent in English, Vietnamese, and Japanese.",
        rating: 4.5,
        totalReviews: 23,
        completedJobs: 45,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: createdInterpreters[1].id,
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
        portfolio: "Business and technical interpreter with experience in corporate settings.",
        rating: 4.2,
        totalReviews: 15,
        completedJobs: 28,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: createdInterpreters[2].id,
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
        portfolio: "Experienced legal and conference interpreter. Over 8 years of professional experience.",
        rating: 4.8,
        totalReviews: 42,
        completedJobs: 89,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: createdInterpreters[3].id,
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
        portfolio: "Senior interpreter with 10+ years experience. Specialized in medical, technical, and business interpretation.",
        rating: 4.9,
        totalReviews: 67,
        completedJobs: 134,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: createdInterpreters[4].id,
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
        portfolio: "Technical and conference interpreter with expertise in IT and engineering fields.",
        rating: 4.3,
        totalReviews: 18,
        completedJobs: 32,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: createdInterpreters[5].id,
        languages: ["English", "Vietnamese", "Spanish"],
        specializations: ["Tourism", "Education"],
        experience: 6,
        hourlyRate: 28.0,
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
          { name: "DELE", score: "C1" },
        ],
        portfolio: "Experienced in tourism and education interpretation. Fluent in English, Vietnamese, and Spanish.",
        rating: 4.6,
        totalReviews: 31,
        completedJobs: 56,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: createdInterpreters[6].id,
        languages: ["English", "Vietnamese", "Russian"],
        specializations: ["Business", "Media"],
        experience: 7,
        hourlyRate: 30.0,
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
          { name: "TORFL", score: "C1" },
        ],
        portfolio: "Business and media interpreter with 7 years of experience. Specialized in corporate communications.",
        rating: 4.7,
        totalReviews: 38,
        completedJobs: 72,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
      {
        userId: createdInterpreters[7].id,
        languages: ["English", "Vietnamese", "Italian"],
        specializations: ["Conference", "Education"],
        experience: 9,
        hourlyRate: 40.0,
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
          { name: "CELI", score: "C1" },
        ],
        portfolio: "Senior conference and education interpreter. Over 9 years of professional experience in international conferences.",
        rating: 4.9,
        totalReviews: 52,
        completedJobs: 98,
        isAvailable: true,
        verificationStatus: "verified",
        profileCompleteness: 100,
      },
    ];

    for (const profileData of interpreterProfiles) {
      let profile = await interpreterProfileRepository.findOne({
        where: { userId: profileData.userId },
      });
      if (!profile) {
        profile = interpreterProfileRepository.create(profileData);
        await interpreterProfileRepository.save(profile);
      }
    }
    console.log(`✓ Created ${interpreterProfiles.length} interpreter profiles\n`);

    // ============================================
    // 11. SEED LANGUAGES
    // ============================================
    console.log("🌐 Seeding Languages...");
    const languageRepository = AppDataSource.getRepository(Language);
    const languageData = [
      // Interpreter 1: English, Vietnamese, Japanese
      { userId: createdInterpreters[0].id, name: "English", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 5, isActive: true },
      { userId: createdInterpreters[0].id, name: "Vietnamese", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 5, isActive: true },
      { userId: createdInterpreters[0].id, name: "Japanese", proficiencyLevel: "Advanced", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 3, isActive: true },
      // Interpreter 2: English, Vietnamese, Korean
      { userId: createdInterpreters[1].id, name: "English", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 3, isActive: true },
      { userId: createdInterpreters[1].id, name: "Vietnamese", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 3, isActive: true },
      { userId: createdInterpreters[1].id, name: "Korean", proficiencyLevel: "Advanced", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 2, isActive: true },
      // Interpreter 3: English, Vietnamese, French
      { userId: createdInterpreters[2].id, name: "English", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 8, isActive: true },
      { userId: createdInterpreters[2].id, name: "Vietnamese", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 8, isActive: true },
      { userId: createdInterpreters[2].id, name: "French", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 5, isActive: true },
      // Interpreter 4: English, Vietnamese, Chinese, Japanese
      { userId: createdInterpreters[3].id, name: "English", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 10, isActive: true },
      { userId: createdInterpreters[3].id, name: "Vietnamese", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 10, isActive: true },
      { userId: createdInterpreters[3].id, name: "Chinese", proficiencyLevel: "Advanced", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 4, isActive: true },
      { userId: createdInterpreters[3].id, name: "Japanese", proficiencyLevel: "Advanced", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 4, isActive: true },
      // Interpreter 5: English, Vietnamese, German
      { userId: createdInterpreters[4].id, name: "English", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 4, isActive: true },
      { userId: createdInterpreters[4].id, name: "Vietnamese", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 4, isActive: true },
      { userId: createdInterpreters[4].id, name: "German", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 3, isActive: true },
      // Interpreter 6: English, Vietnamese, Spanish
      { userId: createdInterpreters[5].id, name: "English", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 6, isActive: true },
      { userId: createdInterpreters[5].id, name: "Vietnamese", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 6, isActive: true },
      { userId: createdInterpreters[5].id, name: "Spanish", proficiencyLevel: "Advanced", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 4, isActive: true },
      // Interpreter 7: English, Vietnamese, Russian
      { userId: createdInterpreters[6].id, name: "English", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 7, isActive: true },
      { userId: createdInterpreters[6].id, name: "Vietnamese", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 7, isActive: true },
      { userId: createdInterpreters[6].id, name: "Russian", proficiencyLevel: "Advanced", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 3, isActive: true },
      // Interpreter 8: English, Vietnamese, Italian
      { userId: createdInterpreters[7].id, name: "English", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 9, isActive: true },
      { userId: createdInterpreters[7].id, name: "Vietnamese", proficiencyLevel: "Native", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 9, isActive: true },
      { userId: createdInterpreters[7].id, name: "Italian", proficiencyLevel: "Professional", canSpeak: true, canWrite: true, canRead: true, yearsOfExperience: 5, isActive: true },
    ];

    for (const langData of languageData) {
      let lang = await languageRepository.findOne({
        where: { userId: langData.userId, name: langData.name },
      });
      if (!lang) {
        lang = languageRepository.create(langData);
        await languageRepository.save(lang);
      }
    }
    console.log(`✓ Created ${languageData.length} language records\n`);

    // ============================================
    // 12. SEED CERTIFICATIONS
    // ============================================
    console.log("📜 Seeding Certifications...");
    const certificationRepository = AppDataSource.getRepository(Certification);
    const certificationData = [
      {
        userId: createdInterpreters[0].id,
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
        userId: createdInterpreters[1].id,
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
        userId: createdInterpreters[2].id,
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
        userId: createdInterpreters[3].id,
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
        userId: createdInterpreters[4].id,
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

    for (const certData of certificationData) {
      let cert = await certificationRepository.findOne({
        where: { userId: certData.userId, name: certData.name },
      });
      if (!cert) {
        cert = certificationRepository.create(certData);
        await certificationRepository.save(cert);
      }
    }
    console.log(`✓ Created ${certificationData.length} certifications\n`);

    // ============================================
    // 13. SEED JOBS
    // ============================================
    console.log("💼 Seeding Jobs...");
    const jobRepository = AppDataSource.getRepository(Job);
    const jobDomainRepository = AppDataSource.getRepository(JobDomain);
    const jobRequiredLanguageRepository = AppDataSource.getRepository(JobRequiredLanguage);

    const jobs = [
      {
        organizationId: createdOrganizations[0].id,
        workingModeId: createdWorkingModes[0].id, // Full-time
        title: "Medical Interpreter (English-Vietnamese)",
        province: "Ho Chi Minh City",
        commune: "District 1",
        address: "123 Le Loi, District 1",
        expirationDate: futureDate(30),
        quantity: 2,
        descriptions: "We are seeking experienced medical interpreters to assist with patient consultations and medical procedures. The ideal candidate will have strong medical terminology knowledge and cultural sensitivity.",
        responsibility: "Provide accurate interpretation during medical consultations, assist with patient communication, maintain confidentiality, document interpretation sessions.",
        benefits: "Competitive salary, health insurance, professional development opportunities, flexible working hours.",
        minSalary: 1500,
        maxSalary: 2000,
        salaryType: "RANGE",
        contactEmail: "hr@globalmedical.com",
        contactPhone: "0901111111",
        statusOpenStop: "open",
        reviewStatus: "approved",
        createdDate: new Date(),
        domains: [createdDomains[0].id], // Medical
        requiredLanguages: [
          { languageName: "English", levelId: createdLevels[4].id, isSourceLanguage: false },
          { languageName: "Vietnamese", levelId: createdLevels[5].id, isSourceLanguage: true },
        ],
      },
      {
        organizationId: createdOrganizations[1].id,
        workingModeId: createdWorkingModes[2].id, // Remote
        title: "Legal Court Interpreter",
        province: "Ho Chi Minh City",
        commune: "District 3",
        address: "456 Nguyen Hue, District 3",
        expirationDate: futureDate(45),
        quantity: 1,
        descriptions: "Certified court interpreter needed for legal proceedings, depositions, and attorney-client consultations. Must have legal terminology expertise.",
        responsibility: "Provide certified interpretation for court proceedings, legal depositions, and attorney consultations. Maintain neutrality and accuracy.",
        benefits: "Daily rate compensation, flexible scheduling, legal training opportunities, professional certification support.",
        minSalary: 2000,
        maxSalary: 2500,
        salaryType: "RANGE",
        contactEmail: "legal@vietnamlegal.com",
        contactPhone: "0902222222",
        statusOpenStop: "open",
        reviewStatus: "approved",
        createdDate: new Date(),
        domains: [createdDomains[1].id], // Legal
        requiredLanguages: [
          { languageName: "English", levelId: createdLevels[5].id, isSourceLanguage: false },
          { languageName: "Vietnamese", levelId: createdLevels[5].id, isSourceLanguage: true },
        ],
      },
      {
        organizationId: createdOrganizations[2].id,
        workingModeId: createdWorkingModes[3].id, // Hybrid
        title: "Technical Interpreter (Japanese-Vietnamese)",
        province: "Hanoi",
        commune: "Ba Dinh",
        address: "789 Tran Hung Dao, Ba Dinh",
        expirationDate: futureDate(60),
        quantity: 3,
        descriptions: "Technical interpreter needed for IT and engineering projects. Must understand technical terminology in both Japanese and Vietnamese.",
        responsibility: "Interpret technical meetings, translate technical documents, assist with engineering discussions, maintain technical accuracy.",
        benefits: "Competitive salary, technology allowance, international client exposure, professional development.",
        minSalary: 1800,
        maxSalary: 2200,
        salaryType: "RANGE",
        contactEmail: "hr@techsolutions.vn",
        contactPhone: "0903333333",
        statusOpenStop: "open",
        reviewStatus: "approved",
        createdDate: new Date(),
        domains: [createdDomains[3].id], // Technical
        requiredLanguages: [
          { languageName: "Japanese", levelId: createdLevels[4].id, isSourceLanguage: false },
          { languageName: "Vietnamese", levelId: createdLevels[5].id, isSourceLanguage: true },
        ],
      },
      {
        organizationId: createdOrganizations[0].id,
        workingModeId: createdWorkingModes[1].id, // Part-time
        title: "Conference Interpreter (English-Vietnamese)",
        province: "Ho Chi Minh City",
        commune: "District 1",
        address: "123 Le Loi, District 1",
        expirationDate: futureDate(20),
        quantity: 1,
        descriptions: "Experienced conference interpreter needed for international business conferences and seminars.",
        responsibility: "Provide simultaneous interpretation during conferences, prepare conference materials, coordinate with event organizers.",
        benefits: "Event-based compensation, networking opportunities, travel allowances.",
        minSalary: 2500,
        maxSalary: null,
        salaryType: "FIXED",
        contactEmail: "events@globalmedical.com",
        contactPhone: "0901111111",
        statusOpenStop: "open",
        reviewStatus: "approved",
        createdDate: new Date(),
        domains: [createdDomains[4].id], // Conference
        requiredLanguages: [
          { languageName: "English", levelId: createdLevels[5].id, isSourceLanguage: false },
          { languageName: "Vietnamese", levelId: createdLevels[5].id, isSourceLanguage: true },
        ],
      },
      {
        organizationId: createdOrganizations[1].id,
        workingModeId: createdWorkingModes[5].id, // Freelance
        title: "Business Interpreter (Korean-Vietnamese)",
        province: "Ho Chi Minh City",
        commune: "District 7",
        address: "456 Nguyen Hue, District 7",
        expirationDate: futureDate(15),
        quantity: 2,
        descriptions: "Business interpreter needed for Korean-Vietnamese business meetings and negotiations.",
        responsibility: "Interpret business meetings, assist with contract negotiations, provide cultural context, maintain professional relationships.",
        benefits: "Flexible schedule, competitive hourly rate, international business exposure.",
        minSalary: null,
        maxSalary: null,
        salaryType: "NEGOTIABLE",
        contactEmail: "business@vietnamlegal.com",
        contactPhone: "0902222222",
        statusOpenStop: "open",
        reviewStatus: "pending",
        createdDate: new Date(),
        domains: [createdDomains[2].id], // Business
        requiredLanguages: [
          { languageName: "Korean", levelId: createdLevels[4].id, isSourceLanguage: false },
          { languageName: "Vietnamese", levelId: createdLevels[5].id, isSourceLanguage: true },
        ],
      },
      {
        organizationId: createdOrganizations[2].id,
        workingModeId: createdWorkingModes[0].id, // Full-time
        title: "Education Interpreter (Chinese-Vietnamese)",
        province: "Hanoi",
        commune: "Dong Da",
        address: "789 Tran Hung Dao, Dong Da",
        expirationDate: futureDate(90),
        quantity: 1,
        descriptions: "Education interpreter needed for international education programs and student exchanges.",
        responsibility: "Interpret educational meetings, assist with student communications, translate educational materials, support cultural exchange programs.",
        benefits: "Stable employment, education benefits, cultural exchange opportunities.",
        minSalary: 1200,
        maxSalary: 1500,
        salaryType: "RANGE",
        contactEmail: "education@techsolutions.vn",
        contactPhone: "0903333333",
        statusOpenStop: "open",
        reviewStatus: "approved",
        createdDate: new Date(),
        domains: [createdDomains[5].id], // Education
        requiredLanguages: [
          { languageName: "Chinese", levelId: createdLevels[4].id, isSourceLanguage: false },
          { languageName: "Vietnamese", levelId: createdLevels[5].id, isSourceLanguage: true },
        ],
      },
    ];

    const createdJobs = [];
    for (const jobData of jobs) {
      const { domains, requiredLanguages, ...jobFields } = jobData;
      let job = jobRepository.create(jobFields);
      job = await jobRepository.save(job);

      // Add domains
      if (domains && domains.length > 0) {
        for (const domainId of domains) {
          const jobDomain = jobDomainRepository.create({
            jobId: job.id,
            domainId: domainId,
          });
          await jobDomainRepository.save(jobDomain);
        }
      }

      // Add required languages
      if (requiredLanguages && requiredLanguages.length > 0) {
        for (const langReq of requiredLanguages) {
          // Find language record from any user
          let language = await languageRepository
            .createQueryBuilder("language")
            .where("language.name = :name", { name: langReq.languageName })
            .orderBy("language.id", "ASC")
            .getOne();
          
          // If not found, create a new language entry for the first client
          if (!language) {
            language = languageRepository.create({
              name: langReq.languageName,
              userId: createdClients[0].id,
              proficiencyLevel: "Intermediate",
              canSpeak: true,
              canWrite: true,
              canRead: true,
              yearsOfExperience: 0,
              isActive: true,
            });
            language = await languageRepository.save(language);
          }

          const jobLang = jobRequiredLanguageRepository.create({
            jobId: job.id,
            languageId: language.id,
            levelId: langReq.levelId,
            isSourceLanguage: langReq.isSourceLanguage || false,
          });
          await jobRequiredLanguageRepository.save(jobLang);
        }
      }

      createdJobs.push(job);
    }
    console.log(`✓ Created ${createdJobs.length} jobs\n`);

    // ============================================
    // 14. SEED JOB APPLICATIONS
    // ============================================
    console.log("📝 Seeding Job Applications...");
    const jobApplicationRepository = AppDataSource.getRepository(JobApplication);
    const applications = [
      {
        jobId: createdJobs[0].id, // Medical Interpreter
        interpreterId: createdInterpreters[0].id,
        statusId: pendingStatus.id,
        status: "pending",
        coverLetter: "I have 5 years of experience in medical interpretation and am fluent in English, Vietnamese, and Japanese. I am very interested in this position.",
        applicationDate: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
      },
      {
        jobId: createdJobs[0].id,
        interpreterId: createdInterpreters[3].id,
        statusId: approvedStatus.id,
        status: "approved",
        coverLetter: "With 10 years of experience in medical interpretation, I believe I am well-suited for this role. I have extensive knowledge of medical terminology.",
        applicationDate: randomDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), new Date()),
        reviewedAt: new Date(),
      },
      {
        jobId: createdJobs[1].id, // Legal Court Interpreter
        interpreterId: createdInterpreters[2].id,
        statusId: approvedStatus.id,
        status: "approved",
        coverLetter: "I have 8 years of experience in legal interpretation and am certified for court proceedings. I am available for this position.",
        applicationDate: randomDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date()),
        reviewedAt: new Date(),
      },
      {
        jobId: createdJobs[1].id,
        interpreterId: createdInterpreters[0].id,
        statusId: rejectedStatus.id,
        status: "rejected",
        coverLetter: "I am interested in this legal interpreter position.",
        applicationDate: randomDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), new Date()),
        reviewedAt: new Date(),
        reviewNotes: "Insufficient legal experience",
      },
      {
        jobId: createdJobs[2].id, // Technical Interpreter
        interpreterId: createdInterpreters[1].id,
        statusId: pendingStatus.id,
        status: "pending",
        coverLetter: "I have experience in technical interpretation and am fluent in multiple languages including Korean and Vietnamese.",
        applicationDate: randomDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), new Date()),
      },
      {
        jobId: createdJobs[2].id,
        interpreterId: createdInterpreters[3].id,
        statusId: approvedStatus.id,
        status: "approved",
        coverLetter: "With my extensive experience in technical fields and fluency in Japanese and Vietnamese, I am confident I can excel in this role.",
        applicationDate: randomDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), new Date()),
        reviewedAt: new Date(),
      },
      {
        jobId: createdJobs[3].id, // Conference Interpreter
        interpreterId: createdInterpreters[2].id,
        statusId: approvedStatus.id,
        status: "approved",
        coverLetter: "I specialize in conference interpretation and have extensive experience with international business conferences.",
        applicationDate: randomDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), new Date()),
        reviewedAt: new Date(),
      },
      {
        jobId: createdJobs[3].id,
        interpreterId: createdInterpreters[7].id,
        statusId: pendingStatus.id,
        status: "pending",
        coverLetter: "I have 9 years of experience in conference interpretation and am available for this position.",
        applicationDate: randomDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), new Date()),
      },
      {
        jobId: createdJobs[4].id, // Business Interpreter
        interpreterId: createdInterpreters[1].id,
        statusId: pendingStatus.id,
        status: "pending",
        coverLetter: "I am fluent in Korean and Vietnamese and have experience in business interpretation.",
        applicationDate: randomDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), new Date()),
      },
      {
        jobId: createdJobs[5].id, // Education Interpreter
        interpreterId: createdInterpreters[3].id,
        statusId: approvedStatus.id,
        status: "approved",
        coverLetter: "I have experience in education interpretation and am fluent in Chinese and Vietnamese.",
        applicationDate: randomDate(new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), new Date()),
        reviewedAt: new Date(),
      },
    ];

    const createdApplications = [];
    for (const appData of applications) {
      let application = await jobApplicationRepository.findOne({
        where: {
          jobId: appData.jobId,
          interpreterId: appData.interpreterId,
        },
      });
      if (!application) {
        application = jobApplicationRepository.create(appData);
        application = await jobApplicationRepository.save(application);
      }
      createdApplications.push(application);
    }
    console.log(`✓ Created ${createdApplications.length} job applications\n`);

    // ============================================
    // 15. SEED CONVERSATIONS & MESSAGES
    // ============================================
    console.log("💬 Seeding Conversations & Messages...");
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const messageRepository = AppDataSource.getRepository(Message);

    // Create conversations between clients and interpreters
    const conversations = [
      {
        participant1Id: createdClients[0].id,
        participant2Id: createdInterpreters[0].id,
        applicationId: createdApplications.find((a) => a.jobId === createdJobs[0].id && a.interpreterId === createdInterpreters[0].id)?.id || null,
        lastMessageAt: new Date(),
      },
      {
        participant1Id: createdClients[1].id,
        participant2Id: createdInterpreters[2].id,
        applicationId: createdApplications.find((a) => a.jobId === createdJobs[1].id && a.interpreterId === createdInterpreters[2].id)?.id || null,
        lastMessageAt: new Date(),
      },
    ];

    const createdConversations = [];
    for (const convData of conversations) {
      let conversation = await conversationRepository.findOne({
        where: [
          { participant1Id: convData.participant1Id, participant2Id: convData.participant2Id },
          { participant1Id: convData.participant2Id, participant2Id: convData.participant1Id },
        ],
      });
      if (!conversation) {
        conversation = conversationRepository.create(convData);
        conversation = await conversationRepository.save(conversation);
      }
      createdConversations.push(conversation);

      // Add sample messages
      const messages = [
        {
          conversationId: conversation.id,
          senderId: convData.participant1Id,
          content: "Hello, I'm interested in discussing the job opportunity.",
          isRead: false,
        },
        {
          conversationId: conversation.id,
          senderId: convData.participant2Id,
          content: "Thank you for your interest. I'd be happy to discuss this further.",
          isRead: false,
        },
        {
          conversationId: conversation.id,
          senderId: convData.participant1Id,
          content: "Great! When would be a good time for a call?",
          isRead: false,
        },
      ];

      for (const msgData of messages) {
        let message = await messageRepository.findOne({
          where: {
            conversationId: msgData.conversationId,
            senderId: msgData.senderId,
            content: msgData.content,
          },
        });
        if (!message) {
          message = messageRepository.create(msgData);
          await messageRepository.save(message);
        }
      }
    }
    console.log(`✓ Created ${createdConversations.length} conversations with messages\n`);

    // ============================================
    // 16. SEED NOTIFICATIONS
    // ============================================
    console.log("🔔 Seeding Notifications...");
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notifications = [
      {
        recipientId: createdInterpreters[0].id,
        actorId: createdClients[0].id,
        type: NotificationType.JOB_APPLICATION_STATUS,
        title: "Application Status Updated",
        message: "Your application for Medical Interpreter position has been reviewed.",
        metadata: JSON.stringify({
          jobId: createdJobs[0].id,
          applicationId: createdApplications[0]?.id || null,
          status: "pending",
        }),
        isRead: false,
      },
      {
        recipientId: createdInterpreters[3].id,
        actorId: createdClients[0].id,
        type: NotificationType.JOB_APPLICATION_STATUS,
        title: "Application Approved",
        message: "Congratulations! Your application for Medical Interpreter position has been approved.",
        metadata: JSON.stringify({
          jobId: createdJobs[0].id,
          applicationId: createdApplications[1]?.id || null,
          status: "approved",
        }),
        isRead: false,
      },
      {
        recipientId: createdInterpreters[2].id,
        actorId: createdClients[1].id,
        type: NotificationType.JOB_APPLICATION_STATUS,
        title: "Application Approved",
        message: "Your application for Legal Court Interpreter position has been approved.",
        metadata: JSON.stringify({
          jobId: createdJobs[1].id,
          applicationId: createdApplications[2]?.id || null,
          status: "approved",
        }),
        isRead: true,
      },
    ];

    for (const notifData of notifications) {
      let notification = notificationRepository.create(notifData);
      await notificationRepository.save(notification);
    }
    console.log(`✓ Created ${notifications.length} notifications\n`);

    // ============================================
    // 17. SEED SAVED JOBS & SAVED INTERPRETERS
    // ============================================
    console.log("⭐ Seeding Saved Jobs & Interpreters...");
    const savedJobRepository = AppDataSource.getRepository(SavedJob);
    const savedInterpreterRepository = AppDataSource.getRepository(SavedInterpreter);

    // Interpreters save some jobs
    const savedJobs = [
      {
        userId: createdInterpreters[0].id,
        jobId: createdJobs[0].id,
      },
      {
        userId: createdInterpreters[0].id,
        jobId: createdJobs[2].id,
      },
      {
        userId: createdInterpreters[1].id,
        jobId: createdJobs[1].id,
      },
      {
        userId: createdInterpreters[2].id,
        jobId: createdJobs[3].id,
      },
    ];

    for (const savedJobData of savedJobs) {
      let savedJob = await savedJobRepository.findOne({
        where: {
          userId: savedJobData.userId,
          jobId: savedJobData.jobId,
        },
      });
      if (!savedJob) {
        savedJob = savedJobRepository.create(savedJobData);
        await savedJobRepository.save(savedJob);
      }
    }

    // Clients save some interpreters
    const savedInterpreters = [
      {
        userId: createdClients[0].id,
        interpreterId: createdInterpreters[0].id,
      },
      {
        userId: createdClients[0].id,
        interpreterId: createdInterpreters[3].id,
      },
      {
        userId: createdClients[1].id,
        interpreterId: createdInterpreters[2].id,
      },
      {
        userId: createdClients[2].id,
        interpreterId: createdInterpreters[1].id,
      },
    ];

    for (const savedInterpreterData of savedInterpreters) {
      let savedInterpreter = await savedInterpreterRepository.findOne({
        where: {
          userId: savedInterpreterData.userId,
          interpreterId: savedInterpreterData.interpreterId,
        },
      });
      if (!savedInterpreter) {
        savedInterpreter = savedInterpreterRepository.create(savedInterpreterData);
        await savedInterpreterRepository.save(savedInterpreter);
      }
    }
    console.log(`✓ Created ${savedJobs.length} saved jobs and ${savedInterpreters.length} saved interpreters\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log("✅ Demo sample data seeding completed successfully!\n");
    console.log("📊 Sample Data Summary:");
    console.log(`   - Admin users: 1`);
    console.log(`   - Client users: ${createdClients.length}`);
    console.log(`   - Interpreter users: ${createdInterpreters.length}`);
    console.log(`   - Organizations: ${createdOrganizations.length}`);
    console.log(`   - Jobs: ${createdJobs.length}`);
    console.log(`   - Job Applications: ${createdApplications.length}`);
    console.log(`   - Conversations: ${createdConversations.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log(`   - Saved Jobs: ${savedJobs.length}`);
    console.log(`   - Saved Interpreters: ${savedInterpreters.length}\n`);
    console.log("ℹ️  Note: Reference data (domains, working modes, levels, application statuses,");
    console.log("   subscription plans) has been seeded. Primary source is docker/mysql/init/02-seed-data.sql\n");
    
    // ============================================
    // LOGIN CREDENTIALS
    // ============================================
    console.log("=".repeat(70));
    console.log("🔑 LOGIN CREDENTIALS - Use these to login to the application");
    console.log("=".repeat(70));
    console.log(`\n📌 Common Password for ALL demo users: ${DEMO_PASSWORD}\n`);
    
    // Get admin credentials for display (from env or default)
    const adminEmailDisplay = process.env.ADMIN_EMAIL || "admin@demo.com";
    const adminPasswordDisplay = process.env.ADMIN_PASSWORD || DEMO_PASSWORD;
    
    console.log("👤 ADMIN ACCOUNT:");
    console.log(`   Email:    ${adminEmailDisplay}`);
    console.log(`   Password: ${adminPasswordDisplay}`);
    console.log("   Role:     admin\n");
    
    console.log("👥 CLIENT ACCOUNTS:");
    createdClients.forEach((client, idx) => {
      console.log(`   ${idx + 1}. Email: ${client.email.padEnd(30)} Password: ${DEMO_PASSWORD}`);
    });
    console.log("");
    
    console.log("👥 INTERPRETER ACCOUNTS:");
    createdInterpreters.forEach((interpreter, idx) => {
      console.log(`   ${idx + 1}. Email: ${interpreter.email.padEnd(30)} Password: ${DEMO_PASSWORD}`);
    });
    
    console.log("\n" + "=".repeat(70));
    console.log("💡 HOW TO LOGIN:");
    console.log("   1. Go to the login page in your application");
    console.log("   2. Enter the email and password from above");
    console.log("   3. Click 'Login' button");
    console.log("=".repeat(70));
    console.log("\n");

    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    console.error(error.stack);

    // Close database connection on error
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    process.exit(1);
  }
}

seedDemoData();

