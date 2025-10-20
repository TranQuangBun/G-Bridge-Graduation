import { sequelize } from "../src/config/database.js";
import {
  User,
  InterpreterProfile,
  Language,
  Certification,
} from "../src/models/index.js";

async function testGetInterpreters() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connected\n");

    console.log(
      "Testing query with subQuery: false, distinct: true, col: 'id'\n"
    );

    const { count, rows: interpreters } = await User.findAndCountAll({
      where: { role: "interpreter", isActive: true },
      include: [
        {
          model: InterpreterProfile,
          as: "interpreterProfile",
          required: true,
        },
        {
          model: Language,
          as: "languages",
          attributes: ["id", "name", "proficiencyLevel", "yearsOfExperience"],
          required: false,
        },
        {
          model: Certification,
          as: "certifications",
          attributes: [
            "id",
            "name",
            "issuingOrganization",
            "issueDate",
            "score",
            "verificationStatus",
          ],
          required: false,
        },
      ],
      attributes: [
        "id",
        "fullName",
        "email",
        "phone",
        "address",
        "avatar",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: 12,
      offset: 0,
      subQuery: false,
      distinct: true,
      col: "id",
    });

    console.log(`📊 Count: ${count}`);
    console.log(`📊 Rows returned: ${interpreters.length}\n`);

    console.log("Interpreters:");
    interpreters.forEach((interpreter, index) => {
      console.log(
        `${index + 1}. ${interpreter.fullName} (ID: ${interpreter.id})`
      );
      console.log(`   Languages: ${interpreter.languages?.length || 0}`);
      console.log(
        `   Certifications: ${interpreter.certifications?.length || 0}`
      );
    });

    console.log("\n" + "=".repeat(60));
    console.log("Testing query WITHOUT distinct/subQuery settings:\n");

    const { count: count2, rows: interpreters2 } = await User.findAndCountAll({
      where: { role: "interpreter", isActive: true },
      include: [
        {
          model: InterpreterProfile,
          as: "interpreterProfile",
          required: true,
        },
        {
          model: Language,
          as: "languages",
          attributes: ["id", "name", "proficiencyLevel", "yearsOfExperience"],
          required: false,
        },
        {
          model: Certification,
          as: "certifications",
          attributes: [
            "id",
            "name",
            "issuingOrganization",
            "issueDate",
            "score",
            "verificationStatus",
          ],
          required: false,
        },
      ],
      attributes: [
        "id",
        "fullName",
        "email",
        "phone",
        "address",
        "avatar",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: 12,
      offset: 0,
    });

    console.log(`📊 Count: ${count2}`);
    console.log(`📊 Rows returned: ${interpreters2.length}\n`);

    console.log("Interpreters:");
    interpreters2.forEach((interpreter, index) => {
      console.log(
        `${index + 1}. ${interpreter.fullName} (ID: ${interpreter.id})`
      );
      console.log(`   Languages: ${interpreter.languages?.length || 0}`);
      console.log(
        `   Certifications: ${interpreter.certifications?.length || 0}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testGetInterpreters();
