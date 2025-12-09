import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { AppDataSource } from "../src/config/DataSource.js";
import { User } from "../src/entities/User.js";

// Load environment variables
dotenv.config();

async function createAdmin() {
  try {
    console.log("🔐 Creating admin user...");

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✓ Database connected");
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: "admin@gbridge.com" },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log("\n💡 To reset password, update the user in database or delete and recreate.");
      process.exit(0);
    }

    // Default admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gbridge.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
    const adminName = process.env.ADMIN_NAME || "System Administrator";

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = userRepository.create({
      email: adminEmail,
      passwordHash,
      fullName: adminName,
      role: "admin",
      isActive: true,
      isVerified: true,
    });

    await userRepository.save(admin);

    console.log("✅ Admin user created successfully!");
    console.log("\n📋 Admin Credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: admin`);
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");
    console.log("\n💡 To create admin with custom credentials, set environment variables:");
    console.log("   ADMIN_EMAIL=your-email@example.com");
    console.log("   ADMIN_PASSWORD=YourSecurePassword");
    console.log("   ADMIN_NAME=Your Name");

    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    
    // Close database connection on error
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    process.exit(1);
  }
}

createAdmin();

