import { sequelize } from "../src/config/database.js";
import { InterpreterProfile } from "../src/models/index.js";

async function fixIncompleteProfile() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connected\n");

    // Update profile for user ID 1 (Trần Quang Bun)
    console.log("Updating profile for Trần Quang Bun (ID: 1)...");

    const [updated] = await InterpreterProfile.update(
      {
        experience: 3,
        hourlyRate: 28.0,
        specializations: JSON.stringify(["Business", "Legal", "Technical"]),
        rating: 4.6,
        totalReviews: 12,
        completedJobs: 18,
        profileCompleteness: 95,
      },
      {
        where: { userId: 1 },
      }
    );

    if (updated) {
      console.log("✅ Successfully updated profile for Trần Quang Bun!");

      // Verify the update
      const profile = await InterpreterProfile.findOne({
        where: { userId: 1 },
      });
      console.log("\n📊 Updated profile:");
      console.log(`   Experience: ${profile.experience} years`);
      console.log(`   Hourly Rate: $${profile.hourlyRate}`);
      console.log(`   Rating: ${profile.rating}`);
      console.log(`   Specializations: ${profile.specializations}`);
      console.log(`   Profile Completeness: ${profile.profileCompleteness}%`);
    } else {
      console.log("⚠️  No profile found for user ID 1");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixIncompleteProfile();
