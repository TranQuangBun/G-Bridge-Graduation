import { sequelize } from "./src/config/database.js";

const languages = [
  { id: 1, name: "English" },
  { id: 2, name: "Vietnamese" },
  { id: 3, name: "French" },
  { id: 4, name: "Spanish" },
  { id: 5, name: "Chinese" },
  { id: 6, name: "Japanese" },
  { id: 7, name: "Korean" },
];

async function seedLanguages() {
  try {
    for (const lang of languages) {
      await sequelize.query(
        `INSERT INTO languages (id, name, createdAt, updatedAt) 
         VALUES (?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name = VALUES(name), updatedAt = NOW()`,
        {
          replacements: [lang.id, lang.name],
        }
      );
      console.log(`✓ Inserted/Updated: ${lang.name}`);
    }
    console.log("\n✅ All languages seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding languages:", error);
  } finally {
    await sequelize.close();
  }
}

seedLanguages();
