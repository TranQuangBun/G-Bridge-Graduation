import { sequelize } from "./src/config/database.js";

async function fixForeignKey() {
  try {
    console.log("🔧 Fixing job_required_languages references...\n");

    // Step 1: Xóa các records cũ (vì chưa có job thực tế)
    console.log("1. Deleting old job_required_languages records...");
    await sequelize.query("DELETE FROM job_required_languages");
    console.log("✓ Deleted\n");

    // Step 2: Check existing constraints
    console.log("2. Checking existing constraints...");
    const [constraints] = await sequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = 'gbridge_db' 
      AND TABLE_NAME = 'job_required_languages' 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    console.log("Existing constraints:", constraints);

    // Drop each constraint
    for (const constraint of constraints) {
      console.log(`Dropping ${constraint.CONSTRAINT_NAME}...`);
      try {
        await sequelize.query(`
          ALTER TABLE job_required_languages 
          DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
        `);
        console.log(`✓ Dropped ${constraint.CONSTRAINT_NAME}`);
      } catch (err) {
        console.log(
          `⚠️  Could not drop ${constraint.CONSTRAINT_NAME}: ${err.message}`
        );
      }
    }

    // Step 3: Add new foreign key to master_languages
    console.log("\n3. Adding new foreign key to master_languages...");
    await sequelize.query(`
      ALTER TABLE job_required_languages
      ADD CONSTRAINT job_required_languages_ibfk_language
      FOREIGN KEY (languageId) REFERENCES master_languages (id)
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    console.log("✓ Added\n");

    console.log("✅ Successfully fixed foreign key references!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

fixForeignKey();
