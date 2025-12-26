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

    // Get admin credentials from environment variables (REQUIRED)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "System Administrator";

    // Validate required environment variables
    if (!adminEmail) {
      console.error("❌ Error: ADMIN_EMAIL environment variable is required!");
      console.error("   Please set ADMIN_EMAIL in your .env file or environment variables.");
      process.exit(1);
    }

    if (!adminPassword) {
      console.error("❌ Error: ADMIN_PASSWORD environment variable is required!");
      console.error("   Please set ADMIN_PASSWORD in your .env file or environment variables.");
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log("\n💡 To reset password, update the user in database or delete and recreate.");
      process.exit(0);
    }

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

    console.log("✅ Admin user created successfully!\n");
    console.log("=".repeat(70));
    console.log("🔑 ADMIN LOGIN CREDENTIALS");
    console.log("=".repeat(70));
    console.log("\n📋 Use these credentials to login:");
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     admin\n`);
    console.log("=".repeat(70));
    console.log("💡 HOW TO LOGIN:");
    console.log("   1. Go to the admin login page in your application");
    console.log("   2. Enter the email and password from above");
    console.log("   3. Click 'Login' button");
    console.log("=".repeat(70));
    console.log("\n⚠️  IMPORTANT: Change the password after first login for security!\n");
    console.log("💡 To create admin with custom credentials, set environment variables:");
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

