import { sequelize } from "../src/config/database.js";
import { User, InterpreterProfile } from "../src/models/index.js";

async function addMissingInterpreterProfiles() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connected");

    // Find all interpreters
    const interpreters = await User.findAll({
      where: { role: "interpreter" },
      include: [
        {
          model: InterpreterProfile,
          as: "interpreterProfile",
          required: false,
        },
      ],
    });

    console.log(`\n📊 Found ${interpreters.length} total interpreters`);

    // Find interpreters without profile
    const interpretersWithoutProfile = interpreters.filter(
      (interpreter) => !interpreter.interpreterProfile
    );

    console.log(
      `🔍 Found ${interpretersWithoutProfile.length} interpreters without profile\n`
    );

    if (interpretersWithoutProfile.length === 0) {
      console.log("✅ All interpreters already have profiles!");
      process.exit(0);
    }

    // Create profiles for interpreters without one
    for (const interpreter of interpretersWithoutProfile) {
      console.log(
        `Creating profile for: ${interpreter.fullName} (ID: ${interpreter.id})`
      );

      await InterpreterProfile.create({
        userId: interpreter.id,
        languages: JSON.stringify(["English", "Vietnamese"]),
        specializations: JSON.stringify(["Business", "Legal", "Medical"]),
        experience: 2,
        hourlyRate: 25.0,
        currency: "USD",
        availability: JSON.stringify({
          monday: ["morning", "afternoon"],
          tuesday: ["morning", "afternoon"],
          wednesday: ["morning", "afternoon"],
          thursday: ["morning", "afternoon"],
          friday: ["morning", "afternoon"],
        }),
        certifications: JSON.stringify([]),
        portfolio: "Professional interpreter with diverse experience",
        rating: 4.5,
        totalReviews: 10,
        completedJobs: 15,
        isAvailable: true,
        verificationStatus: "pending",
        profileCompleteness: 80,
      });

      console.log(`✓ Created profile for ${interpreter.fullName}`);
    }

    console.log(
      `\n✅ Successfully created ${interpretersWithoutProfile.length} interpreter profiles!`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addMissingInterpreterProfiles();
