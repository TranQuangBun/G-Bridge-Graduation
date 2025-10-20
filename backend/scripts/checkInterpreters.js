import { sequelize } from "../src/config/database.js";
import { User, InterpreterProfile } from "../src/models/index.js";

async function checkInterpreters() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connected\n");

    // Find all interpreters with profiles
    const interpreters = await User.findAll({
      where: { role: "interpreter", isActive: true },
      include: [
        {
          model: InterpreterProfile,
          as: "interpreterProfile",
          required: true, // Same as in getInterpreters
        },
      ],
      attributes: ["id", "fullName", "email", "isActive"],
    });

    console.log(
      `📊 Found ${interpreters.length} active interpreters with profiles:\n`
    );

    interpreters.forEach((interpreter, index) => {
      const profile = interpreter.interpreterProfile;
      console.log(
        `${index + 1}. ${interpreter.fullName} (ID: ${interpreter.id})`
      );
      console.log(`   Email: ${interpreter.email}`);
      console.log(`   Active: ${interpreter.isActive}`);
      console.log(`   Experience: ${profile?.experience || "NULL"} years`);
      console.log(`   Hourly Rate: $${profile?.hourlyRate || "NULL"}`);
      console.log(`   Rating: ${profile?.rating || "NULL"}`);
      console.log(`   Specializations: ${profile?.specializations || "NULL"}`);
      console.log(
        `   Profile Completeness: ${profile?.profileCompleteness || "NULL"}%`
      );
      console.log("");
    });

    // Check if any are missing critical fields
    const missingCriticalFields = interpreters.filter((interpreter) => {
      const profile = interpreter.interpreterProfile;
      return (
        !profile ||
        profile.experience === null ||
        profile.hourlyRate === null ||
        profile.rating === null
      );
    });

    if (missingCriticalFields.length > 0) {
      console.log(
        `⚠️  ${missingCriticalFields.length} interpreters missing critical fields:`
      );
      missingCriticalFields.forEach((interpreter) => {
        console.log(`   - ${interpreter.fullName} (ID: ${interpreter.id})`);
      });
    } else {
      console.log("✅ All interpreters have complete critical fields!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkInterpreters();
