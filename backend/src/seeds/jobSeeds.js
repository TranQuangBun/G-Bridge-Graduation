import { WorkingMode, Domain, Level, Organization } from "../models/index.js";

export async function seedJobData() {
  try {
    console.log("Seeding job-related data...");

    // Seed Working Modes
    const workingModes = [
      {
        name: "On-site",
        nameVi: "Tại văn phòng",
        description: "Work from office location",
      },
      {
        name: "Remote",
        nameVi: "Từ xa",
        description: "Work from home or any location",
      },
      {
        name: "Hybrid",
        nameVi: "Kết hợp",
        description: "Mix of on-site and remote work",
      },
    ];

    for (const mode of workingModes) {
      await WorkingMode.findOrCreate({
        where: { name: mode.name },
        defaults: mode,
      });
    }
    console.log("✓ Working modes seeded");

    // Seed Domains
    const domains = [
      {
        name: "Medical",
        nameVi: "Y khoa",
        description: "Healthcare and medical interpretation",
      },
      {
        name: "Legal",
        nameVi: "Pháp lý",
        description: "Legal and court interpretation",
      },
      {
        name: "Technical",
        nameVi: "Kỹ thuật",
        description: "Technical and engineering interpretation",
      },
      {
        name: "Business",
        nameVi: "Kinh doanh",
        description: "Business and corporate interpretation",
      },
      {
        name: "Education",
        nameVi: "Giáo dục",
        description: "Educational interpretation",
      },
      {
        name: "Conference",
        nameVi: "Hội nghị",
        description: "Conference and event interpretation",
      },
      {
        name: "Tourism",
        nameVi: "Du lịch",
        description: "Tourism and hospitality interpretation",
      },
      {
        name: "Finance",
        nameVi: "Tài chính",
        description: "Financial and banking interpretation",
      },
      {
        name: "IT",
        nameVi: "Công nghệ thông tin",
        description: "IT and software interpretation",
      },
      {
        name: "Marketing",
        nameVi: "Marketing",
        description: "Marketing and advertising interpretation",
      },
    ];

    for (const domain of domains) {
      await Domain.findOrCreate({
        where: { name: domain.name },
        defaults: domain,
      });
    }
    console.log("✓ Domains seeded");

    // Seed Levels
    const levels = [
      { name: "A1", description: "Beginner", order: 1 },
      { name: "A2", description: "Elementary", order: 2 },
      { name: "B1", description: "Intermediate", order: 3 },
      { name: "B2", description: "Upper Intermediate", order: 4 },
      { name: "C1", description: "Advanced", order: 5 },
      { name: "C2", description: "Proficiency", order: 6 },
      { name: "Native", description: "Native Speaker", order: 7 },
    ];

    for (const level of levels) {
      await Level.findOrCreate({
        where: { name: level.name },
        defaults: level,
      });
    }
    console.log("✓ Levels seeded");

    // Seed Sample Organizations
    const organizations = [
      {
        name: "VietHealth Medical Center",
        description: "Leading healthcare provider in Vietnam",
        website: "https://viethealth.vn",
        email: "hr@viethealth.vn",
        phone: "+84 28 1234 5678",
        province: "Ho Chi Minh City",
        address: "123 Nguyen Hue Street, District 1",
        isActive: true,
      },
      {
        name: "LegalTech Solutions",
        description: "International legal services firm",
        website: "https://legaltech.com",
        email: "careers@legaltech.com",
        phone: "+84 24 9876 5432",
        province: "Hanoi",
        address: "456 Ba Trieu Street, Hoan Kiem District",
        isActive: true,
      },
      {
        name: "GlobalBridge Events",
        description: "International conference and event management",
        website: "https://globalbridge.vn",
        email: "jobs@globalbridge.vn",
        phone: "+84 28 5555 6666",
        province: "Ho Chi Minh City",
        address: "789 Le Duan Boulevard, District 3",
        isActive: true,
      },
    ];

    for (const org of organizations) {
      await Organization.findOrCreate({
        where: { email: org.email },
        defaults: org,
      });
    }
    console.log("✓ Sample organizations seeded");

    console.log("✓ Job-related data seeded successfully!");
  } catch (error) {
    console.error("✗ Error seeding job data:", error);
    throw error;
  }
}
